/**
 * PDF 출생시점 태양계 배치도 페이지
 *
 * 서문(독자에게) 다음, 사주팔자 개요 이전에 위치.
 * 천문학적 실측 데이터 기반 — 사주 해석의 직접 근거가 아님을 명시.
 * 본문 내용(오행과 행성 이름의 선후 관계)은 모든 유저 동일 고정.
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from './PageLayout';
import BirthSolarSystemPdf from './BirthSolarSystemPdf';
import { colors, fontSize } from '../styles';

interface SolarSystemPageProps {
  /** UTC 기준 Date 객체 */
  birthDateUtc: Date;
  userName: string;
  /** 시주(시각) 입력 여부. false면 캡션에 시각 미표시 */
  birthTimeKnown?: boolean;
}

function formatDateKo(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}.${pad(d.getUTCMonth() + 1)}.${pad(d.getUTCDate())} ${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())} UTC`;
}

const s = StyleSheet.create({
  sectionTitle: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xl,
    fontWeight: 700,
    color: colors.darkBg,
    marginBottom: 4,
  },
  sectionSub: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 300,
    color: colors.blueGray,
    letterSpacing: 1,
    marginBottom: 14,
  },
  divider: {
    width: 40,
    height: 0.5,
    backgroundColor: colors.goldDim,
    marginBottom: 14,
  },
  svgWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  caption: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.blueGray,
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.5,
  },
  contentTitleRow: {
    borderLeftWidth: 2,
    borderLeftColor: colors.gold,
    paddingLeft: 10,
    marginBottom: 8,
  },
  contentTitle: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 700,
    color: colors.darkBg,
  },
  para: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 1.8,
    marginBottom: 7,
  },
  highlight: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.sm,
    fontWeight: 400,
    color: colors.textBody,
    lineHeight: 1.8,
    backgroundColor: colors.ivoryLight,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderLeftWidth: 2,
    borderLeftColor: colors.goldDim,
    marginBottom: 7,
  },
  disclaimer: {
    fontFamily: 'Paperlogy',
    fontSize: fontSize.xs,
    fontWeight: 300,
    color: colors.textMuted,
    lineHeight: 1.7,
    marginTop: 6,
  },
});

export default function SolarSystemPage({ birthDateUtc, userName, birthTimeKnown = true }: SolarSystemPageProps) {
  return (
    <PageLayout showStamp>
      <Text style={s.sectionTitle}>출생시점 태양계</Text>
      <Text style={s.sectionSub}>당신이 태어난 순간, 행성들은 이 자리에 있었습니다</Text>
      <View style={s.divider} />

      <View style={s.svgWrap}>
        <BirthSolarSystemPdf birthDateUtc={birthDateUtc} size={290} />
      </View>

      {/* 캡션 — 이미지와 동일 너비, 중앙 정렬 */}
      <Text style={s.caption}>
        {birthTimeKnown
          ? `${formatDateKo(birthDateUtc)} · 태양중심 · 로그 스케일`
          : `${birthDateUtc.getUTCFullYear()}.${String(birthDateUtc.getUTCMonth() + 1).padStart(2, '0')}.${String(birthDateUtc.getUTCDate()).padStart(2, '0')} (시각 미상) · 태양중심 · 로그 스케일`
        }
      </Text>

      {/* 본문 */}
      <View style={s.contentTitleRow}>
        <Text style={s.contentTitle}>동양의 명리학과 서양의 점성술</Text>
      </View>

      <Text style={s.highlight}>
        서양의 점성술과 동양의 명리학은 모두 천체의 운동을 기반으로 합니다. 바빌로니아-그리스의 기하학적 전통으로 인해 서양의 점성술은 행성의 움직임을 수학적 각도와 공간적 위치로 치밀하게 계산하여 [하늘의 지도]를 그리고자 하였습니다. 동양의 명리학은 우주만물의 변화원리를 5가지 기운으로 설명하려 했던 추상적 형이상학을 [하늘의 리듬]으로 풀어내고자, 오행의 명칭이 관측된 다섯 행성에 대입되었습니다. 물론 서양에도 4원소의 개념이 있었으나, 이는 화학의 발전을 이끈 계기가 된 것이 동양과 다른 점입니다.
      </Text>

      <Text style={s.para}>
        아름답지 않습니까? {userName}님이 태어난 시점 하늘에서 일어난 일을 보고 계십니다. 물론 사주풀이를 위해 필요한 지식은 아닙니다. 하지만 사주팔자가 단순히 미신에 기반한 점복술이 아닌 체계적인 이론적 기반을 가지고 있다는 점을 알려드리고자 합니다. 최근 배경지식을 갖춘 분들은 명왕성까지 고려하는 서양의 점성술이 동양의 명리학보다 더 정밀하다고 주장하시기도 하나, 본래 육안으로 관측 가능한 행성은 토성까지입니다. 렌즈의 발명으로 17세기경부터 태양계에 새로운 행성들이 편입되며 점성술의 천궁도가 풍부해졌을 뿐, 이론적 토대가 완성된 과거 시점에는 동서양에 그저 관점의 차이만 있었을 뿐입니다.
      </Text>

      <Text style={s.disclaimer}>
        * 이 도식은 사주팔자 해석의 직접 근거가 아닙니다. 사주 간지는 태양의 황경(24절기)과 달력 순환으로 산출되며, 각 행성의 물리적 위치와 직접 연산되지 않습니다. 천왕성·해왕성은 전통 명리 이론과 무관하므로 흐리게 표시했습니다.
      </Text>
    </PageLayout>
  );
}
