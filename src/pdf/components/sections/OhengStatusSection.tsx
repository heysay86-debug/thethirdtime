/**
 * 오행 발달/과다/고립 + 왕상휴수사 해설 — OhengStatusSection
 *
 * sajuResult.ohengAnalysis 데이터를 기반으로
 * 왕상휴수사 테이블 + 발달/과다/고립 상세 카드를 렌더링한다. (LLM 불필요)
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { OHENG_KEYWORDS, WANG_SANG_LABELS } from '@engine/oheng_analysis';
import type { WangSangState } from '@engine/oheng_analysis';

import type { SajuResult } from '@engine/schema';

// ── 오행 색상 ──

const ELEMENT_COLOR: Record<string, string> = {
  '木': '#2d6a40', '火': '#a83228', '土': '#8a6820', '金': '#4a6275', '水': '#1e4a7a',
};
const ELEMENT_KOREAN: Record<string, string> = {
  '木': '목(木)', '火': '화(火)', '土': '토(土)', '金': '금(金)', '水': '수(水)',
};

// ── 왕상휴수사 색상 ──

const STATE_COLOR: Record<WangSangState, string> = {
  '旺': '#2d6a40', '相': '#4a7c59', '休': colors.blueGray, '囚': '#8a6820', '死': '#a83228',
};

// ── 레벨 색상·라벨 ──

const LEVEL_COLOR: Record<string, string> = {
  '발달': '#2d6a40', '과다': '#a83228', '고립': '#8a6820', '보통': colors.blueGray, '부족': colors.textMuted,
};

// ── 스타일 ──

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
  bodyText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7, marginBottom: 10,
  },

  // 왕상휴수사 테이블
  tableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 16,
  },
  tableRow: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  tableRowLast: { flexDirection: 'row' },
  headerCell: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
    backgroundColor: 'rgba(104,128,151,0.06)',
  },
  headerText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.3,
  },
  cell: {
    flex: 1, paddingVertical: 6, alignItems: 'center',
  },
  cellElement: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
  },
  cellState: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
  },
  cellCount: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.textMuted,
  },
  cellDesc: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted, marginTop: 1,
  },

  // 발달/과다/고립 카드
  statusCard: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 10,
  },
  statusHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 6, paddingHorizontal: 10,
    backgroundColor: 'rgba(104,128,151,0.06)',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  statusElement: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
  },
  statusBadge: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 600,
    paddingVertical: 2, paddingHorizontal: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(104,128,151,0.08)',
  },
  statusBody: {
    padding: 10,
  },
  statusDesc: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.6, marginBottom: 6,
  },
  keywordLabel: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
    color: colors.darkBg, marginBottom: 2, marginTop: 4,
  },
  keywordText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textBody, lineHeight: 1.5,
  },
});

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function OhengStatusSection({ sajuResult }: Props) {
  const analysis = sajuResult.ohengAnalysis;
  if (!analysis) return null;

  const { counts, statuses, monthElement } = analysis;

  // 보통이 아닌 주목할만한 오행
  const notableStatuses = statuses.filter(s => s.level !== '보통');

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>07</Text>
        <Text style={commonStyles.sectionTitle}>오행 상태 분석</Text>
        <Text style={commonStyles.sectionSubtitle}>왕상휴수사(旺相休囚死) 및 발달 · 과다 · 고립</Text>
        <View style={s.titleDivider} />

        <Text style={s.bodyText}>
          월지 본기 오행 {ELEMENT_KOREAN[monthElement]}을 기준으로 각 오행의 세력(왕상휴수사)을 판정합니다. 旺은 가장 강한 상태, 死는 가장 약한 상태를 나타냅니다.
        </Text>

        {/* 왕상휴수사 테이블 */}
        <Text style={s.subTitle}>왕상휴수사 배치</Text>
        <View style={s.tableWrap}>
          {/* 헤더 */}
          <View style={s.tableRow}>
            <View style={s.headerCell}><Text style={s.headerText}>오행</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>상태</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>본기 수</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>지장간 포함</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>의미</Text></View>
          </View>

          {/* 오행별 행 */}
          {counts.map((c, i) => {
            const isLast = i === counts.length - 1;
            const label = WANG_SANG_LABELS[c.state as WangSangState];
            return (
              <View key={c.element} style={isLast ? s.tableRowLast : s.tableRow}>
                <View style={s.cell}>
                  <Text style={[s.cellElement, { color: ELEMENT_COLOR[c.element] }]}>
                    {ELEMENT_KOREAN[c.element]}
                  </Text>
                </View>
                <View style={s.cell}>
                  <Text style={[s.cellState, { color: STATE_COLOR[c.state as WangSangState] }]}>
                    {c.state}({label?.korean})
                  </Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellCount}>{c.count}개</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellCount}>{c.withJijanggan.toFixed(1)}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellDesc}>{label?.desc}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 왕상휴수사 해설 */}
        <Text style={s.bodyText}>
          旺(왕)은 월령과 같은 오행으로 가장 힘이 강하고, 相(상)은 월령이 생해주어 왕성합니다. 休(휴)는 힘을 빼주는 상태, 囚(수)는 극당하면서 약해지는 상태, 死(사)는 극을 받아 가장 약한 상태입니다.
        </Text>
      </PageLayout>

      <PageLayout>
        {/* 발달/과다/고립 상세 */}
        <Text style={s.subTitle}>오행별 발달 상태</Text>
        <Text style={[s.bodyText, { marginBottom: 12 }]}>
          원국 내 오행 분포를 종합하여 발달, 과다, 고립, 부족 여부를 판정합니다.
        </Text>

        {notableStatuses.length === 0 ? (
          <Text style={s.bodyText}>모든 오행이 보통 수준으로, 특별히 과다하거나 부족한 오행이 없습니다.</Text>
        ) : (
          notableStatuses.map((st) => {
            const el = st.element as keyof typeof OHENG_KEYWORDS;
            const keywords = OHENG_KEYWORDS[el];
            const levelKey = st.level === '발달' ? 'developed' : st.level === '과다' ? 'excessive' : st.level === '고립' ? 'isolated' : null;

            return (
              <View key={st.element} style={s.statusCard}>
                <View style={s.statusHeader}>
                  <Text style={[s.statusElement, { color: ELEMENT_COLOR[st.element] }]}>
                    {ELEMENT_KOREAN[st.element]}
                  </Text>
                  <Text style={[s.statusBadge, { color: LEVEL_COLOR[st.level] }]}>
                    {st.level}
                  </Text>
                </View>
                <View style={s.statusBody}>
                  <Text style={s.statusDesc}>{st.description}</Text>

                  {levelKey && keywords[levelKey] && (
                    <>
                      <Text style={s.keywordLabel}>성격 키워드</Text>
                      <Text style={s.keywordText}>
                        {keywords[levelKey].personality.join(', ')}
                      </Text>
                      <Text style={s.keywordLabel}>건강 주의 영역</Text>
                      <Text style={s.keywordText}>
                        {keywords[levelKey].health}
                      </Text>
                    </>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* 보통 오행 요약 */}
        {statuses.filter(s => s.level === '보통').length > 0 && (
          <View style={{ marginTop: 6 }}>
            <Text style={s.keywordLabel}>보통 수준 오행</Text>
            <Text style={s.keywordText}>
              {statuses.filter(s => s.level === '보통').map(s => ELEMENT_KOREAN[s.element]).join(', ')}
            </Text>
          </View>
        )}
      </PageLayout>
    </>
  );
}
