/**
 * 05. 주별 심층 분석 — PillarAnalysisSection
 *
 * 연주+월주 한 카드, 일주+시주 한 카드
 * 각 카드: 좌(두 주의 천간·지지·지장간) + 우(자연어 해석)
 * LLM 불필요 — 키워드 테이블 기반 결정적 생성
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToOhaeng, jiToOhaeng, ohaengColor, sipseongColor } from '../../utils/ohaeng';
import { ganToKorean, jiToKorean, ganjiLabel, ohaengToKorean } from '../../utils/koreanReading';
import { buildPillarReading } from '../../utils/pillarKeywords';

import type { SajuResult } from '@engine/schema';

const PILLAR_KEYS = ['year', 'month', 'day', 'hour'] as const;
const PILLAR_LABELS: Record<string, string> = { year: '연주', month: '월주', day: '일주', hour: '시주' };

const s = StyleSheet.create({
  sectionBadge: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300,
    color: colors.blueGray, letterSpacing: 1.5, marginBottom: 4,
  },
  titleDivider: {
    width: 32, height: 0.5, backgroundColor: colors.goldDim,
    marginTop: 6, marginBottom: 12,
  },

  // 페어 카드
  pairCard: {
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    marginBottom: 14, overflow: 'hidden',
  },
  pairHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: 'rgba(104,128,151,0.06)',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  pairTitle: { fontFamily: 'Paperlogy', fontSize: 11, fontWeight: 700, color: colors.darkBg },
  pairSub: { fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300, color: colors.textMuted },

  // 좌우 분할
  bodyRow: { flexDirection: 'row' },

  // 좌측: 두 주 나란히
  leftCol: {
    width: 140, borderRightWidth: 0.5, borderRightColor: colors.goldDim,
    flexDirection: 'row',
  },
  pillarCol: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 6, alignItems: 'center',
  },
  pillarDivider: {
    width: 0.5, backgroundColor: 'rgba(104,128,151,0.15)',
  },
  pillarLabel: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 600, color: colors.blueGray,
    marginBottom: 4,
  },

  // 천간/지지 블록
  ganjiBlock: {
    alignItems: 'center', marginBottom: 4,
  },
  blockLabel: { fontFamily: 'Paperlogy', fontSize: 6, fontWeight: 300, color: colors.blueGray, marginBottom: 1 },
  hanjaLarge: { fontFamily: 'Paperlogy', fontSize: 18, fontWeight: 700 },
  koreanSub: { fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300, color: colors.textMuted },
  sipseongText: { fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 600, marginTop: 1 },


  // 십이운성
  stageText: { fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 400, color: colors.blueGray, marginTop: 3 },

  // 우측: 해석
  rightCol: {
    flex: 1, paddingVertical: 8, paddingHorizontal: 10,
  },
  readingText: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7, marginBottom: 6,
  },
  readingLabel: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 700,
    color: colors.darkBg, marginBottom: 2,
  },
});

interface Props {
  sajuResult: SajuResult;
}

interface PillarData {
  key: string;
  pillar: { gan: string; ji: string };
  ganTG: string;
  jiTG: string;
  stage: string;
  reading: string;
}

export default function PillarAnalysisSection({ sajuResult }: Props) {
  const { pillars, tenGods, twelveStages } = sajuResult;

  const ganTenGods: Record<string, string> = {
    year: tenGods.yearGan, month: tenGods.monthGan, day: '비견(일간)', hour: tenGods.hourGan ?? '',
  };
  const jiTenGods: Record<string, string> = {
    year: tenGods.yearJi, month: tenGods.monthJi, day: tenGods.dayJi, hour: tenGods.hourJi ?? '',
  };
  const stages: Record<string, string> = {
    year: twelveStages.year, month: twelveStages.month,
    day: twelveStages.day, hour: twelveStages.hour ?? '',
  };

  const pillarData: PillarData[] = PILLAR_KEYS.map(key => {
    const pillar = key === 'hour' ? pillars.hour : pillars[key];
    if (!pillar) return null;
    const reading = buildPillarReading({
      position: key,
      gan: pillar.gan,
      ji: pillar.ji,
      ganTenGod: ganTenGods[key],
      jiTenGod: jiTenGods[key],
      twelveStage: stages[key],
    });
    return { key, pillar, ganTG: ganTenGods[key], jiTG: jiTenGods[key], stage: stages[key], reading };
  }).filter(d => d != null) as PillarData[];

  // 연주+월주, 일주+시주 페어
  const pair1 = pillarData.filter(d => d.key === 'year' || d.key === 'month');
  const pair2 = pillarData.filter(d => d.key === 'day' || d.key === 'hour');

  return (
    <>
      <PageLayout showStamp>
        <Text style={s.sectionBadge}>05</Text>
        <Text style={commonStyles.sectionTitle}>주별 심층 분석</Text>
        <Text style={commonStyles.sectionSubtitle}>연주 · 월주 · 일주 · 시주</Text>
        <View style={s.titleDivider} />

        <PairCard pair={pair1} title="연주 · 월주" subtitle="유년기~청년기 · 조상·부모·직업" />
        <PairCard pair={pair2} title="일주 · 시주" subtitle="장년기~노년기 · 배우자·자녀·결실" />
      </PageLayout>
    </>
  );
}

function PairCard({ pair, title, subtitle }: { pair: PillarData[]; title: string; subtitle: string }) {
  if (pair.length === 0) return null;

  return (
    <View style={s.pairCard}>
      <View style={s.pairHeader}>
        <Text style={s.pairTitle}>{title}</Text>
        <Text style={s.pairSub}>{subtitle}</Text>
      </View>

      <View style={s.bodyRow}>
        {/* 좌측: 두 주 나란히 */}
        <View style={s.leftCol}>
          {pair.map((d, i) => (
            <React.Fragment key={d.key}>
              {i > 0 && <View style={s.pillarDivider} />}
              <PillarColumn data={d} />
            </React.Fragment>
          ))}
        </View>

        {/* 우측: 각 주의 해석 */}
        <View style={s.rightCol}>
          {pair.map((d) => (
            <View key={d.key} style={{ marginBottom: 6 }}>
              <Text style={s.readingLabel}>{PILLAR_LABELS[d.key]} {ganjiLabel(d.pillar.gan, d.pillar.ji)}</Text>
              <Text style={s.readingText}>{d.reading}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

function PillarColumn({ data }: { data: PillarData }) {
  const ganOh = ganToOhaeng(data.pillar.gan);
  const jiOh = jiToOhaeng(data.pillar.ji);
  return (
    <View style={s.pillarCol}>
      <Text style={s.pillarLabel}>{PILLAR_LABELS[data.key]}</Text>

      {/* 천간 */}
      <View style={s.ganjiBlock}>
        <Text style={s.blockLabel}>천간</Text>
        <Text style={[s.hanjaLarge, { color: ohaengColor(ganOh) }]}>{data.pillar.gan}</Text>
        <Text style={s.koreanSub}>{ganToKorean(data.pillar.gan)} · {ohaengToKorean(ganOh)}</Text>
        <Text style={[s.sipseongText, { color: sipseongColor(data.ganTG) }]}>{data.ganTG}</Text>
      </View>

      {/* 지지 */}
      <View style={s.ganjiBlock}>
        <Text style={s.blockLabel}>지지</Text>
        <Text style={[s.hanjaLarge, { color: ohaengColor(jiOh) }]}>{data.pillar.ji}</Text>
        <Text style={s.koreanSub}>{jiToKorean(data.pillar.ji)} · {ohaengToKorean(jiOh)}</Text>
        <Text style={[s.sipseongText, { color: sipseongColor(data.jiTG) }]}>{data.jiTG}</Text>

      </View>

      {/* 십이운성 */}
      {data.stage && <Text style={s.stageText}>{data.stage}</Text>}
    </View>
  );
}
