/**
 * 일간 상세 프로필 — IlganDetailSection
 *
 * 일간(日干) 10개 천간 각각의 성격, 강점, 약점, 적성 분야를
 * 인라인 데이터 테이블 기반으로 렌더링한다. (LLM 불필요)
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { ganToKorean } from '../../utils/koreanReading';
import { ganToOhaeng, ohaengColor } from '../../utils/ohaeng';

import type { SajuResult } from '@engine/schema';

// ── 일간별 프로필 데이터 ──

interface IlganProfile {
  hanja: string;
  korean: string;
  element: string;
  yinYang: '양' | '음';
  nature: string;
  personality: string;
  strengths: string[];
  weaknesses: string[];
  careers: string[];
}

const ILGAN_PROFILES: Record<string, IlganProfile> = {
  '甲': {
    hanja: '甲', korean: '갑', element: '양목(陽木)',
    yinYang: '양',
    nature: '큰 나무, 소나무',
    personality: '곧고 우직하며 리더십이 강합니다. 정의감이 뚜렷하고 진취적이며, 한번 정한 방향은 쉽게 바꾸지 않는 추진력이 있습니다. 자존심이 강하고 대범하나, 융통성이 부족할 수 있습니다.',
    strengths: ['강한 리더십과 추진력', '정의감과 책임감', '진취적 도전 정신', '대인관계의 신뢰성'],
    weaknesses: ['융통성 부족', '고집과 독선 경향', '타인 의견 무시 가능', '변화 적응 느림'],
    careers: ['경영자', '정치인', '군인/경찰', '건축/토목', '교육자'],
  },
  '乙': {
    hanja: '乙', korean: '을', element: '음목(陰木)',
    yinYang: '음',
    nature: '덩굴, 풀, 꽃',
    personality: '부드럽고 유연하며 적응력이 뛰어납니다. 섬세한 감수성과 예술적 감각을 지녔으며, 주변 환경에 맞춰 유연하게 대처합니다. 겉으로는 온순해 보이나 내면의 끈기가 강합니다.',
    strengths: ['뛰어난 적응력', '섬세한 감수성', '인내와 끈기', '대인관계의 조화'],
    weaknesses: ['우유부단함', '의존성 경향', '소극적 태도', '자기주장 부족'],
    careers: ['예술가', '디자이너', '상담사', '외교관', '문학/출판'],
  },
  '丙': {
    hanja: '丙', korean: '병', element: '양화(陽火)',
    yinYang: '양',
    nature: '태양, 큰 불',
    personality: '밝고 열정적이며 에너지가 넘칩니다. 화려하고 적극적인 성격으로 주변을 환하게 만드는 존재입니다. 솔직하고 표현력이 풍부하나, 지나치면 급하고 감정적일 수 있습니다.',
    strengths: ['밝은 에너지와 열정', '뛰어난 표현력', '리더십과 카리스마', '솔직함과 정직'],
    weaknesses: ['급한 성격', '감정 기복', '지속력 부족', '과시 경향'],
    careers: ['방송/연예', '교육자', '정치인', '마케팅', '요식업'],
  },
  '丁': {
    hanja: '丁', korean: '정', element: '음화(陰火)',
    yinYang: '음',
    nature: '촛불, 등불, 별빛',
    personality: '따뜻하고 세심하며 지적 호기심이 강합니다. 집중력과 관찰력이 뛰어나고, 내면의 열정을 조용히 간직합니다. 예의 바르고 사려 깊으나, 내면에 예민함이 있습니다.',
    strengths: ['깊은 사고력', '세심한 관찰력', '학문적 탐구심', '따뜻한 배려심'],
    weaknesses: ['지나친 예민함', '내성적 경향', '결정 장애', '감정 억압'],
    careers: ['연구원', '작가', '의사/약사', '종교인', 'IT/프로그래머'],
  },
  '戊': {
    hanja: '戊', korean: '무', element: '양토(陽土)',
    yinYang: '양',
    nature: '산, 큰 바위, 제방',
    personality: '묵직하고 신뢰감이 있으며 포용력이 넓습니다. 안정적이고 든든한 성격으로, 주변 사람들의 중심이 되는 존재입니다. 보수적이고 변화보다는 안정을 추구합니다.',
    strengths: ['강한 신뢰감', '넓은 포용력', '안정적 성격', '중재 능력'],
    weaknesses: ['보수적 경직성', '변화 거부', '행동 느림', '무뚝뚝함'],
    careers: ['부동산', '금융/보험', '농업', '공무원', '건설업'],
  },
  '己': {
    hanja: '己', korean: '기', element: '음토(陰土)',
    yinYang: '음',
    nature: '논밭, 정원의 흙',
    personality: '온화하고 겸손하며 만물을 기르는 포용력이 있습니다. 실용적이고 꼼꼼하며, 주변을 잘 살피고 배려합니다. 겸손한 태도 속에 은근한 고집이 있습니다.',
    strengths: ['포용력과 배려심', '꼼꼼한 실무 능력', '겸손한 태도', '현실적 판단력'],
    weaknesses: ['은근한 고집', '우유부단함', '자기 과소평가', '소극적 대처'],
    careers: ['교육자', '의료/복지', '요리/식품', '회계/사무', '원예/조경'],
  },
  '庚': {
    hanja: '庚', korean: '경', element: '양금(陽金)',
    yinYang: '양',
    nature: '쇠, 바위 속 광석, 칼',
    personality: '강직하고 결단력이 있으며 의리를 중시합니다. 냉철한 판단력과 실행력을 갖추었고, 불의를 참지 못합니다. 자기 원칙이 뚜렷하나 타인에게 차갑게 느껴질 수 있습니다.',
    strengths: ['결단력과 실행력', '강한 의리', '냉철한 판단', '원칙과 정의감'],
    weaknesses: ['차가운 인상', '타협 부족', '독단적 성향', '감정 표현 서툼'],
    careers: ['법조인', '군인/경찰', '외과의사', '엔지니어', '금속/기계'],
  },
  '辛': {
    hanja: '辛', korean: '신', element: '음금(陰金)',
    yinYang: '음',
    nature: '보석, 가공된 금속, 바늘',
    personality: '섬세하고 예리하며 완벽주의 성향이 있습니다. 미적 감각이 뛰어나고 깔끔하며, 날카로운 지성을 지녔습니다. 외면은 부드러우나 내면의 자존심이 높습니다.',
    strengths: ['섬세한 미적 감각', '날카로운 분석력', '완벽주의적 성실함', '품위와 격조'],
    weaknesses: ['예민한 자존심', '결벽증 경향', '비판적 시선', '고독감'],
    careers: ['보석/패션', '변호사', '감정사', '금융 애널리스트', '예술가'],
  },
  '壬': {
    hanja: '壬', korean: '임', element: '양수(陽水)',
    yinYang: '양',
    nature: '큰 강, 바다, 호수',
    personality: '지혜롭고 포용력이 크며 자유를 사랑합니다. 넓은 시야와 풍부한 상상력으로 다방면에 재능을 보이며, 어디서든 적응하는 유연함이 있습니다. 방랑기질이 있을 수 있습니다.',
    strengths: ['넓은 시야와 지혜', '뛰어난 적응력', '풍부한 상상력', '포용력과 관대함'],
    weaknesses: ['방랑 기질', '집중력 분산', '일관성 부족', '방종 경향'],
    careers: ['무역/유통', '여행/관광', '저널리스트', '해운/수산', '기획자'],
  },
  '癸': {
    hanja: '癸', korean: '계', element: '음수(陰水)',
    yinYang: '음',
    nature: '이슬, 빗물, 안개',
    personality: '직관적이고 영감이 풍부하며 내면의 깊이가 있습니다. 조용하지만 관찰력이 뛰어나고, 감수성이 깊어 타인의 감정을 잘 읽습니다. 겉으로는 순하나 내면에 강한 의지가 있습니다.',
    strengths: ['뛰어난 직관력', '깊은 감수성', '관찰력과 통찰', '영적 감각'],
    weaknesses: ['과도한 걱정', '은둔 성향', '감정 과몰입', '현실 감각 부족'],
    careers: ['심리상담', '연구/학술', '예술/음악', '종교/철학', '의약/한의학'],
  },
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

  // 타이틀 카드
  profileCard: {
    borderWidth: 0.5, borderColor: colors.goldDim, borderRadius: 4,
    overflow: 'hidden', marginBottom: 14,
  },
  profileHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 8, paddingHorizontal: 12,
    backgroundColor: 'rgba(104,128,151,0.06)',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  profileHanja: {
    fontFamily: 'Paperlogy', fontSize: 28, fontWeight: 700,
  },
  profileMeta: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'Paperlogy', fontSize: fontSize.md, fontWeight: 700, color: colors.darkBg,
  },
  profileElement: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400, color: colors.blueGray, marginTop: 1,
  },
  profileNature: {
    fontFamily: 'Paperlogy', fontSize: fontSize.xs, fontWeight: 300, color: colors.textMuted, marginTop: 1,
  },
  profileBody: {
    padding: 12,
  },
  personalityText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.7, marginBottom: 10,
  },

  // 강점/약점 테이블
  swTableWrap: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 12,
  },
  swRow: {
    flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  swRowLast: { flexDirection: 'row' },
  swLabel: {
    width: 60, paddingVertical: 6, paddingHorizontal: 8,
    backgroundColor: 'rgba(104,128,151,0.06)',
    justifyContent: 'center',
  },
  swLabelText: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
    textAlign: 'center',
  },
  swContent: {
    flex: 1, paddingVertical: 6, paddingHorizontal: 10,
    justifyContent: 'center',
  },
  swContentText: {
    fontFamily: 'Paperlogy', fontSize: 8.5, fontWeight: 400,
    color: colors.textBody, lineHeight: 1.6,
  },

  // 적성 키워드
  careerWrap: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4,
  },
  careerBadge: {
    paddingVertical: 3, paddingHorizontal: 8,
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 10,
  },
  careerText: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.blueGray,
  },
});

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function IlganDetailSection({ sajuResult }: Props) {
  const dayGan = sajuResult.pillars.day.gan;
  const profile = ILGAN_PROFILES[dayGan];
  if (!profile) return null;

  const elColor = ohaengColor(ganToOhaeng(dayGan));

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>05</Text>
        <Text style={commonStyles.sectionTitle}>일간 상세 프로필</Text>
        <Text style={commonStyles.sectionSubtitle}>일간(日干) {dayGan}({ganToKorean(dayGan)})의 성격과 적성</Text>
        <View style={s.titleDivider} />

        {/* 프로필 카드 */}
        <View style={s.profileCard}>
          <View style={s.profileHeader}>
            <Text style={[s.profileHanja, { color: elColor }]}>{profile.hanja}</Text>
            <View style={s.profileMeta}>
              <Text style={s.profileName}>
                {profile.korean}({profile.hanja}) · {profile.element}
              </Text>
              <Text style={s.profileElement}>
                {profile.yinYang === '양' ? '양(陽)' : '음(陰)'} 기운
              </Text>
              <Text style={s.profileNature}>
                자연물 상징: {profile.nature}
              </Text>
            </View>
          </View>

          <View style={s.profileBody}>
            <Text style={s.subTitle}>성격 특성</Text>
            <Text style={s.personalityText}>{profile.personality}</Text>
          </View>
        </View>

        {/* 강점/약점 테이블 */}
        <Text style={s.subTitle}>강점과 약점</Text>
        <View style={s.swTableWrap}>
          <View style={s.swRow}>
            <View style={s.swLabel}>
              <Text style={[s.swLabelText, { color: colors.green }]}>강점</Text>
            </View>
            <View style={s.swContent}>
              {profile.strengths.map((str, i) => (
                <Text key={i} style={s.swContentText}>{'\u2022'} {str}</Text>
              ))}
            </View>
          </View>
          <View style={s.swRowLast}>
            <View style={s.swLabel}>
              <Text style={[s.swLabelText, { color: '#a83228' }]}>약점</Text>
            </View>
            <View style={s.swContent}>
              {profile.weaknesses.map((w, i) => (
                <Text key={i} style={s.swContentText}>{'\u2022'} {w}</Text>
              ))}
            </View>
          </View>
        </View>

        {/* 적성 분야 */}
        <Text style={s.subTitle}>적성 분야</Text>
        <View style={s.careerWrap}>
          {profile.careers.map((c, i) => (
            <View key={i} style={s.careerBadge}>
              <Text style={s.careerText}>{c}</Text>
            </View>
          ))}
        </View>

        <View style={{ height: 10 }} />

        <Text style={[s.personalityText, { fontSize: 8, color: colors.textMuted }]}>
          일간은 사주에서 나 자신을 대표하는 글자입니다. 위 프로필은 일간 단독의 기본 성향이며, 전체 사주 구성에 따라 달라질 수 있습니다.
        </Text>
      </PageLayout>
    </>
  );
}
