/**
 * 09. 대운 흐름 — DaeunSection
 *
 * 대운 타임라인 + 현재 대운 + 향후 세운 + LLM 해석문
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ohaengColor } from '../../utils/ohaeng';
import { ganjiLabel, ganToKorean, jiToKorean, ohaengToKorean } from '../../utils/koreanReading';
import { sipseongColor } from '../../utils/ohaeng';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 등급 색상 ────────────────────────────────────────────────

const RATING_COLOR: Record<string, string> = {
  대길: '#2d6a40', 길: '#4a7c59', 평: colors.blueGray, 흉: '#8a6820', 대흉: '#a83228',
};

const YONGSIN_REL_COLOR: Record<string, string> = {
  희신: '#2d6a40', 기신: '#a83228', 중립: colors.blueGray,
};

// ─── 스타일 ───────────────────────────────────────────────────

const s = StyleSheet.create({
  sectionBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 4,
  },
  titleDivider: {
    width: 32, height: 0.5, backgroundColor: colors.goldDim,
    marginTop: 8, marginBottom: 20,
  },
  subTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg, marginBottom: 10,
  },
  subDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14, marginTop: 6,
  },

  // ── 대운 방향 ──
  directionText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textMuted, marginBottom: 12,
  },

  // ── 대운 타임라인 테이블 ──
  tableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
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
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.3,
  },
  cell: {
    flex: 1, paddingVertical: 5, alignItems: 'center',
  },
  cellGanji: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
    color: colors.darkBg,
  },
  cellAge: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted,
  },
  cellRating: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
  },
  cellScore: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textMuted,
  },
  cellRelation: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 500,
  },

  // ── 세운 테이블 ──
  seunTableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 14,
  },

  // ── 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },
});

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface DaeunSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function DaeunSection({ sajuResult, interpretation }: DaeunSectionProps) {
  const { daeun, seun } = sajuResult;
  const { daeunReading } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  if (!daeun || !daeunReading) return null;

  const periods = daeun.periods;

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>09</Text>
        <Text style={commonStyles.sectionTitle}>대운 흐름</Text>
        <Text style={commonStyles.sectionSubtitle}>대운(大運) · 세운(歲運) · 운세 흐름</Text>
        <View style={s.titleDivider} />

        {/* ═══ 대운 방향 ═══ */}
        <Text style={s.directionText}>
          대운 방향: {daeun.direction} · 기운 시작 나이: {daeun.startAge}세
        </Text>

        {/* ═══ 대운 타임라인 ═══ */}
        <Text style={s.subTitle}>대운 타임라인</Text>

        <View style={s.tableWrap}>
          {/* 헤더 */}
          <View style={s.tableRow}>
            <View style={s.headerCell}><Text style={s.headerText}>대운</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>나이</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>천간 십성</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>지지 십성</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>용신 관계</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>점수</Text></View>
            <View style={s.headerCell}><Text style={s.headerText}>등급</Text></View>
          </View>

          {/* 대운 행 */}
          {periods.map((p, i) => {
            const isLast = i === periods.length - 1;
            const RowStyle = isLast ? s.tableRowLast : s.tableRow;
            const ratingClr = RATING_COLOR[p.analysis.rating] ?? colors.textBody;
            const relClr = YONGSIN_REL_COLOR[p.analysis.yongSinRelation] ?? colors.textBody;
            return (
              <View key={i} style={RowStyle}>
                <View style={s.cell}>
                  <Text style={s.cellGanji}>{p.gan}{p.ji}</Text>
                  <Text style={s.cellAge}>({ganToKorean(p.gan)}{jiToKorean(p.ji)})</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellAge}>{p.startAge}~{p.endAge}세</Text>
                </View>
                <View style={s.cell}>
                  <Text style={[s.cellRating, { color: sipseongColor(p.analysis.ganTenGod) }]}>{p.analysis.ganTenGod}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={[s.cellRating, { color: sipseongColor(p.analysis.jiTenGod) }]}>{p.analysis.jiTenGod}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={[s.cellRelation, { color: relClr }]}>{p.analysis.yongSinRelation}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={s.cellScore}>{p.analysis.score}</Text>
                </View>
                <View style={s.cell}>
                  <Text style={[s.cellRating, { color: ratingClr }]}>{p.analysis.rating}</Text>
                </View>
              </View>
            );
          })}
        </View>

        {/* 대운 해석 */}
        {toParagraphs(daeunReading.overview).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}

        <View style={s.subDivider} />

        {/* ═══ 현재 대운 ═══ */}
        <Text style={s.subTitle}>현재 대운</Text>
        {toParagraphs(daeunReading.currentPeriod).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </PageLayout>

      <PageLayout>
        {/* ═══ 세운 (향후 연운) ═══ */}
        <Text style={s.subTitle}>향후 세운</Text>

        {seun.length > 0 && (
          <View style={s.seunTableWrap}>
            {/* 헤더 */}
            <View style={s.tableRow}>
              <View style={s.headerCell}><Text style={s.headerText}>연도</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>세운</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>천간 십성</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>지지 십성</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>용신 관계</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>점수</Text></View>
              <View style={s.headerCell}><Text style={s.headerText}>등급</Text></View>
            </View>

            {seun.map((sy, i) => {
              const isLast = i === seun.length - 1;
              const RowStyle = isLast ? s.tableRowLast : s.tableRow;
              const ratingClr = RATING_COLOR[sy.analysis.rating] ?? colors.textBody;
              const relClr = YONGSIN_REL_COLOR[sy.analysis.yongSinRelation] ?? colors.textBody;
              return (
                <View key={i} style={RowStyle}>
                  <View style={s.cell}><Text style={s.cellGanji}>{sy.year}</Text></View>
                  <View style={s.cell}>
                    <Text style={s.cellGanji}>{sy.gan}{sy.ji}</Text>
                    <Text style={s.cellAge}>({ganToKorean(sy.gan)}{jiToKorean(sy.ji)})</Text>
                  </View>
                  <View style={s.cell}>
                    <Text style={[s.cellRating, { color: sipseongColor(sy.analysis.ganTenGod) }]}>{sy.analysis.ganTenGod}</Text>
                  </View>
                  <View style={s.cell}>
                    <Text style={[s.cellRating, { color: sipseongColor(sy.analysis.jiTenGod) }]}>{sy.analysis.jiTenGod}</Text>
                  </View>
                  <View style={s.cell}>
                    <Text style={[s.cellRelation, { color: relClr }]}>{sy.analysis.yongSinRelation}</Text>
                  </View>
                  <View style={s.cell}><Text style={s.cellScore}>{sy.analysis.score}</Text></View>
                  <View style={s.cell}>
                    <Text style={[s.cellRating, { color: ratingClr }]}>{sy.analysis.rating}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={s.subDivider} />

        {/* 향후 전망 해석 */}
        <Text style={s.subTitle}>향후 전망</Text>
        {toParagraphs(daeunReading.upcoming).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </PageLayout>
    </>
  );
}
