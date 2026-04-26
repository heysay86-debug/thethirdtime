/**
 * 지지합 + 천간충 상세 해설 — JijiHapChungSection
 *
 * sajuResult.jijiHap, sajuResult.cheonganChung 데이터를 기반으로
 * 각 합/충의 의미를 인라인 데이터로 해설한다. (LLM 불필요)
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToKorean, jiToKorean } from '../../utils/koreanReading';

import type { SajuResult } from '@engine/schema';

// ── 합 해설 데이터 ──

const HAP_DESCRIPTIONS: Record<string, { meaning: string; effect: string }> = {
  '육합': {
    meaning: '두 지지가 하나로 결합하여 새로운 오행의 기운을 생성합니다.',
    effect: '관계의 결합, 인연의 형성, 협력과 조화를 뜻합니다. 합이 성립하면 원래 지지의 성질이 변하여 새로운 힘이 작용합니다.',
  },
  '삼합': {
    meaning: '세 지지가 모여 하나의 오행 국(局)을 이루는 가장 강력한 합입니다.',
    effect: '완전한 결합으로 해당 오행의 힘이 극대화됩니다. 사회적 기반, 큰 성취, 강한 추진력을 나타냅니다.',
  },
  '방합': {
    meaning: '같은 계절(방위)의 세 지지가 모여 해당 계절 오행을 강화합니다.',
    effect: '동질적 기운의 결집으로, 해당 오행의 순수한 힘이 매우 강해집니다. 전문성과 집중력을 상징합니다.',
  },
  '반합': {
    meaning: '삼합의 두 글자만 만나 불완전하지만 합의 기운이 작용합니다.',
    effect: '완전한 합에 비해 약하지만, 해당 오행으로의 경향성이 존재합니다. 잠재적 가능성을 나타냅니다.',
  },
};

// ── 충 해설 데이터 ──

const CHUNG_PAIR_DESC: Record<string, string> = {
  '甲庚': '목과 금의 충돌. 추진력과 결단력이 부딪혀 갈등이 생기나, 잘 쓰면 강한 실행력이 됩니다.',
  '庚甲': '금이 목을 극하는 구도. 원칙과 자유의 갈등, 제도적 압박감이 있을 수 있습니다.',
  '乙辛': '음목과 음금의 충돌. 섬세함과 날카로움이 부딪혀 예민한 갈등이 생길 수 있습니다.',
  '辛乙': '음금이 음목을 극하는 구도. 비판적 시선과 감성의 마찰을 나타냅니다.',
  '丙壬': '양화와 양수의 충돌. 열정과 지혜가 부딪히며, 감정 기복이 클 수 있습니다.',
  '壬丙': '양수가 양화를 극하는 구도. 냉철함이 열정을 억누르는 형태입니다.',
  '丁癸': '음화와 음수의 충돌. 직관과 감성, 내면의 갈등을 나타냅니다.',
  '癸丁': '음수가 음화를 극하는 구도. 걱정과 불안이 내면의 빛을 가릴 수 있습니다.',
  '戊甲': '양토와 양목의 충돌. 안정과 도전의 갈등입니다.',
  '甲戊': '양목이 양토를 극하는 구도. 변화 의지가 안정을 깨뜨릴 수 있습니다.',
  '己乙': '음토와 음목의 관계. 양육과 성장의 힘겨루기입니다.',
  '乙己': '음목이 음토를 극하는 구도. 부드러운 변화가 안정을 흔듭니다.',
};

const DEFAULT_CHUNG_DESC = '천간의 상충으로 두 기운이 정면 충돌합니다. 갈등과 긴장이 있으나, 성장의 계기가 될 수도 있습니다.';

// ── 오행 합화 설명 ──

const HWA_ELEMENT_DESC: Record<string, string> = {
  '木': '목(木)으로 합화하여 성장과 발전의 기운이 형성됩니다.',
  '火': '화(火)로 합화하여 열정과 표현의 기운이 형성됩니다.',
  '土': '토(土)로 합화하여 안정과 포용의 기운이 형성됩니다.',
  '金': '금(金)으로 합화하여 결단과 수렴의 기운이 형성됩니다.',
  '水': '수(水)로 합화하여 지혜와 유통의 기운이 형성됩니다.',
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
  emptyText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textMuted, lineHeight: 1.7, marginBottom: 10,
  },
  subDivider: {
    width: '100%', height: 0.5, backgroundColor: colors.goldDim, marginBottom: 14, marginTop: 6,
  },

  // 카드
  card: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 10,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: 'rgba(104,128,151,0.06)',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  cardType: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
    color: colors.darkBg,
  },
  cardPosition: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textMuted,
  },
  cardBody: {
    padding: 10,
  },
  cardBranches: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
    color: colors.darkBg, marginBottom: 4,
  },
  cardHwa: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.blueGray, marginBottom: 4,
  },
  cardMeaning: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.6, marginBottom: 2,
  },
  cardEffect: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 300,
    color: colors.textBody, lineHeight: 1.6,
  },
});

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function JijiHapChungSection({ sajuResult }: Props) {
  const haps = sajuResult.jijiHap ?? [];
  const chungs = sajuResult.cheonganChung ?? [];

  const hasHap = haps.length > 0;
  const hasChung = chungs.length > 0;

  return (
    <PageLayout showStamp>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>09</Text>
      <Text style={commonStyles.sectionTitle}>지지합 / 천간충 상세</Text>
      <Text style={commonStyles.sectionSubtitle}>합(合)과 충(沖)의 작용과 의미</Text>
      <View style={s.titleDivider} />

      {/* ═══ 지지합 ═══ */}
      <Text style={s.subTitle}>지지합(地支合)</Text>

      {!hasHap ? (
        <Text style={s.emptyText}>원국에 지지합이 없습니다.</Text>
      ) : (
        <>
          <Text style={s.bodyText}>
            원국에서 {haps.length}개의 지지합이 발견되었습니다.
          </Text>
          {haps.map((h, i) => {
            const desc = HAP_DESCRIPTIONS[h.type];
            const branchesStr = h.branches.map(b => `${b}(${jiToKorean(b)})`).join(' · ');
            const posStr = h.positions.join(' - ');
            return (
              <View key={i} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardType}>{h.type}</Text>
                  <Text style={s.cardPosition}>{posStr}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardBranches}>{branchesStr}</Text>
                  <Text style={s.cardHwa}>
                    합화 오행: {h.hwaElement} {HWA_ELEMENT_DESC[h.hwaElement] ?? ''}
                  </Text>
                  {desc && (
                    <>
                      <Text style={s.cardMeaning}>{desc.meaning}</Text>
                      <Text style={s.cardEffect}>{desc.effect}</Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </>
      )}

      <View style={s.subDivider} />

      {/* ═══ 천간충 ═══ */}
      <Text style={s.subTitle}>천간충(天干沖)</Text>

      {!hasChung ? (
        <Text style={s.emptyText}>원국에 천간충이 없습니다.</Text>
      ) : (
        <>
          <Text style={s.bodyText}>
            원국에서 {chungs.length}개의 천간충이 발견되었습니다.
          </Text>
          {chungs.map((c, i) => {
            const pairKey = `${c.stem1}${c.stem2}`;
            const desc = CHUNG_PAIR_DESC[pairKey] ?? DEFAULT_CHUNG_DESC;
            return (
              <View key={i} style={s.card}>
                <View style={s.cardHeader}>
                  <Text style={s.cardType}>천간충</Text>
                  <Text style={s.cardPosition}>{c.position1} - {c.position2}</Text>
                </View>
                <View style={s.cardBody}>
                  <Text style={s.cardBranches}>
                    {c.stem1}({ganToKorean(c.stem1)}) vs {c.stem2}({ganToKorean(c.stem2)})
                  </Text>
                  <Text style={s.cardMeaning}>{desc}</Text>
                </View>
              </View>
            );
          })}
        </>
      )}
    </PageLayout>
  );
}
