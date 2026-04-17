/**
 * 03. 사주팔자 개요 — BasicsSection
 *
 * ┌──────────────────────────────────────┐
 * │ 원국 조견표 (행 기반 표)             │
 * │   시주 | 일주★ | 월주 | 연주        │
 * │   간지 한글 읽기                      │
 * │   천간 아이콘 / 십성                  │
 * │   ─── 구분선 ───                      │
 * │   지지 아이콘 / 십성                  │
 * │   ─── 구분선 ───                      │
 * │   지장간 (정기·중기·여기 아이콘)     │
 * │   신살                                │
 * ├──────────────────────────────────────┤
 * │ 오행 분포: 木(목)X  火(화)X  …       │ ← 1줄
 * ├──────────────────────────────────────┤
 * │ 합·충·형·해·파 관계 (시드 텍스트)   │
 * ├──────────────────────────────────────┤
 * │ 신강/신약 카드  |  격국 카드          │
 * ├──────────────────────────────────────┤
 * │ 소개 문장 (한자+한글 병기 형식)      │
 * │ LLM 해석문                            │
 * └──────────────────────────────────────┘
 *
 * 일주 강조: 좌우 굵은 선(1.2pt blueGray) — 색상 변경 없음
 * 한자 표기 규칙: 반드시 한글 읽기 병기 (壬水(임수), 丙寅(병인)년 등)
 */

import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToOhaeng, jiToOhaeng, sipseongColor } from '../../utils/ohaeng';
import { ganToIconPath, jiToIconPath } from '../../utils/iconPath';
import { ganjiReading } from '../../utils/koreanReading';
import { computeRelations } from '../../utils/computeRelations';
import OhengRadarPdf from '../OhengRadarPdf';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 상수 ────────────────────────────────────────────────────

const ICON_MAIN = 28;
const ICON_JJ   = 13;
const LABEL_W   = 38;
const DAY_IDX   = 1; // 시주(0) | 일주(1) | 월주(2) | 연주(3)

// ─── 색상 매핑 ────────────────────────────────────────────────

const STRENGTH_COLOR: Record<string, string> = {
  극강: '#a83228', 신강: '#8a6820', 중화: '#2d6a40', 신약: '#1e4a7a', 극약: '#4a6275',
};
const GYEOK_STATE_COLOR: Record<string, string> = {
  성격: '#2d6a40', 파격: '#a83228', 약화: '#8a6820',
};
const ROLE_ORDER: Record<string, number> = { 정기: 0, 중기: 1, 여기: 2 };
const ROLE_LABEL: Record<string, string>  = { 정기: '정', 중기: '중', 여기: '여' };

// ─── 스타일 ───────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 4,
  },
  titleDivider: {
    width: 32, height: 0.5, backgroundColor: colors.goldDim,
    marginTop: 8, marginBottom: 16,
  },

  // ── 표 ──
  tableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  rowLast: { flexDirection: 'row' },
  sectionDivRow: { height: 1, backgroundColor: colors.goldDim },

  // 레이블 열
  labelCell: {
    width: LABEL_W, paddingVertical: 3, paddingHorizontal: 4,
    alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 0.5, borderRightColor: colors.goldDim,
  },
  labelText: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 0.8,
  },
  headerLabelCell: {
    width: LABEL_W, borderRightWidth: 0.5, borderRightColor: colors.goldDim,
  },

  // 데이터 셀
  dataCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 3, paddingHorizontal: 4,
  },
  iconCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, paddingHorizontal: 4,
  },
  jjCell: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 5,
    paddingVertical: 3, paddingHorizontal: 4,
  },
  jjItem: { alignItems: 'center', gap: 2 },
  jjRoleText: {
    fontFamily: 'Paperlogy', fontSize: 6.5, fontWeight: 300, color: colors.textMuted,
  },

  // 헤더 셀
  headerCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 4, paddingHorizontal: 4,
  },
  headerText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: colors.blueGray, letterSpacing: 1.2,
  },
  headerTextDay: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 700,
    color: colors.blueGray, letterSpacing: 1.2,
  },

  // 간지 읽기 셀 (두 번째 헤더 행)
  readingCell: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 2, paddingHorizontal: 4,
  },
  readingText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.textMuted, letterSpacing: 0.5,
  },
  readingTextDay: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 500,
    color: colors.blueGray, letterSpacing: 0.5,
  },

  // 십성 뱃지
  sipseongWrap: {
    borderRadius: 3, paddingVertical: 2, paddingHorizontal: 6,
  },
  sipseongText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 500,
  },

  // 신살
  sinsalText: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textBody, textAlign: 'center', lineHeight: 1.5,
  },
  sinsalNone: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300, color: colors.textMuted,
  },

  // 없음 플레이스홀더
  emptyText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.textMuted,
  },

  // ── 출생정보 ──
  birthInfoText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.blueGray, textAlign: 'center' as const, letterSpacing: 0.5,
    marginTop: 8, marginBottom: 4,
  },

  // ── 관계 시드 텍스트 ──
  relationsWrap: {
    marginBottom: 14,
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, padding: 10,
  },
  relationsTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 1, marginBottom: 5, marginTop: 8,
  },
  relationsTitleFirst: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 1, marginBottom: 5,
  },
  relationsItem: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.6, marginBottom: 2,
  },
  relationsNone: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 300,
    color: colors.textMuted,
  },

  // ── 요약 카드 ──
  summaryRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  summaryCard: {
    flex: 1, backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, paddingVertical: 10, paddingHorizontal: 12,
  },
  summaryCardLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1, marginBottom: 4,
  },
  summaryCardValue: { fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700 },
  summaryCardSub: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.textMuted, marginTop: 2,
  },

  // ── LLM 해석 ──
  interpretDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14,
  },
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },
});

// ─── 열 테두리 계산 ───────────────────────────────────────────
// 시주(0) | 일주(1)★ | 월주(2) | 연주(3)
// 일주: 좌우 1.2pt blueGray / 시주: 우측 선 없음 / 월주: 우측 0.5pt / 연주: 우측 없음

function colBorder(colIdx: number): object {
  if (colIdx === DAY_IDX)
    return { borderLeftWidth: 1.2, borderLeftColor: colors.blueGray, borderRightWidth: 1.2, borderRightColor: colors.blueGray };
  if (colIdx === DAY_IDX - 1) return {};                                          // 시주
  if (colIdx < 3) return { borderRightWidth: 0.5, borderRightColor: colors.goldDim }; // 월주
  return {};                                                                        // 연주
}

// ─── 지지 관계를 위한 오행 래퍼 ──────────────────────────────

function ohaengOf(ch: string, kind: 'gan' | 'ji'): string {
  return kind === 'gan' ? ganToOhaeng(ch) : jiToOhaeng(ch);
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface BasicsSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
  userName: string;
  /** 성별 ('남' | '여') */
  gender: string;
}

export default function BasicsSection({ sajuResult, interpretation, userName, gender }: BasicsSectionProps) {
  const { pillars, tenGods, jijanggan, sinsal, strength, gyeokGuk, birth } = sajuResult;
  const { basics } = interpretation.sections;

  // ── 열 정의 (시주-일주-월주-연주) ──
  const cols = [
    { key: '시주', pillar: pillars.hour ?? null, ganTG: tenGods.hourGan ?? '', jiTG: tenGods.hourJi ?? '', jj: jijanggan.hour ?? [] },
    { key: '일주', pillar: pillars.day,           ganTG: '비견',               jiTG: tenGods.dayJi,         jj: jijanggan.day   },
    { key: '월주', pillar: pillars.month,          ganTG: tenGods.monthGan,     jiTG: tenGods.monthJi,       jj: jijanggan.month },
    { key: '연주', pillar: pillars.year,           ganTG: tenGods.yearGan,      jiTG: tenGods.yearJi,        jj: jijanggan.year  },
  ];

  // 신살 그룹핑
  const sinsalMap: Record<string, string[]> = { 시주: [], 일주: [], 월주: [], 연주: [] };
  sinsal.forEach(s => { if (sinsalMap[s.position]) sinsalMap[s.position].push(s.name); });

  // ── 관계 계산 ──
  const relations = computeRelations(pillars, ohaengOf);

  // ── 출생정보 라인 ──
  const birthDate = birth.solar;  // "1986-09-15"
  const birthTime = birth.time;   // "01:17"
  const [yyyy, mm, dd] = birthDate.split('-');
  const birthInfoLine = `${yyyy}년 ${parseInt(mm)}월 ${parseInt(dd)}일 ${birthTime} ${gender}명`;

  // ── LLM 해석문 단락 ──
  const descParagraphs = basics.description.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // ── 요약 카드 ──
  const strengthLv      = strength.level;
  const strengthColor   = STRENGTH_COLOR[strengthLv] ?? colors.textBody;
  const gyeokType       = gyeokGuk.type;
  const gyeokState      = gyeokGuk.state;
  const gyeokStateColor = GYEOK_STATE_COLOR[gyeokState] ?? colors.textBody;
  const strengthSub     = `점수 ${strength.score} · ${strength.wolryeong}`;
  const gyeokSub        = `${gyeokGuk.category} · ${gyeokState}`;

  // ── 관계 섹션 렌더 헬퍼 ──
  function RelSection({ title, items, first = false }: { title: string; items: string[]; first?: boolean }) {
    return (
      <>
        <Text style={first ? s.relationsTitleFirst : s.relationsTitle}>{title}</Text>
        {items.length > 0
          ? items.map((item, i) => <Text key={i} style={s.relationsItem}>• {item}</Text>)
          : <Text style={s.relationsNone}>해당 없음</Text>
        }
      </>
    );
  }

  const LabelCell = ({ label }: { label: string }) => (
    <View style={s.labelCell}><Text style={s.labelText}>{label}</Text></View>
  );

  return (
    <>
      {/* ═══════════ PAGE 1: 조견표 + 차트 ═══════════ */}
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>03</Text>
        <Text style={commonStyles.sectionTitle}>사주팔자 개요</Text>
        <Text style={commonStyles.sectionSubtitle}>원국(原局) · 십성 · 지장간 · 신살 · 관계</Text>
        <View style={s.titleDivider} />

        {/* ══════════════ 원국 조견표 ══════════════ */}
        <View style={s.tableWrap}>

          {/* 헤더 행 1: 시주|일주|월주|연주 */}
          <View style={s.row}>
            <View style={s.headerLabelCell} />
            {cols.map((col, i) => (
              <View key={col.key} style={[s.headerCell, colBorder(i) as any]}>
                <Text style={i === DAY_IDX ? s.headerTextDay : s.headerText}>{col.key}</Text>
              </View>
            ))}
          </View>

          {/* 헤더 행 2: 간지 한글 읽기 (경자, 임술 …) */}
          <View style={s.row}>
            <View style={s.headerLabelCell} />
            {cols.map((col, i) => (
              <View key={col.key} style={[s.readingCell, colBorder(i) as any]}>
                {col.pillar
                  ? <Text style={i === DAY_IDX ? s.readingTextDay : s.readingText}>
                      {ganjiReading(col.pillar.gan, col.pillar.ji)}
                    </Text>
                  : <Text style={s.emptyText}>—</Text>
                }
              </View>
            ))}
          </View>

          {/* ── 천간 블록 ── */}
          {/* 천간 아이콘 */}
          <View style={s.row}>
            <LabelCell label="천간" />
            {cols.map((col, i) => (
              <View key={col.key} style={[s.iconCell, colBorder(i) as any]}>
                {col.pillar
                  ? <Image src={ganToIconPath(col.pillar.gan)} style={{ width: ICON_MAIN, height: ICON_MAIN }} />
                  : <Text style={s.emptyText}>—</Text>
                }
              </View>
            ))}
          </View>

          {/* 천간 십성 */}
          <View style={s.row}>
            <LabelCell label="십성" />
            {cols.map((col, i) => {
              const isDay  = i === DAY_IDX;
              const label  = isDay ? '일간' : col.ganTG;
              const color  = isDay ? colors.blueGray : sipseongColor(col.ganTG);
              return (
                <View key={col.key} style={[s.dataCell, colBorder(i) as any]}>
                  <View style={s.sipseongWrap}>
                    <Text style={[s.sipseongText, { color }]}>{col.pillar || isDay ? label : '—'}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* ── 천간/지지 구분선 ── */}
          <View style={s.sectionDivRow} />

          {/* 지지 아이콘 */}
          <View style={s.row}>
            <LabelCell label="지지" />
            {cols.map((col, i) => (
              <View key={col.key} style={[s.iconCell, colBorder(i) as any]}>
                {col.pillar
                  ? <Image src={jiToIconPath(col.pillar.ji)} style={{ width: ICON_MAIN, height: ICON_MAIN }} />
                  : <Text style={s.emptyText}>—</Text>
                }
              </View>
            ))}
          </View>

          {/* 지지 십성 */}
          <View style={s.row}>
            <LabelCell label="십성" />
            {cols.map((col, i) => (
              <View key={col.key} style={[s.dataCell, colBorder(i) as any]}>
                {col.pillar
                  ? <View style={s.sipseongWrap}>
                      <Text style={[s.sipseongText, { color: sipseongColor(col.jiTG) }]}>{col.jiTG}</Text>
                    </View>
                  : <Text style={s.emptyText}>—</Text>
                }
              </View>
            ))}
          </View>

          {/* ── 지지/지장간 구분선 ── */}
          <View style={s.sectionDivRow} />

          {/* 지장간 */}
          <View style={s.row}>
            <LabelCell label="지장간" />
            {cols.map((col, i) => {
              const sorted = [...col.jj].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
              return (
                <View key={col.key} style={[s.jjCell, colBorder(i) as any]}>
                  {sorted.length === 0
                    ? <Text style={s.emptyText}>—</Text>
                    : sorted.map(entry => {
                        const iconPath = ganToIconPath(entry.stem);
                        return (
                          <View key={entry.role} style={s.jjItem}>
                            <Text style={s.jjRoleText}>{ROLE_LABEL[entry.role] ?? entry.role}</Text>
                            {iconPath
                              ? <Image src={iconPath} style={{ width: ICON_JJ, height: ICON_JJ }} />
                              : <Text style={s.jjRoleText}>{entry.stem}</Text>
                            }
                          </View>
                        );
                      })
                  }
                </View>
              );
            })}
          </View>

          {/* 신살 */}
          <View style={s.rowLast}>
            <LabelCell label="신살" />
            {cols.map((col, i) => {
              const names = sinsalMap[col.key] ?? [];
              return (
                <View key={col.key} style={[s.dataCell, { paddingVertical: 4 }, colBorder(i) as any]}>
                  {names.length > 0
                    ? <Text style={s.sinsalText}>{names.join('\n')}</Text>
                    : <Text style={s.sinsalNone}>—</Text>
                  }
                </View>
              );
            })}
          </View>
        </View>

        {/* ══════════════ 출생정보 ══════════════ */}
        <Text style={s.birthInfoText}>{birthInfoLine}</Text>

        {/* ══════════════ 오행 분포 (펜타곤 레이더 차트) ══════════════ */}
        <OhengRadarPdf distribution={relations.ohaengDistribution} />
      </PageLayout>

      {/* ═══════════ PAGE 2: 관계 + 카드 + 해석 ═══════════ */}
      <PageLayout>
        {/* ══════════════ 합·충·형·해·파 관계 시드 ══════════════ */}
        <View style={s.relationsWrap}>
          <RelSection title="[ 천간 관계 ]" first
            items={[...relations.cheonganHaps, ...relations.cheonganChungs]} />
          <RelSection title="[ 지지합 ]"
            items={[...relations.jijiHaps, ...relations.jijiSamhaps]} />
          <RelSection title="[ 지지충 ]"   items={relations.jijiChungs} />
          <RelSection title="[ 지지형 ]"   items={relations.jijiHyeongs} />
          <RelSection title="[ 지지해·파 ]" items={[...relations.jijiHaes, ...relations.jijiPas]} />
        </View>

        {/* ══════════════ 요약 카드 ══════════════ */}
        <View style={s.summaryRow}>
          <View style={s.summaryCard}>
            <Text style={s.summaryCardLabel}>신강 / 신약</Text>
            <Text style={[s.summaryCardValue, { color: strengthColor }]}>{strengthLv}</Text>
            <Text style={s.summaryCardSub}>{strengthSub}</Text>
          </View>
          <View style={s.summaryCard}>
            <Text style={s.summaryCardLabel}>격국</Text>
            <Text style={[s.summaryCardValue, { color: gyeokStateColor }]}>{gyeokType}</Text>
            <Text style={s.summaryCardSub}>{gyeokSub}</Text>
          </View>
        </View>

        {/* ══════════════ LLM 해석문 ══════════════ */}
        <View style={s.interpretDivider} />
        {descParagraphs.map((para, i) => (
          <Text key={i} style={s.interpretText}>{para}</Text>
        ))}
      </PageLayout>
    </>
  );
}
