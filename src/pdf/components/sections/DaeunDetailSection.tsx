/**
 * 대운 상세 카드 — DaeunDetailSection
 *
 * 대운 10개 각각을 상세 카드로 표시한다.
 * 2열 그리드, 페이지당 약 4~5개. (LLM 불필요)
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToKorean, jiToKorean } from '../../utils/koreanReading';
import { sipseongColor } from '../../utils/ohaeng';

import type { SajuResult } from '@engine/schema';

// ── 등급/용신관계 색상 ──

const RATING_COLOR: Record<string, string> = {
  '대길': '#2d6a40', '길': '#4a7c59', '평': colors.blueGray, '흉': '#8a6820', '대흉': '#a83228',
};
const RATING_BG: Record<string, string> = {
  '대길': 'rgba(45,106,64,0.08)', '길': 'rgba(74,124,89,0.08)',
  '평': 'rgba(104,128,151,0.06)', '흉': 'rgba(138,104,32,0.08)', '대흉': 'rgba(168,50,40,0.08)',
};

const YONGSIN_COLOR: Record<string, string> = {
  '희신': '#2d6a40', '기신': '#a83228', '중립': colors.blueGray,
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
  bodyText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7, marginBottom: 10,
  },

  // 2열 그리드
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
  },

  // 대운 카드
  card: {
    width: '48.5%',
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 8,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingHorizontal: 8,
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  cardGanji: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700,
    color: colors.darkBg,
  },
  cardKorean: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textMuted, marginLeft: 4,
  },
  cardAge: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.blueGray,
  },
  ratingBadge: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 700,
    paddingVertical: 2, paddingHorizontal: 6,
    borderRadius: 8,
  },
  cardBody: {
    padding: 8,
  },

  // 십성 행
  tgRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  tgLabel: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textMuted,
  },
  tgValue: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
  },

  // 용신 관계
  yongsinRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4,
  },
  yongsinLabel: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textMuted,
  },
  yongsinValue: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
  },

  // 점수 바
  scoreRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4,
  },
  scoreLabel: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textMuted, width: 24,
  },
  scoreBarBg: {
    flex: 1, height: 5, backgroundColor: 'rgba(104,128,151,0.1)',
    borderRadius: 2.5, overflow: 'hidden',
  },
  scoreBarFill: {
    height: 5, borderRadius: 2.5,
  },
  scoreText: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 400,
    color: colors.textMuted, width: 22, textAlign: 'right',
  },

  // 합충/신살
  relationsRow: {
    marginTop: 2,
  },
  relLabel: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 600,
    color: colors.blueGray, marginBottom: 1,
  },
  relText: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300,
    color: colors.textMuted, lineHeight: 1.4,
  },
  emptyRel: {
    fontFamily: 'Paperlogy', fontSize: 7, fontWeight: 300,
    color: colors.textMuted,
  },
});

// ── 점수 색상 ──

function scoreColor(score: number): string {
  if (score >= 70) return '#2d6a40';
  if (score >= 50) return '#4a7c59';
  if (score >= 35) return colors.blueGray;
  if (score >= 20) return '#8a6820';
  return '#a83228';
}

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function DaeunDetailSection({ sajuResult }: Props) {
  const { daeun } = sajuResult;
  if (!daeun) return null;

  const periods = daeun.periods;
  if (periods.length === 0) return null;

  // 페이지당 4개씩 분배 (마진 고려)
  const perPage = 4;
  const pages: (typeof periods)[] = [];
  for (let i = 0; i < periods.length; i += perPage) {
    pages.push(periods.slice(i, i + perPage));
  }

  return (
    <>
      {pages.map((pagePeriods, pageIdx) => (
        <PageLayout key={pageIdx} showStamp={pageIdx === 0}>
          {pageIdx === 0 && (
            <>
              <Text style={s.sectionBadge}>10</Text>
              <Text style={commonStyles.sectionTitle}>대운 상세 분석</Text>
              <Text style={commonStyles.sectionSubtitle}>대운(大運) 10개 기간별 상세 카드</Text>
              <View style={s.titleDivider} />
              <Text style={s.bodyText}>
                대운은 10년 단위로 바뀌는 큰 흐름입니다. 각 대운의 간지, 십성, 용신 관계, 점수, 합충 관계를 종합하여 해당 시기의 운세를 판단합니다.
              </Text>
            </>
          )}

          <View style={s.grid}>
            {pagePeriods.map((p) => {
              const a = p.analysis;
              const rClr = RATING_COLOR[a.rating] ?? colors.textBody;
              const rBg = RATING_BG[a.rating] ?? 'rgba(104,128,151,0.06)';
              const yClr = YONGSIN_COLOR[a.yongSinRelation] ?? colors.textBody;
              const sClr = scoreColor(a.score);

              // 합충 목록
              const rels: string[] = [];
              if (a.cheonganHaps.length > 0) {
                a.cheonganHaps.forEach(h => rels.push(`천간합: ${h.stem1}${h.stem2} (${h.hwaElement})`));
              }
              if (a.jijiRelations.length > 0) {
                a.jijiRelations.forEach(r => rels.push(`${r.type}: ${r.ji1}${r.ji2}`));
              }

              // 신살
              const sinsalNames = p.sinsal.map(ss => ss.name);

              return (
                <View key={p.index} style={s.card}>
                  {/* 헤더 */}
                  <View style={[s.cardHeader, { backgroundColor: rBg }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline' }}>
                      <Text style={s.cardGanji}>{p.gan}{p.ji}</Text>
                      <Text style={s.cardKorean}>{ganToKorean(p.gan)}{jiToKorean(p.ji)}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Text style={s.cardAge}>{p.startAge}~{p.endAge}세</Text>
                      <Text style={[s.ratingBadge, { color: rClr, backgroundColor: `${rClr}15` }]}>
                        {a.rating}
                      </Text>
                    </View>
                  </View>

                  {/* 바디 */}
                  <View style={s.cardBody}>
                    {/* 십성 */}
                    <View style={s.tgRow}>
                      <Text style={s.tgLabel}>천간 십성</Text>
                      <Text style={[s.tgValue, { color: sipseongColor(a.ganTenGod) }]}>{a.ganTenGod}</Text>
                    </View>
                    <View style={s.tgRow}>
                      <Text style={s.tgLabel}>지지 십성</Text>
                      <Text style={[s.tgValue, { color: sipseongColor(a.jiTenGod) }]}>{a.jiTenGod}</Text>
                    </View>

                    {/* 용신 관계 */}
                    <View style={s.yongsinRow}>
                      <Text style={s.yongsinLabel}>용신 관계</Text>
                      <Text style={[s.yongsinValue, { color: yClr }]}>{a.yongSinRelation}</Text>
                    </View>

                    {/* 점수 바 */}
                    <View style={s.scoreRow}>
                      <Text style={s.scoreLabel}>점수</Text>
                      <View style={s.scoreBarBg}>
                        <View style={[s.scoreBarFill, { width: `${a.score}%`, backgroundColor: sClr }]} />
                      </View>
                      <Text style={s.scoreText}>{a.score}</Text>
                    </View>

                    {/* 합충 관계 */}
                    <View style={s.relationsRow}>
                      <Text style={s.relLabel}>형충합</Text>
                      {rels.length > 0 ? (
                        rels.map((r, ri) => (
                          <Text key={ri} style={s.relText}>{r}</Text>
                        ))
                      ) : (
                        <Text style={s.emptyRel}>없음</Text>
                      )}
                    </View>

                    {/* 신살 */}
                    {sinsalNames.length > 0 && (
                      <View style={[s.relationsRow, { marginTop: 3 }]}>
                        <Text style={s.relLabel}>십이신살</Text>
                        <Text style={s.relText}>{sinsalNames.join(', ')}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            })}
          </View>
        </PageLayout>
      ))}
    </>
  );
}
