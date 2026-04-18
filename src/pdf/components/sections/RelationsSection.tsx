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
