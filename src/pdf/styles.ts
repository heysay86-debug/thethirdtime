/**
 * PDF 공통 스타일 시스템
 *
 * 브랜드 컬러 팔레트와 타이포그래피를 정의한다.
 * 모든 PDF 페이지 컴포넌트에서 이 스타일을 참조한다.
 */

import { StyleSheet } from '@react-pdf/renderer';

// ── 브랜드 컬러 팔레트 ──
export const colors = {
  // 다크 계열 (표지·목차)
  darkBg: '#1a1e24',
  darkMid: '#2a3040',
  darkLight: '#3e4857',

  // 본문 배경
  ivory: '#F5F2EB',
  ivoryLight: '#FAFAF5',

  // 텍스트
  textDark: '#2a2a2a',
  textBody: '#3a3a3a',
  textMuted: '#6b7280',
  textLight: '#dde1e5',

  // 브랜드 포인트
  gold: '#f0dfad',
  goldDim: 'rgba(240, 223, 173, 0.45)',
  green: '#a1c5ac',
  navy: '#3e4857',
  blueGray: '#688097',

  // 오행 컬러
  wood: '#4a7c59',   // 목 — 녹색
  fire: '#c45c4a',   // 화 — 적색
  earth: '#c4a94a',  // 토 — 황색
  metal: '#9ca3af',  // 금 — 백색(회색)
  water: '#4a6a8c',  // 수 — 흑색(남색)
} as const;

// ── 폰트 크기 ──
export const fontSize = {
  xs: 8.5,
  sm: 10,
  base: 11.5,
  md: 13,
  lg: 15,
  xl: 18,
  '2xl': 23,
  '3xl': 30,
} as const;

// ── 공통 스타일 ──
export const commonStyles = StyleSheet.create({
  // 본문 페이지 기본
  bodyPage: {
    backgroundColor: colors.ivory,
    paddingTop: 60,
    paddingBottom: 70,
    paddingHorizontal: 50,
    fontFamily: 'Paperlogy',
    fontSize: fontSize.base,
    color: colors.textBody,
    lineHeight: 1.8,
  },

  // 페이지 헤더
  pageHeader: {
    position: 'absolute',
    top: 25,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.goldDim,
  },
  pageHeaderBrand: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.blueGray,
    letterSpacing: 1,
  },

  // 페이지 푸터
  pageFooter: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageFooterText: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.textMuted,
  },
  pageNumber: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.textMuted,
  },

  // 섹션 제목
  sectionTitle: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xl,
    fontWeight: 700,
    color: colors.darkBg,
    marginBottom: 6,
  },
  sectionSubtitle: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: colors.blueGray,
    letterSpacing: 1,
    marginBottom: 10,
  },

  // 본문 텍스트
  bodyText: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.base,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 1.8,
    marginBottom: 10,
  },

  // 강조 텍스트
  emphasis: {
    fontFamily: 'Paperlogy',
    fontWeight: 700,
    color: colors.darkBg,
  },

  // 구분선
  divider: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginVertical: 16,
  },

  // 카드 (정보 박스)
  infoCard: {
    backgroundColor: colors.ivoryLight,
    borderWidth: 0.5,
    borderColor: colors.goldDim,
    borderRadius: 4,
    padding: 14,
    marginBottom: 12,
  },
});
