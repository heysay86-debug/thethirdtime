/**
 * PDF 목차 페이지
 *
 * 표지(다크)에서 본문(아이보리)으로 전환하는 브릿지 역할.
 * 중간 톤 배경 (#2a3040 ~ #3e4857 계열)에 밝은 텍스트.
 *
 * 페이지 번호는 실제 렌더링 후 동적으로 매핑해야 하므로
 * 초기에는 번호 없이 섹션 목록만 표시한다.
 */

import React from 'react';
import { Page, View, Text, Svg, Path } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import { colors, fontSize } from '../styles';
import { StampEmblem } from './PageLayout';

const s = StyleSheet.create({
  page: {
    backgroundColor: '#2e3545',
    paddingVertical: 60,
    paddingHorizontal: 70,
    fontFamily: 'Paperlogy',
  },

  header: {
    marginBottom: 40,
  },
  title: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize['2xl'],
    fontWeight: 700,
    color: colors.textLight,
    letterSpacing: 3,
    marginBottom: 8,
  },
  divider: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginBottom: 40,
  },

  // 목차 항목
  tocItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  tocNumber: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: colors.gold,
    width: 24,
    letterSpacing: 1,
  },
  tocLabel: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.md,
    fontWeight: 400,
    color: colors.textLight,
    letterSpacing: 1,
    flex: 1,
  },
  tocSublabel: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: 'rgba(221, 225, 229, 0.65)',
    letterSpacing: 0.5,
    marginLeft: 24,
    marginTop: -12,
    marginBottom: 18,
  },
  tocDots: {
    flex: 1,
    borderBottomWidth: 0.3,
    borderBottomColor: 'rgba(240, 223, 173, 0.15)',
    borderStyle: 'dotted',
    marginHorizontal: 8,
    marginBottom: 3,
  },

  // 하단 브랜드
  footer: {
    position: 'absolute',
    bottom: 50,
    left: 70,
    right: 70,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: 'rgba(221, 225, 229, 0.3)',
    letterSpacing: 2,
  },
});

const tocItems = [
  { num: '01', label: '독자에게', sub: '이 리포트를 읽기 전에' },
  { num: '02', label: '출생시점 태양계', sub: '탄생 순간의 하늘' },
  { num: '03', label: '사주팔자 개요', sub: '네 기둥의 구조' },
  { num: '04', label: '핵심 판단', sub: '신강과 신약, 격국, 용신' },
  { num: '05', label: '주별 심층 분석', sub: '연주 · 월주 · 일주 · 시주' },
  { num: '06', label: '오행 분석', sub: '다섯 가지 기운의 균형' },
  { num: '07', label: '십성 분석', sub: '관계와 역할의 지도' },
  { num: '08', label: '십이운성 분석', sub: '일간의 생왕사절' },
  { num: '09', label: '형충파해합과 신살', sub: '글자들의 충돌과 조화' },
  { num: '10', label: '대운 흐름', sub: '시간 위의 기운' },
  { num: '11', label: '종합 해석', sub: '하나의 시선으로' },
];

export default function TocPage() {
  return (
    <Page size="A4" style={s.page}>
      {/* 헤더 */}
      <View style={s.header}>
        <Text style={s.title}>목차</Text>
        <View style={s.divider} />
      </View>

      {/* 목차 항목 */}
      {tocItems.map((item) => (
        <View key={item.num}>
          <View style={s.tocItem}>
            <Text style={s.tocNumber}>{item.num}</Text>
            <Text style={s.tocLabel}>{item.label}</Text>
          </View>
          <Text style={s.tocSublabel}>{item.sub}</Text>
        </View>
      ))}

      {/* 하단 */}
      <View style={s.footer}>
        <StampEmblem size={12} />
        <Text style={s.footerText}>제3의시간</Text>
      </View>
    </Page>
  );
}
