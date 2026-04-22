/**
 * 10. 종합 해석 — OverallReadingSection
 *
 * 종합 해석 + 현대적 적용 + 유파별 보강 관점
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

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

  // ── 유파별 관점 ──
  perspCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 14, marginBottom: 10,
  },
  perspSchool: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.8, marginBottom: 6,
  },
  perspContent: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85,
  },

  // ── 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },

  // ── 요약 배너 ──
  summaryBanner: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 16, marginBottom: 20, alignItems: 'center',
  },
  summaryLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 6,
  },
  summaryText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 600,
    color: colors.darkBg, textAlign: 'center', lineHeight: 1.6,
  },
});

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface OverallReadingSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function OverallReadingSection({ sajuResult, interpretation }: OverallReadingSectionProps) {
  const { overallReading } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>11</Text>
        <Text style={commonStyles.sectionTitle}>종합 해석</Text>
        <Text style={commonStyles.sectionSubtitle}>명리학 종합 분석 · 현대적 적용</Text>
        <View style={s.titleDivider} />

        {/* ═══ 한 줄 총평 ═══ */}
        <View style={s.summaryBanner}>
          <Text style={s.summaryLabel}>총평</Text>
          <Text style={s.summaryText}>{interpretation.summary}</Text>
        </View>

        {/* ═══ ① 종합 분석 ═══ */}
        <Text style={s.subTitle}>종합 분석</Text>
        {toParagraphs(overallReading.primary).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}

        <View style={s.subDivider} />

        {/* ═══ ② 현대적 적용 ═══ */}
        <Text style={s.subTitle}>현대적 적용</Text>
        {toParagraphs(overallReading.modernApplication).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}

        {/* ═══ ③ 종합제언 (유저 맞춤, 있을 경우) ═══ */}
        {overallReading.advice && overallReading.advice.length > 0 && (
          <>
            <View style={{ width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginVertical: 14 }} />
            <Text style={s.subTitle}>종합제언</Text>
            {toParagraphs(overallReading.advice).map((p, i) => (
              <Text key={`adv-${i}`} style={s.interpretText}>{p}</Text>
            ))}
          </>
        )}
      </PageLayout>

      {/* ═══ ④ 유파별 보강 관점 (있을 경우) ═══ */}
      {overallReading.perspectives && overallReading.perspectives.length > 0 && (
        <PageLayout>
          <Text style={s.subTitle}>유파별 보강 관점</Text>
          {overallReading.perspectives.map((persp, i) => (
            <View key={i} style={s.perspCard}>
              <Text style={s.perspSchool}>{persp.school}</Text>
              <Text style={s.perspContent}>{persp.content}</Text>
            </View>
          ))}
        </PageLayout>
      )}
    </>
  );
}
