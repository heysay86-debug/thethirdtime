/**
 * 05. 주별 심층 분석 — PillarAnalysisSection
 *
 * 연주·월주·일주·시주 각각의 천간·지지·십성·지장간을
 * 카드 형태로 배치하고, LLM 해석문을 덧붙인다.
 */

import React from 'react';
import { View, Text, Image } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToOhaeng, jiToOhaeng, ohaengColor, sipseongColor } from '../../utils/ohaeng';
import { ganToIconPath, jiToIconPath } from '../../utils/iconPath';
import { ganToKorean, jiToKorean, ganjiLabel, ohaengToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';
import type { InterpretationResult } from '../../../gateway/prompts/schema';

// ─── 상수 ────────────────────────────────────────────────────

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const;
const PILLAR_LABELS: Record<string, string> = {
  year: '연주', month: '월주', day: '일주', hour: '시주',
};
const PILLAR_NUM: Record<string, string> = {
  year: '01', month: '02', day: '03', hour: '04',
};

const ROLE_LABEL: Record<string, string> = { 정기: '정', 중기: '중', 여기: '여' };
const ROLE_ORDER: Record<string, number> = { 정기: 0, 중기: 1, 여기: 2 };

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

  // ── 주(柱) 카드 ──
  pillarCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 14, marginBottom: 12,
  },
  pillarHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10,
  },
  pillarBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1,
  },
  pillarName: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg,
  },
  pillarGanji: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textMuted,
  },

  // ── 간지 상세 행 ──
  detailRow: {
    flexDirection: 'row', gap: 12, marginBottom: 8,
  },
  detailBlock: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 3,
    paddingVertical: 6, paddingHorizontal: 10,
  },
  detailIcon: { width: 22, height: 22 },
  detailTextWrap: { flex: 1 },
  detailLabel: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
  },
  detailSub: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted,
  },

  // ── 지장간 행 ──
  jjRow: {
    flexDirection: 'row', gap: 8, marginBottom: 8,
  },
  jjChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 3,
    paddingVertical: 3, paddingHorizontal: 8,
  },
  jjIcon: { width: 12, height: 12 },
  jjText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.textBody,
  },
  jjRole: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300,
    color: colors.textMuted,
  },

  // ── 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 8,
  },
  divider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginVertical: 14,
  },
});

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface PillarAnalysisSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function PillarAnalysisSection({ sajuResult, interpretation }: PillarAnalysisSectionProps) {
  const { pillars, tenGods, jijanggan } = sajuResult;
  const { pillarAnalysis } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  // 십성 매핑 (천간)
  const ganTenGods: Record<string, string> = {
    year: tenGods.yearGan, month: tenGods.monthGan, day: '비견(일간)', hour: tenGods.hourGan ?? '',
  };
  // 십성 매핑 (지지)
  const jiTenGods: Record<string, string> = {
    year: tenGods.yearJi, month: tenGods.monthJi, day: tenGods.dayJi, hour: tenGods.hourJi ?? '',
  };

  const pillarData = PILLAR_KEYS.map(key => {
    const pillar = key === 'hour' ? pillars.hour : pillars[key];
    const jj = key === 'hour' ? (jijanggan.hour ?? []) : jijanggan[key];
    const reading = (pillarAnalysis as any)[key] as string | null;
    return { key, pillar, jj, reading };
  }).filter(d => d.pillar != null);

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>05</Text>
        <Text style={commonStyles.sectionTitle}>주별 심층 분석</Text>
        <Text style={commonStyles.sectionSubtitle}>연주 · 월주 · 일주 · 시주</Text>
        <View style={s.titleDivider} />

        {/* 연주 · 월주 (첫 페이지) */}
        {pillarData.slice(0, 2).map((d, idx) => (
          <React.Fragment key={d.key}>
            {idx > 0 && <View style={s.divider} />}
            <PillarCard
              pillarKey={d.key}
              pillar={d.pillar!}
              ganTenGod={ganTenGods[d.key]}
              jiTenGod={jiTenGods[d.key]}
              jj={d.jj}
              reading={d.reading}
            />
          </React.Fragment>
        ))}
      </PageLayout>

      <PageLayout>
        {/* 일주 · 시주 (두 번째 페이지) */}
        {pillarData.slice(2).map((d, idx) => (
          <React.Fragment key={d.key}>
            {idx > 0 && <View style={s.divider} />}
            <PillarCard
              pillarKey={d.key}
              pillar={d.pillar!}
              ganTenGod={ganTenGods[d.key]}
              jiTenGod={jiTenGods[d.key]}
              jj={d.jj}
              reading={d.reading}
            />
          </React.Fragment>
        ))}
      </PageLayout>
    </>
  );
}

// ─── 개별 주(柱) 카드 ────────────────────────────────────────

interface PillarCardProps {
  pillarKey: string;
  pillar: { gan: string; ji: string };
  ganTenGod: string;
  jiTenGod: string;
  jj: Array<{ stem: string; role: string; days: number; strength: number }>;
  reading: string | null;
}

function PillarCard({ pillarKey, pillar, ganTenGod, jiTenGod, jj, reading }: PillarCardProps) {
  const ganOh = ganToOhaeng(pillar.gan);
  const jiOh = jiToOhaeng(pillar.ji);
  const sortedJj = [...jj].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9));
  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);

  return (
    <View style={s.pillarCard}>
      {/* 헤더 */}
      <View style={s.pillarHeader}>
        <Text style={s.pillarBadge}>{PILLAR_NUM[pillarKey]}</Text>
        <Text style={s.pillarName}>{PILLAR_LABELS[pillarKey]}</Text>
        <Text style={s.pillarGanji}>{ganjiLabel(pillar.gan, pillar.ji)}</Text>
      </View>

      {/* 천간 / 지지 상세 */}
      <View style={s.detailRow}>
        {/* 천간 */}
        <View style={s.detailBlock}>
          <Image src={ganToIconPath(pillar.gan)} style={s.detailIcon} />
          <View style={s.detailTextWrap}>
            <Text style={s.detailLabel}>천간</Text>
            <Text style={[s.detailValue, { color: ohaengColor(ganOh) }]}>
              {pillar.gan}({ganToKorean(pillar.gan)}) · {ohaengToKorean(ganOh)}
            </Text>
            <Text style={[s.detailSub, { color: sipseongColor(ganTenGod) }]}>{ganTenGod}</Text>
          </View>
        </View>
        {/* 지지 */}
        <View style={s.detailBlock}>
          <Image src={jiToIconPath(pillar.ji)} style={s.detailIcon} />
          <View style={s.detailTextWrap}>
            <Text style={s.detailLabel}>지지</Text>
            <Text style={[s.detailValue, { color: ohaengColor(jiOh) }]}>
              {pillar.ji}({jiToKorean(pillar.ji)}) · {ohaengToKorean(jiOh)}
            </Text>
            <Text style={[s.detailSub, { color: sipseongColor(jiTenGod) }]}>{jiTenGod}</Text>
          </View>
        </View>
      </View>

      {/* 지장간 */}
      <View style={s.jjRow}>
        {sortedJj.map(entry => (
          <View key={entry.role} style={s.jjChip}>
            <Image src={ganToIconPath(entry.stem)} style={s.jjIcon} />
            <Text style={s.jjText}>{entry.stem}({ganToKorean(entry.stem)})</Text>
            <Text style={s.jjRole}>{ROLE_LABEL[entry.role] ?? entry.role} {entry.days}일</Text>
          </View>
        ))}
      </View>

      {/* LLM 해석문 */}
      {reading && toParagraphs(reading).map((p, i) => (
        <Text key={i} style={s.interpretText}>{p}</Text>
      ))}
    </View>
  );
}
