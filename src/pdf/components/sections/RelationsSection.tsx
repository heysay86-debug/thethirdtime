/**
 * 08. 형충파해합 · 신살 — RelationsSection
 *
 * 원국의 합·충·형·해·파 관계를 카테고리별로 정리하고
 * 신살 목록과 LLM 해석문을 배치한다.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToOhaeng, jiToOhaeng } from '../../utils/ohaeng';
import { computeRelations } from '../../utils/computeRelations';

import { groupSinsalByPillar } from '../../utils/sinsalKeywords';

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

  // ── 관계 카테고리 카드 ──
  relCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    padding: 12, marginBottom: 8,
  },
  relCardTitle: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 600,
    color: colors.blueGray, letterSpacing: 0.8, marginBottom: 6,
  },
  relItem: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7, marginBottom: 2,
  },
  relNone: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 300,
    color: colors.textMuted,
  },

  // ── 신살 (주별 그룹) ──
  sinsalGroup: {
    marginBottom: 8,
  },
  sinsalGroupTitle: {
    fontFamily: 'Paperlogy', fontSize: 9, fontWeight: 700,
    color: colors.blueGray, marginBottom: 3,
  },
  sinsalRow: {
    flexDirection: 'row', marginBottom: 2, paddingLeft: 6,
  },
  sinsalName: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 600,
    color: colors.darkBg, width: 62,
  },
  sinsalDesc: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 400,
    color: colors.textBody, flex: 1,
  },

  // ── 해석문 ──
  interpretText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.base, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.85, marginBottom: 10,
  },
});

// ─── 관계별 해설 ──────────────────────────────────────────────

const REL_EXPLANATIONS: Record<string, string> = {
  '천간합': '천간합은 두 기운이 합쳐져 새로운 오행으로 변할 수 있는 관계입니다. 합이 되면 연대의 힘이 강해지지만, 독립해야 할 때 발목을 잡을 수도 있습니다.',
  '천간충': '천간충은 서로 반대되는 기운이 부딪히는 것으로, 꿈과 이상의 영역에서 갈등이 생길 수 있습니다. 다만 이 부딪힘이 새로운 동력이 되기도 합니다.',
  '지지합(육합)': '육합은 두 지지가 짝을 이루어 합하는 관계입니다. 현실에서의 결합, 인연, 협력을 의미하며, 합화되면 새로운 오행의 기운이 생겨납니다.',
  '삼합 · 방합': '삼합은 세 글자가 만나 하나의 강력한 오행으로 변하는 가장 강한 합입니다. 방합은 같은 계절의 글자끼리 모이는 합으로, 해당 오행의 힘이 크게 강화됩니다.',
  '지지충': '지지충은 현실 영역의 부딪힘입니다. 지장간까지 함께 충돌하므로 천간충보다 복잡합니다. 변화와 움직임을 일으키며, 때로는 성장의 자극이 됩니다.',
  '지지형': '형은 통제와 구속의 힘입니다. 삼형(寅巳申, 丑戌未)은 권력의 글자가 모인 것으로 강렬한 변화를 암시합니다. 내면의 갈등이나 외부 압력으로 나타날 수 있습니다.',
  '지지해': '해는 서로를 해치는 관계로, 겉으로는 변동이 없어 보이지만 내면에서 불안정한 에너지가 쌓입니다. 정신적인 불안정성을 야기할 수 있으므로 주의가 필요합니다.',
  '지지파': '파는 깨뜨리는 관계로, 기존에 이루어진 것이 무너지거나 계획이 틀어질 수 있음을 의미합니다. 다만 파괴력은 충이나 형보다 약합니다.',
};

// ─── 오행 래퍼 ────────────────────────────────────────────────

function ohaengOf(ch: string, kind: 'gan' | 'ji'): string {
  return kind === 'gan' ? ganToOhaeng(ch) : jiToOhaeng(ch);
}

// ─── 메인 컴포넌트 ────────────────────────────────────────────

interface RelationsSectionProps {
  sajuResult: SajuResult;
  interpretation: InterpretationResult;
}

export default function RelationsSection({ sajuResult, interpretation }: RelationsSectionProps) {
  const { pillars, sinsal } = sajuResult;
  const { relations: relInterpretation } = interpretation.sections;

  const toParagraphs = (text: string) => text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
  const relations = computeRelations(pillars, ohaengOf);

  // 관계 카테고리 배열
  const categories = [
    { title: '천간합', items: relations.cheonganHaps },
    { title: '천간충', items: relations.cheonganChungs },
    { title: '지지합(육합)', items: relations.jijiHaps },
    { title: '삼합 · 방합', items: relations.jijiSamhaps },
    { title: '지지충', items: relations.jijiChungs },
    { title: '지지형', items: relations.jijiHyeongs },
    { title: '지지해', items: relations.jijiHaes },
    { title: '지지파', items: relations.jijiPas },
  ];

  // 관계가 있는 카테고리만 필터
  const activeCategories = categories.filter(c => c.items.length > 0);
  const emptyCategories = categories.filter(c => c.items.length === 0);

  return (
    <PageLayout showStamp>
      {/* 섹션 헤더 */}
      <Text style={s.sectionBadge}>08</Text>
      <Text style={commonStyles.sectionTitle}>형충파해합 · 신살</Text>
      <Text style={commonStyles.sectionSubtitle}>합(合) · 충(沖) · 형(刑) · 해(害) · 파(破) · 신살(神殺)</Text>
      <View style={s.titleDivider} />

      {/* ═══ 관계 카테고리 ═══ */}
      <Text style={s.subTitle}>원국 관계</Text>

      {activeCategories.map(cat => (
        <View key={cat.title} style={s.relCard}>
          <Text style={s.relCardTitle}>{cat.title}</Text>
          {cat.items.map((item, i) => (
            <Text key={i} style={s.relItem}>• {item}</Text>
          ))}
          {REL_EXPLANATIONS[cat.title] && (
            <Text style={[s.relItem, { color: colors.textMuted, marginTop: 4, fontSize: fontSize.xs, lineHeight: 1.8 }]}>
              {REL_EXPLANATIONS[cat.title]}
            </Text>
          )}
        </View>
      ))}

      {activeCategories.length === 0 && (
        <View style={s.relCard}>
          <Text style={s.relNone}>원국에 특별한 합충형해파 관계가 없습니다.</Text>
        </View>
      )}

      {/* 해당 없는 항목 요약 */}
      {emptyCategories.length > 0 && (
        <View style={[s.relCard, { marginTop: 4 }]}>
          <Text style={s.relNone}>
            해당 없음: {emptyCategories.map(c => c.title).join(', ')}
          </Text>
        </View>
      )}

      <View style={s.subDivider} />

      {/* ═══ 신살 목록 ═══ */}
      <Text style={s.subTitle}>원국 신살</Text>

      {sinsal.length > 0 ? (
        <View style={{ marginBottom: 10 }}>
          {groupSinsalByPillar(sinsal).map(group => (
            <View key={group.position} style={s.sinsalGroup}>
              <Text style={s.sinsalGroupTitle}>{group.position}</Text>
              {group.items.map((item, i) => (
                <View key={i} style={s.sinsalRow}>
                  <Text style={s.sinsalName}>{item.name}</Text>
                  <Text style={s.sinsalDesc}>{item.desc}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      ) : (
        <Text style={[s.relNone, { marginBottom: 14 }]}>해당 없음</Text>
      )}

      <View style={s.subDivider} />

      {/* ═══ LLM 해석문 ═══ */}
      {toParagraphs(relInterpretation.reading).map((p, i) => (
        <Text key={i} style={s.interpretText}>{p}</Text>
      ))}
    </PageLayout>
  );
}
