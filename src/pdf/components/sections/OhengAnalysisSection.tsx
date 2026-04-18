/**
 * 06. 오행 분석 + 조후 — OhengAnalysisSection
 *
 * 오행 분포 데이터 시각화 + 조후(調候) 분석 + 유파별 관점
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { Svg, Rect, G, Text as SvgText } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToOhaeng, jiToOhaeng, ohaengColor } from '../../utils/ohaeng';
import { ohaengToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 상수 ────────────────────────────────────────────────────

const OHAENG_ORDER = ['木', '火', '土', '金', '水'] as const;

const OHAENG_COLORS: Record<string, string> = {
  木: colors.wood, 火: colors.fire, 土: colors.earth, 金: colors.metal, 水: colors.water,
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

  subSection: { marginBottom: 20 },
  subTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg, marginBottom: 10,
  },
  subDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14,
  },

  // ── 수평 바차트 ──
  barChartWrap: {
    marginBottom: 16,
  },
  barRow: {
    flexDirection: 'row', alignItems: 'center', marginBottom: 6,
  },
  barLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
    width: 32, textAlign: 'right', marginRight: 8,
  },
  barTrack: {
    flex: 1, height: 14, backgroundColor: 'rgba(104,128,151,0.06)',
    borderRadius: 3, overflow: 'hidden',
  },
  barFill: {
    height: 14, borderRadius: 3,
  },
  barCount: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 500,
    width: 24, textAlign: 'center', marginLeft: 6,
  },

  // ── 조후 카드 ──
  johuCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 14, marginBottom: 12,
  },
  johuLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1, marginBottom: 4,
  },
  johuText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7,
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

interface OhengAnalysisSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function OhengAnalysisSection({ sajuResult, interpretation }: OhengAnalysisSectionProps) {
  const { pillars } = sajuResult;
  const { ohengAnalysis } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // 오행 카운트 계산
  const ohaengCnt: Record<string, number> = { 木: 0, 火: 0, 土: 0, 金: 0, 水: 0 };
  const allPillars = [pillars.year, pillars.month, pillars.day, pillars.hour].filter(Boolean) as Array<{ gan: string; ji: string }>;
  for (const p of allPillars) {
    const go = ganToOhaeng(p.gan);
    const jo = jiToOhaeng(p.ji);
    if (go in ohaengCnt) ohaengCnt[go]++;
    if (jo in ohaengCnt) ohaengCnt[jo]++;
  }
  const maxCount = Math.max(...Object.values(ohaengCnt), 1);

  return (
    <PageLayout showStamp>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>06</Text>
      <Text style={commonStyles.sectionTitle}>오행 분석</Text>
      <Text style={commonStyles.sectionSubtitle}>오행 분포 · 조후(調候)</Text>
      <View style={s.titleDivider} />

      {/* ═══ ① 오행 분포 바차트 ═══ */}
      <View style={s.subSection}>
        <Text style={s.subTitle}>오행 분포</Text>

        <View style={s.barChartWrap}>
          {OHAENG_ORDER.map(oh => {
            const cnt = ohaengCnt[oh];
            const pct = (cnt / maxCount) * 100;
            const clr = OHAENG_COLORS[oh];
            return (
              <View key={oh} style={s.barRow}>
                <Text style={[s.barLabel, { color: clr }]}>{ohaengToKorean(oh)}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%`, backgroundColor: clr }]} />
                </View>
                <Text style={[s.barCount, { color: clr }]}>{cnt}</Text>
              </View>
            );
          })}
        </View>

        {/* 분포 해석문 */}
        {toParagraphs(ohengAnalysis.distribution).map((p, i) => (
          <Text key={i} style={s.interpretText}>{p}</Text>
        ))}
      </View>

      <View style={s.subDivider} />

      {/* ═══ ② 조후 ═══ */}
      <View style={s.subSection}>
        <Text style={s.subTitle}>조후 (調候)</Text>

        <View style={s.johuCard}>
          <Text style={s.johuLabel}>계절 · 온도 균형</Text>
          <Text style={s.johuText}>{ohengAnalysis.johu}</Text>
        </View>
      </View>

      {/* ═══ ③ 유파별 관점 (있을 경우) ═══ */}
      {ohengAnalysis.perspectives && ohengAnalysis.perspectives.length > 0 && (
        <>
          <View style={s.subDivider} />
          <View style={s.subSection}>
            <Text style={s.subTitle}>유파별 관점</Text>
            {ohengAnalysis.perspectives.map((persp, i) => (
              <View key={i} style={s.perspCard}>
                <Text style={s.perspSchool}>{persp.school}</Text>
                <Text style={s.perspContent}>{persp.content}</Text>
              </View>
            ))}
          </View>
        </>
      )}
    </PageLayout>
  );
}
