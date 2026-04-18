/**
 * 07. 십성 분석 — SipseongAnalysisSection
 *
 * 8자 십성 배치를 시각적으로 표시하고 LLM 해석문을 배치한다.
 * 유파별 관점이 있으면 함께 렌더링.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { sipseongColor, sipseongCategory } from '../../utils/ohaeng';
import { ganToKorean, jiToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 십성 카테고리 한글명 ────────────────────────────────────

const CATEGORY_LABEL: Record<string, string> = {
  bigyeon: '비겁(比劫)', sik: '식상(食傷)', jae: '재성(財星)',
  gwan: '관성(官星)', in: '인성(印星)',
};

const CATEGORY_DESC: Record<string, string> = {
  bigyeon: '자아 · 경쟁 · 독립',
  sik: '표현 · 창작 · 기술',
  jae: '재물 · 실리 · 현실 감각',
  gwan: '명예 · 질서 · 책임',
  in: '학문 · 지혜 · 보호',
};

// ─── 스타일 ───────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 4,
  },
  titleDivider: {
    width: 32, height: 0.5, backgroundColor: colors.goldDim,
    marginTop: 8, marginBottom: 14,
  },
  subTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg, marginBottom: 10,
  },
  subDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14, marginTop: 6,
  },

  // ── 십성 배치 테이블 ──
  tableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
  },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  tableRowLast: { flexDirection: 'row' },
  tableHeaderCell: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
    backgroundColor: 'rgba(104,128,151,0.06)',
  },
  tableHeaderText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.5,
  },
  tableCell: {
    flex: 1, paddingVertical: 6, alignItems: 'center',
  },
  tableCellText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
  },
  tableCellSub: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted,
  },
  labelCell: {
    width: 38, paddingVertical: 6, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 0.5, borderRightColor: colors.goldDim,
  },
  labelText: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 0.5,
  },

  // ── 카테고리 요약 ──
  catRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 14 },
  catCard: {
    flex: 1, minWidth: 80, backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    paddingVertical: 8, paddingHorizontal: 10, alignItems: 'center',
  },
  catLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 600,
    marginBottom: 2,
  },
  catCount: {
    fontFamily: 'Paperlogy', fontSize: fontSize.lg, fontWeight: 700,
    color: colors.darkBg,
  },
  catDesc: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300,
    color: colors.textMuted, marginTop: 2,
  },

  // ── 유파별 관점 ──
  perspCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 12, marginBottom: 8,
  },
  perspSchool: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.8, marginBottom: 4,
  },
  perspContent: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7,
  },

  // ── 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },
});

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface SipseongAnalysisSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function SipseongAnalysisSection({ sajuResult, interpretation }: SipseongAnalysisSectionProps) {
  const { pillars, tenGods } = sajuResult;
  const { sipseongAnalysis } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // 십성 배치 테이블 데이터
  const cols = [
    { label: '시주', gan: pillars.hour?.gan ?? '', ji: pillars.hour?.ji ?? '', ganTG: tenGods.hourGan ?? '', jiTG: tenGods.hourJi ?? '' },
    { label: '일주', gan: pillars.day.gan, ji: pillars.day.ji, ganTG: '일간', jiTG: tenGods.dayJi },
    { label: '월주', gan: pillars.month.gan, ji: pillars.month.ji, ganTG: tenGods.monthGan, jiTG: tenGods.monthJi },
    { label: '연주', gan: pillars.year.gan, ji: pillars.year.ji, ganTG: tenGods.yearGan, jiTG: tenGods.yearJi },
  ];

  // 카테고리별 개수
  const allTenGods = [
    tenGods.yearGan, tenGods.monthGan, tenGods.hourGan,
    tenGods.yearJi, tenGods.monthJi, tenGods.dayJi, tenGods.hourJi,
  ].filter(Boolean) as string[];

  const catCount: Record<string, number> = { bigyeon: 1, sik: 0, jae: 0, gwan: 0, in: 0 }; // 비견(일간) 1개 기본
  for (const tg of allTenGods) {
    const cat = sipseongCategory(tg);
    catCount[cat]++;
  }

  return (
    <PageLayout showStamp>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>07</Text>
      <Text style={commonStyles.sectionTitle}>십성 분석</Text>
      <Text style={commonStyles.sectionSubtitle}>십신(十神) 배치 · 심리 구조</Text>
      <View style={s.titleDivider} />

      {/* ═══ 십성 배치 테이블 ═══ */}
      <Text style={s.subTitle}>원국 십성 배치</Text>
      <View style={s.tableWrap}>
        {/* 헤더 */}
        <View style={s.tableRow}>
          <View style={s.labelCell}><Text style={s.labelText}> </Text></View>
          {cols.map(c => (
            <View key={c.label} style={s.tableHeaderCell}>
              <Text style={s.tableHeaderText}>{c.label}</Text>
            </View>
          ))}
        </View>
        {/* 천간 십성 */}
        <View style={s.tableRow}>
          <View style={s.labelCell}><Text style={s.labelText}>천간</Text></View>
          {cols.map(c => (
            <View key={c.label} style={s.tableCell}>
              <Text style={[s.tableCellText, { color: c.ganTG === '일간' ? colors.blueGray : sipseongColor(c.ganTG) }]}>
                {c.gan ? c.ganTG : '—'}
              </Text>
              {c.gan ? <Text style={s.tableCellSub}>{c.gan}({ganToKorean(c.gan)})</Text> : null}
            </View>
          ))}
        </View>
        {/* 지지 십성 */}
        <View style={s.tableRowLast}>
          <View style={s.labelCell}><Text style={s.labelText}>지지</Text></View>
          {cols.map(c => (
            <View key={c.label} style={s.tableCell}>
              <Text style={[s.tableCellText, { color: sipseongColor(c.jiTG) }]}>
                {c.ji ? c.jiTG : '—'}
              </Text>
              {c.ji ? <Text style={s.tableCellSub}>{c.ji}({jiToKorean(c.ji)})</Text> : null}
            </View>
          ))}
        </View>
      </View>

      {/* ═══ 카테고리 요약 카드 ═══ */}
      <View style={s.catRow}>
        {Object.entries(catCount).map(([cat, cnt]) => (
          <View key={cat} style={s.catCard}>
            <Text style={[s.catLabel, { color: sipseongColor(cat === 'bigyeon' ? '비견' : cat === 'sik' ? '식신' : cat === 'jae' ? '편재' : cat === 'gwan' ? '편관' : '편인') }]}>
              {CATEGORY_LABEL[cat]}
            </Text>
            <Text style={s.catCount}>{cnt}</Text>
            <Text style={s.catDesc}>{CATEGORY_DESC[cat]}</Text>
          </View>
        ))}
      </View>

      <View style={s.subDivider} />

      {/* ═══ LLM 해석문 ═══ */}
      {toParagraphs(sipseongAnalysis.reading).map((p, i) => (
        <Text key={i} style={s.interpretText}>{p}</Text>
      ))}

      {/* ═══ 유파별 관점 ═══ */}
      {sipseongAnalysis.perspectives && sipseongAnalysis.perspectives.length > 0 && (
        <>
          <View style={s.subDivider} />
          <Text style={s.subTitle}>유파별 관점</Text>
          {sipseongAnalysis.perspectives.map((persp, i) => (
            <View key={i} style={s.perspCard}>
              <Text style={s.perspSchool}>{persp.school}</Text>
              <Text style={s.perspContent}>{persp.content}</Text>
            </View>
          ))}
        </>
      )}
    </PageLayout>
  );
}
