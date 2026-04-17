/**
 * 십이운성 분석 — TwelveStagesSection
 *
 * 일간 기준 4기둥 지지의 생왕사절 상태를 테이블로 표시하고
 * 각 운성의 의미를 간략히 해설한다.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToKorean, jiToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';

// ── 운성 해설 ──

const STAGE_DESC: Record<string, string> = {
  '장생': '새 생명이 태어나는 단계. 시작과 성장의 에너지가 충만합니다.',
  '목욕': '갓 태어난 아이를 씻기는 단계. 불안정하지만 새로움에 대한 호기심이 큽니다.',
  '관대': '성인이 되어 관을 쓰는 단계. 사회적 인정을 받기 시작하는 시기입니다.',
  '건록': '녹봉을 받는 단계. 능력이 안정되고 실질적 성과가 나타납니다.',
  '제왕': '왕의 자리. 에너지가 최고조에 달하며 주도적 위치에 서게 됩니다.',
  '쇠': '정점을 지나 서서히 내려오는 단계. 원숙하지만 힘이 줄기 시작합니다.',
  '병': '기운이 약해지는 단계. 내면의 성찰이 깊어지는 시기입니다.',
  '사': '활동이 멈추는 단계. 외적 움직임보다 내적 정리가 필요합니다.',
  '묘': '무덤에 묻히는 단계. 에너지가 저장되고 축적되는 시기입니다.',
  '절': '완전히 끊어지는 단계. 기존 방식의 종료와 새로운 시작을 암시합니다.',
  '태': '태아가 잉태되는 단계. 새로운 가능성이 품어지기 시작합니다.',
  '양': '태아가 자라나는 단계. 아직 드러나지 않지만 내면에서 힘이 키워집니다.',
};

// 운성 강약 분류
const STAGE_STRENGTH: Record<string, 'strong' | 'neutral' | 'weak'> = {
  '장생': 'strong', '관대': 'strong', '건록': 'strong', '제왕': 'strong',
  '목욕': 'neutral', '쇠': 'neutral', '태': 'neutral', '양': 'neutral',
  '병': 'weak', '사': 'weak', '묘': 'weak', '절': 'weak',
};

const strengthColor = (stage: string) => {
  const s = STAGE_STRENGTH[stage];
  if (s === 'strong') return colors.green;
  if (s === 'weak') return '#e9b8b7';
  return colors.blueGray;
};

// ── 스타일 ──

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

  // 테이블
  tableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 16,
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
    flex: 1, paddingVertical: 8, alignItems: 'center',
  },
  stageName: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
  },
  stageJi: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted, marginTop: 2,
  },

  // 해설 카드
  descCard: {
    flexDirection: 'row', marginBottom: 8,
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden',
  },
  descLabel: {
    width: 60, paddingVertical: 6, paddingHorizontal: 8,
    backgroundColor: 'rgba(104,128,151,0.06)',
    justifyContent: 'center',
  },
  descLabelText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
    textAlign: 'center',
  },
  descBody: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10,
    justifyContent: 'center',
  },
  descBodyText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textBody, lineHeight: 1.5,
  },
  descPosition: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300,
    color: colors.textMuted, marginTop: 1,
  },
});

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function TwelveStagesSection({ sajuResult }: Props) {
  const ts = sajuResult.twelveStages;
  if (!ts) return null;

  const { pillars } = sajuResult;
  const dayGan = pillars.day.gan;

  const columns = [
    { label: '시주', ji: pillars.hour?.ji, stage: ts.hour },
    { label: '일주', ji: pillars.day.ji, stage: ts.day },
    { label: '월주', ji: pillars.month.ji, stage: ts.month },
    { label: '연주', ji: pillars.year.ji, stage: ts.year },
  ];

  // 해설할 운성 (중복 제거, 순서 유지)
  const uniqueStages: string[] = [];
  for (const col of columns) {
    if (col.stage && !uniqueStages.includes(col.stage)) {
      uniqueStages.push(col.stage);
    }
  }

  return (
    <PageLayout>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>08</Text>
      <Text style={commonStyles.sectionTitle}>십이운성 분석</Text>
      <Text style={commonStyles.sectionSubtitle}>일간 기준 · 생왕사절(生旺死絶)</Text>
      <View style={s.titleDivider} />

      {/* 설명 */}
      <Text style={[commonStyles.bodyText, { marginBottom: 14 }]}>
        십이운성은 일간 {dayGan}({ganToKorean(dayGan)})의 기운이 각 지지에서 어떤 생명 주기에
        해당하는지를 보여줍니다. 장생에서 양까지 12단계로, 각 기둥의 지지가 일간에게 주는
        에너지의 성질을 나타냅니다.
      </Text>

      {/* 배치 테이블 */}
      <Text style={s.subTitle}>원국 십이운성 배치</Text>
      <View style={s.tableWrap}>
        {/* 헤더 */}
        <View style={s.tableRow}>
          {columns.map((col) => (
            <View key={col.label} style={s.tableHeaderCell}>
              <Text style={s.tableHeaderText}>{col.label}</Text>
            </View>
          ))}
        </View>
        {/* 지지 */}
        <View style={s.tableRow}>
          {columns.map((col) => (
            <View key={`ji-${col.label}`} style={s.tableCell}>
              <Text style={[s.stageJi, { fontSize: fontSize.sm }]}>
                {col.ji ? `${col.ji}(${jiToKorean(col.ji)})` : '-'}
              </Text>
            </View>
          ))}
        </View>
        {/* 운성 */}
        <View style={s.tableRowLast}>
          {columns.map((col) => (
            <View key={`stage-${col.label}`} style={s.tableCell}>
              <Text style={[s.stageName, { color: col.stage ? strengthColor(col.stage) : colors.textMuted }]}>
                {col.stage || '-'}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* 각 운성 해설 */}
      <Text style={s.subTitle}>운성별 해설</Text>
      {uniqueStages.map((stage) => {
        const positions = columns
          .filter(c => c.stage === stage)
          .map(c => c.label)
          .join(' · ');
        return (
          <View key={stage} style={s.descCard}>
            <View style={s.descLabel}>
              <Text style={[s.descLabelText, { color: strengthColor(stage) }]}>
                {stage}
              </Text>
            </View>
            <View style={s.descBody}>
              <Text style={s.descBodyText}>
                {STAGE_DESC[stage] || ''}
              </Text>
              <Text style={s.descPosition}>
                해당 위치: {positions}
              </Text>
            </View>
          </View>
        );
      })}
    </PageLayout>
  );
}
