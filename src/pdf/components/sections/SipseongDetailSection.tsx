/**
 * 십성 상세 해설 — SipseongDetailSection
 *
 * 각 주(연/월/일/시)에 배치된 십성의 의미를 상세하게 해설한다.
 * 인라인 SIPSEONG_MEANINGS 테이블 기반. (LLM 불필요)
 */

import React from 'react';
import { View, Text } from '@react-pdf/renderer';
import { StyleSheet } from '@react-pdf/renderer';
import PageLayout from '../PageLayout';
import { commonStyles, colors, fontSize } from '../../styles';
import { sipseongColor } from '../../utils/ohaeng';

import type { SajuResult } from '@engine/schema';

// ── 십성 의미 데이터 ──

interface SipseongMeaning {
  keyword: string;
  personality: string;
  career: string;
  caution: string;
}

const SIPSEONG_MEANINGS: Record<string, SipseongMeaning> = {
  '비견': {
    keyword: '자립 / 경쟁 / 독립심',
    personality: '자존심이 강하고 독립적입니다. 주체성이 뚜렷하며 남에게 의지하기보다 스스로 해결하려 합니다. 경쟁심이 있어 동료 관계에서 라이벌 의식이 생길 수 있습니다.',
    career: '독립 사업, 프리랜서, 개인 전문직, 스포츠 분야에 적합합니다.',
    caution: '고집이 세고 타협을 꺼리는 경향에 주의해야 합니다.',
  },
  '겁재': {
    keyword: '도전 / 승부욕 / 행동력',
    personality: '대담하고 행동력이 강합니다. 승부욕이 뛰어나고 모험을 즐기며, 결단이 빠릅니다. 다만 재물 관리에 소홀할 수 있고, 충동적 결정에 주의가 필요합니다.',
    career: '투자, 영업, 무역, 스타트업, 도전적 분야에 적합합니다.',
    caution: '재물 손실과 충동적 투자, 대인관계 마찰에 주의해야 합니다.',
  },
  '식신': {
    keyword: '표현 / 여유 / 낙천성',
    personality: '낙천적이고 여유가 있으며, 표현력이 풍부합니다. 먹는 것을 좋아하고 예술적 감각이 있습니다. 사교적이며 주변을 편안하게 만드는 분위기를 갖고 있습니다.',
    career: '요리/식음, 예술, 교육, 엔터테인먼트, 글쓰기 분야에 적합합니다.',
    caution: '게으름, 안일함, 과식에 주의해야 합니다.',
  },
  '상관': {
    keyword: '재능 / 반항 / 창의력',
    personality: '창의적이고 재능이 많으며, 기존 틀을 깨는 혁신적 사고를 합니다. 언변이 날카롭고 비판 의식이 강합니다. 자유로운 영혼으로 권위에 도전하는 기질이 있습니다.',
    career: '예술, 연예, 변호사, 컨설턴트, 창작 분야에 적합합니다.',
    caution: '윗사람과의 마찰, 불안정한 직장생활, 독설에 주의해야 합니다.',
  },
  '편재': {
    keyword: '활동 / 사교 / 투자',
    personality: '활동적이고 사교성이 넓으며, 돈에 대한 감각이 뛰어납니다. 여러 방면에 관심이 많고 투자와 사업에 능합니다. 넓은 인맥을 형성하며 대범한 금전 운용을 합니다.',
    career: '사업, 투자, 무역, 유통, 부동산, 영업 분야에 적합합니다.',
    caution: '투기성 투자, 이성 문제, 금전 낭비에 주의해야 합니다.',
  },
  '정재': {
    keyword: '성실 / 저축 / 안정',
    personality: '성실하고 꼼꼼하며 안정을 추구합니다. 계획적으로 재물을 관리하고, 근검절약하는 성향입니다. 신뢰할 수 있고 약속을 잘 지키며, 현실적인 판단을 합니다.',
    career: '회계, 금융, 공무원, 관리직, 안정적 직장에 적합합니다.',
    caution: '지나친 계산, 인색함, 유연성 부족에 주의해야 합니다.',
  },
  '편관': {
    keyword: '권위 / 압박 / 실행력',
    personality: '강한 책임감과 실행력을 지녔습니다. 조직에서 권위를 발휘하며, 규율과 질서를 중시합니다. 카리스마가 있으나 압박감이 수반되기도 합니다. 칠살이라고도 부릅니다.',
    career: '군인, 경찰, 검찰, 외과의사, 관리직, 위기관리 분야에 적합합니다.',
    caution: '스트레스 관리, 독재적 태도, 건강 문제에 주의해야 합니다.',
  },
  '정관': {
    keyword: '명예 / 책임 / 질서',
    personality: '예의 바르고 책임감이 강하며, 사회적 명예를 중시합니다. 법과 규범을 존중하고, 조직 내에서 신뢰받는 존재입니다. 안정적이고 보수적인 경향이 있습니다.',
    career: '관료, 법조인, 교수, 대기업, 공공기관에 적합합니다.',
    caution: '지나친 형식주의, 융통성 부족, 체면 의식에 주의해야 합니다.',
  },
  '편인': {
    keyword: '직관 / 비정통 / 독창',
    personality: '독특한 사고방식과 직관력을 지녔습니다. 비주류 학문이나 특수 분야에 관심이 많고, 창의적 영감이 풍부합니다. 외골수적 성향이 있으며 고독을 즐기기도 합니다.',
    career: '연구, 종교, 철학, 의약, 점술, 특수 기술 분야에 적합합니다.',
    caution: '고립감, 편식(사고의 편향), 불안정한 생활에 주의해야 합니다.',
  },
  '정인': {
    keyword: '학문 / 보호 / 인덕',
    personality: '학문적 소양이 깊고 인덕이 있습니다. 어머니의 사랑처럼 보호하고 가르치는 성향이 있으며, 지적 호기심이 강합니다. 정통 학문을 선호하고 명예를 중시합니다.',
    career: '교육, 학술, 공공서비스, 출판, 상담 분야에 적합합니다.',
    caution: '의존성, 나태함, 실행력 부족에 주의해야 합니다.',
  },
};

// ── 주별 맥락 ──

const POSITION_CONTEXT: Record<string, { label: string; context: string }> = {
  year: { label: '연주(年柱)', context: '조상궁 · 사회궁 — 유년기(1~15세)의 환경, 조상의 음덕, 사회적 외면을 나타냅니다.' },
  month: { label: '월주(月柱)', context: '부모궁 · 직업궁 — 청년기(16~30세)의 환경, 부모 관계, 직업과 사회 활동을 나타냅니다.' },
  day: { label: '일주(日柱)', context: '배우자궁 · 본인궁 — 장년기(31~45세)의 환경, 배우자 관계, 내면의 본성을 나타냅니다.' },
  hour: { label: '시주(時柱)', context: '자녀궁 · 말년궁 — 노년기(46세~)의 환경, 자녀 관계, 말년의 결실을 나타냅니다.' },
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

  // 주별 카드
  pillarCard: {
    borderWidth: 0.5, borderColor: colors.goldDim,
    borderRadius: 4, overflow: 'hidden', marginBottom: 12,
  },
  pillarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 5, paddingHorizontal: 10,
    backgroundColor: 'rgba(104,128,151,0.06)',
    borderBottomWidth: 0.5, borderBottomColor: colors.goldDim,
  },
  pillarLabel: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
    color: colors.darkBg,
  },
  pillarContext: {
    fontFamily: 'Paperlogy', fontSize: 7.5, fontWeight: 300,
    color: colors.textMuted,
  },
  pillarBody: {
    padding: 10,
  },

  // 천간/지지 십성 행
  tgRow: {
    flexDirection: 'row', marginBottom: 8,
  },
  tgLabel: {
    width: 55,
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 600,
    color: colors.blueGray, paddingTop: 1,
  },
  tgContent: {
    flex: 1,
  },
  tgName: {
    fontFamily: 'Paperlogy', fontSize: fontSize.sm, fontWeight: 700,
    marginBottom: 2,
  },
  tgKeyword: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 400,
    color: colors.blueGray, marginBottom: 3,
  },
  tgDesc: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textBody, lineHeight: 1.5,
  },
  tgCareer: {
    fontFamily: 'Paperlogy', fontSize: 8, fontWeight: 300,
    color: colors.textMuted, lineHeight: 1.5, marginTop: 2,
  },
});

// ── 컴포넌트 ──

interface Props {
  sajuResult: SajuResult;
}

export default function SipseongDetailSection({ sajuResult }: Props) {
  const { tenGods, pillars } = sajuResult;

  const pillarEntries = [
    {
      key: 'year',
      ganTG: tenGods.yearGan,
      jiTG: tenGods.yearJi,
      pillar: pillars.year,
    },
    {
      key: 'month',
      ganTG: tenGods.monthGan,
      jiTG: tenGods.monthJi,
      pillar: pillars.month,
    },
    {
      key: 'day',
      ganTG: '비견' as const,
      jiTG: tenGods.dayJi,
      pillar: pillars.day,
    },
    ...(pillars.hour ? [{
      key: 'hour',
      ganTG: tenGods.hourGan!,
      jiTG: tenGods.hourJi!,
      pillar: pillars.hour,
    }] : []),
  ];

  // 첫 2개 (연주/월주)와 나머지 (일주/시주) 분리
  const firstPage = pillarEntries.slice(0, 2);
  const secondPage = pillarEntries.slice(2);

  return (
    <>
      <PageLayout showStamp>
        {/* 섹션 헤더 */}
        <Text style={s.sectionBadge}>08</Text>
        <Text style={commonStyles.sectionTitle}>십성 상세 해설</Text>
        <Text style={commonStyles.sectionSubtitle}>각 주의 십성 의미와 위치별 해석</Text>
        <View style={s.titleDivider} />

        <Text style={s.bodyText}>
          십성(十星)은 일간을 기준으로 다른 천간·지지가 어떤 관계에 있는지를 나타냅니다. 같은 십성이라도 연주·월주·일주·시주 어느 위치에 있느냐에 따라 의미가 달라집니다.
        </Text>

        {firstPage.map((entry) => (
          <PillarCard key={entry.key} entry={entry} />
        ))}
      </PageLayout>

      <PageLayout>
        {secondPage.map((entry) => (
          <PillarCard key={entry.key} entry={entry} />
        ))}

        {/* 보충 설명 */}
        <View style={{ marginTop: 8 }}>
          <Text style={s.subTitle}>십성 해석의 유의점</Text>
          <Text style={s.bodyText}>
            십성 하나만으로 길흉을 단정하지 않습니다. 격국과 용신, 합충 관계, 왕상휴수사 등 전체 맥락 속에서 십성의 역할이 결정됩니다. 예를 들어 같은 편관이라도 용신으로 작용하면 리더십과 실행력의 긍정적 면이, 기신으로 작용하면 압박과 스트레스의 부정적 면이 부각됩니다.
          </Text>
        </View>
      </PageLayout>
    </>
  );
}

function PillarCard({ entry }: { entry: { key: string; ganTG: string; jiTG: string; pillar: { gan: string; ji: string } } }) {
  const pos = POSITION_CONTEXT[entry.key];
  const ganMeaning = SIPSEONG_MEANINGS[entry.ganTG];
  const jiMeaning = SIPSEONG_MEANINGS[entry.jiTG];

  return (
    <View style={s.pillarCard}>
      <View style={s.pillarHeader}>
        <Text style={s.pillarLabel}>{pos.label}</Text>
        <Text style={s.pillarContext}>{pos.context}</Text>
      </View>
      <View style={s.pillarBody}>
        {/* 천간 십성 */}
        <View style={s.tgRow}>
          <Text style={s.tgLabel}>천간 십성</Text>
          <View style={s.tgContent}>
            <Text style={[s.tgName, { color: sipseongColor(entry.ganTG) }]}>
              {entry.key === 'day' ? '비견(일간)' : entry.ganTG}
            </Text>
            {ganMeaning && (
              <>
                <Text style={s.tgKeyword}>{ganMeaning.keyword}</Text>
                <Text style={s.tgDesc}>{ganMeaning.personality}</Text>
                <Text style={s.tgCareer}>{ganMeaning.career}</Text>
              </>
            )}
          </View>
        </View>

        {/* 지지 십성 */}
        <View style={[s.tgRow, { marginBottom: 0 }]}>
          <Text style={s.tgLabel}>지지 십성</Text>
          <View style={s.tgContent}>
            <Text style={[s.tgName, { color: sipseongColor(entry.jiTG) }]}>
              {entry.jiTG}
            </Text>
            {jiMeaning && (
              <>
                <Text style={s.tgKeyword}>{jiMeaning.keyword}</Text>
                <Text style={s.tgDesc}>{jiMeaning.personality}</Text>
                <Text style={s.tgCareer}>{jiMeaning.career}</Text>
              </>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
