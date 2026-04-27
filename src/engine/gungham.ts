/**
 * 궁합 분석 엔진 — 2인/3인 사주 궁합
 *
 * 핵심 로직:
 *   1. 각 인원 개별 분석 (analyzeSaju)
 *   2. 일간 오행 관계 분석
 *   3. 용신 교환 판정
 *   4. 지지 합충형파해 교차 비교
 *   5. 점수 산출 (용신교환 40 + 일간관계 20 + 지지합충 25 + 신살 15)
 *   6. 관계 유형별 해석 분기
 *
 * LLM 미사용. 엔진 연산만으로 결과 생성.
 */

import type { SajuInput } from './saju';
import { analyzeSaju as analyzeFullSaju } from './analyze';

// ── 오행 상수 ──

type Element = '木' | '火' | '土' | '金' | '水';

const STEM_ELEMENT: Record<string, Element> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const GENERATES: Record<Element, Element> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

const DESTROYS: Record<Element, Element> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

// ── 타입 정의 ──

export type RelationType =
  | 'couple' | 'parent_child' | 'friend' | 'business' | 'boss_sub'
  | 'team' | 'family' | 'friends';

export interface GunghamPersonInput {
  name: string;
  birthDate: string;       // YYYY-MM-DD
  birthTime?: string;      // HH:MM
  gender: 'M' | 'F';
  calendar?: 'solar' | 'lunar';
  birthCity?: string;
}

export interface GunghamInput {
  persons: GunghamPersonInput[];
  relationType: RelationType;
}

interface Pillars {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
}

export interface GunghamPerson {
  name: string;
  pillars: Pillars;
  dayGanElement: Element;
  strengthLevel: string;
  yongSinPrimary: Element;
}

export type DayGanRelationType = '상생' | '비겁' | '상극';
export type YongSinEffect = 'helpful' | 'neutral' | 'harmful';
export type JijiSignificance = 'high' | 'medium' | 'low';
export type GunghamRating = '천생연분' | '좋은 인연' | '보통' | '노력 필요' | '주의';

export interface DayGanRelation {
  type: DayGanRelationType;
  direction: string;
  description: string;
}

export interface YongSinExchange {
  aToB: YongSinEffect;
  bToA: YongSinEffect;
  description: string;
}

export interface CrossJijiRelation {
  type: '합' | '충' | '형' | '파' | '해';
  ji1: string;
  ji2: string;
  position1: string;
  position2: string;
  significance: JijiSignificance;
}

export interface PairInterpretation {
  summary: string;
  strengths: string[];
  weaknesses: string[];
  advice: string;
}

export interface GunghamPair {
  personA: string;
  personB: string;
  dayGanRelation: DayGanRelation;
  yongSinExchange: YongSinExchange;
  jijiRelations: CrossJijiRelation[];
  score: number;
  rating: GunghamRating;
  interpretation: PairInterpretation;
}

export interface GroupDynamics {
  overallScore: number;
  ohengBalance: string;
  keyPerson: string;
  description: string;
}

export interface GunghamResult {
  persons: GunghamPerson[];
  pairs: GunghamPair[];
  groupDynamics?: GroupDynamics;
}

// ── 지지 합충형파해 쌍 ──

const JIJI_CHUNG_PAIRS: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

const JIJI_HYEONG_PAIRS: [string, string][] = [
  ['寅', '巳'], ['巳', '申'], ['寅', '申'],
  ['丑', '戌'], ['戌', '未'], ['丑', '未'],
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'],
  ['子', '卯'], ['卯', '子'],
];

const JIJI_HAE_PAIRS: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

const JIJI_PA_PAIRS: [string, string][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

const JIJI_YUKHAP_PAIRS: [string, string][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'], ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

function matchPair(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ── 위치명 ──

const POSITION_NAMES = ['연', '월', '일', '시'] as const;

function getJiPositionName(personName: string, posIndex: number): string {
  return `${personName}${POSITION_NAMES[posIndex]}지`;
}

// ── 일간 오행 관계 판정 ──

export function getDayGanRelation(
  elementA: Element,
  elementB: Element,
  nameA: string,
  nameB: string,
): DayGanRelation {
  if (elementA === elementB) {
    return {
      type: '비겁',
      direction: `${nameA}와 ${nameB}는 같은 ${elementA} 오행`,
      description: '같은 오행으로 동류 의식이 강합니다. 경쟁이 될 수도, 든든한 동지가 될 수도 있습니다.',
    };
  }

  if (GENERATES[elementA] === elementB) {
    return {
      type: '상생',
      direction: `${nameA}(${elementA})가 ${nameB}(${elementB})를 생함`,
      description: `${nameA}가 ${nameB}에게 에너지를 공급하는 구조입니다. 헌신과 보살핌의 관계가 될 수 있습니다.`,
    };
  }

  if (GENERATES[elementB] === elementA) {
    return {
      type: '상생',
      direction: `${nameB}(${elementB})가 ${nameA}(${elementA})를 생함`,
      description: `${nameB}가 ${nameA}에게 에너지를 공급하는 구조입니다. ${nameA}가 도움을 받는 관계입니다.`,
    };
  }

  if (DESTROYS[elementA] === elementB) {
    return {
      type: '상극',
      direction: `${nameA}(${elementA})가 ${nameB}(${elementB})를 극함`,
      description: `${nameA}가 ${nameB}를 통제하거나 압박하는 구도입니다. 긴장감이 있지만 견제와 균형의 역할도 합니다.`,
    };
  }

  if (DESTROYS[elementB] === elementA) {
    return {
      type: '상극',
      direction: `${nameB}(${elementB})가 ${nameA}(${elementA})를 극함`,
      description: `${nameB}가 ${nameA}를 통제하거나 압박하는 구도입니다. 갈등이 있을 수 있지만 성장의 계기가 되기도 합니다.`,
    };
  }

  // fallback (shouldn't happen with 5 elements)
  return {
    type: '비겁',
    direction: `${nameA}(${elementA})와 ${nameB}(${elementB})`,
    description: '두 오행의 관계를 판단합니다.',
  };
}

// ── 용신 교환 판정 ──

export function getYongSinEffect(
  sourceElement: Element,
  sourcePillars: Pillars,
  targetYongSin: Element,
): YongSinEffect {
  // source의 원국 오행 세력으로 target의 용신을 강화/약화하는지 판정
  // source 원국에서 target 용신 오행이 얼마나 있는지
  const elements = getPillarElements(sourcePillars);
  const yongSinCount = elements.filter(e => e === targetYongSin).length;
  // source 원국에서 target 용신을 극하는 오행
  const harmfulElement = Object.entries(DESTROYS).find(([, v]) => v === targetYongSin)?.[0] as Element | undefined;
  const harmfulCount = harmfulElement ? elements.filter(e => e === harmfulElement).length : 0;
  // source 원국에서 target 용신을 생하는 오행
  const helpfulElement = Object.entries(GENERATES).find(([, v]) => v === targetYongSin)?.[0] as Element | undefined;
  const helpfulCount = helpfulElement ? elements.filter(e => e === helpfulElement).length : 0;

  const positiveScore = yongSinCount * 2 + helpfulCount;
  const negativeScore = harmfulCount * 2;

  if (positiveScore >= 3) return 'helpful';
  if (negativeScore >= 3) return 'harmful';
  if (positiveScore > negativeScore) return 'helpful';
  if (negativeScore > positiveScore) return 'harmful';
  return 'neutral';
}

function getPillarElements(pillars: Pillars): Element[] {
  const elements: Element[] = [];
  const positions = [pillars.year, pillars.month, pillars.day];
  if (pillars.hour) positions.push(pillars.hour);

  for (const p of positions) {
    if (STEM_ELEMENT[p.gan]) elements.push(STEM_ELEMENT[p.gan]);
    if (BRANCH_ELEMENT[p.ji]) elements.push(BRANCH_ELEMENT[p.ji]);
  }
  return elements;
}

function getYongSinExchangeDescription(aToB: YongSinEffect, bToA: YongSinEffect, nameA: string, nameB: string): string {
  if (aToB === 'helpful' && bToA === 'helpful') {
    return `상호 용신을 강화하는 최상의 조합입니다. ${nameA}와 ${nameB} 모두에게 이로운 관계입니다.`;
  }
  if (aToB === 'helpful' && bToA === 'neutral') {
    return `${nameA}가 ${nameB}의 용신을 도와주는 관계입니다. ${nameB} 입장에서는 ${nameA}가 도움이 됩니다.`;
  }
  if (aToB === 'neutral' && bToA === 'helpful') {
    return `${nameB}가 ${nameA}의 용신을 도와주는 관계입니다. ${nameA} 입장에서는 ${nameB}가 도움이 됩니다.`;
  }
  if (aToB === 'harmful' && bToA === 'harmful') {
    return `서로의 용신을 약화시키는 구조입니다. 의식적인 노력이 필요한 관계입니다.`;
  }
  if (aToB === 'harmful' || bToA === 'harmful') {
    const harmer = aToB === 'harmful' ? nameA : nameB;
    const harmed = aToB === 'harmful' ? nameB : nameA;
    return `${harmer}가 ${harmed}의 용신을 약화시킬 수 있습니다. 이 부분에 주의가 필요합니다.`;
  }
  return '용신 교환의 영향이 크지 않은 중립적 관계입니다.';
}

// ── 지지 교차 비교 ──

export function detectCrossJijiRelations(
  pillarsA: Pillars,
  pillarsB: Pillars,
  nameA: string,
  nameB: string,
): CrossJijiRelation[] {
  const jisA: { ji: string; posIndex: number }[] = [
    { ji: pillarsA.year.ji, posIndex: 0 },
    { ji: pillarsA.month.ji, posIndex: 1 },
    { ji: pillarsA.day.ji, posIndex: 2 },
  ];
  if (pillarsA.hour) jisA.push({ ji: pillarsA.hour.ji, posIndex: 3 });

  const jisB: { ji: string; posIndex: number }[] = [
    { ji: pillarsB.year.ji, posIndex: 0 },
    { ji: pillarsB.month.ji, posIndex: 1 },
    { ji: pillarsB.day.ji, posIndex: 2 },
  ];
  if (pillarsB.hour) jisB.push({ ji: pillarsB.hour.ji, posIndex: 3 });

  const results: CrossJijiRelation[] = [];

  for (const a of jisA) {
    for (const b of jisB) {
      const pos1 = getJiPositionName(nameA, a.posIndex);
      const pos2 = getJiPositionName(nameB, b.posIndex);
      const sig = getSignificance(a.posIndex, b.posIndex);

      if (matchPair(JIJI_YUKHAP_PAIRS, a.ji, b.ji)) {
        results.push({ type: '합', ji1: a.ji, ji2: b.ji, position1: pos1, position2: pos2, significance: sig });
      }
      if (matchPair(JIJI_CHUNG_PAIRS, a.ji, b.ji)) {
        results.push({ type: '충', ji1: a.ji, ji2: b.ji, position1: pos1, position2: pos2, significance: sig });
      }
      if (matchPair(JIJI_HYEONG_PAIRS, a.ji, b.ji)) {
        results.push({ type: '형', ji1: a.ji, ji2: b.ji, position1: pos1, position2: pos2, significance: sig });
      }
      if (matchPair(JIJI_PA_PAIRS, a.ji, b.ji)) {
        results.push({ type: '파', ji1: a.ji, ji2: b.ji, position1: pos1, position2: pos2, significance: sig });
      }
      if (matchPair(JIJI_HAE_PAIRS, a.ji, b.ji)) {
        results.push({ type: '해', ji1: a.ji, ji2: b.ji, position1: pos1, position2: pos2, significance: sig });
      }
    }
  }

  return results;
}

function getSignificance(posA: number, posB: number): JijiSignificance {
  // 일지(2) > 월지(1) > 연지(0)/시지(3)
  if (posA === 2 || posB === 2) return 'high';
  if (posA === 1 || posB === 1) return 'medium';
  return 'low';
}

// ── 점수 산출 ──

function calculateScore(
  dayGanRelation: DayGanRelation,
  yongSinExchange: YongSinExchange,
  jijiRelations: CrossJijiRelation[],
  sinsalA: { name: string }[],
  sinsalB: { name: string }[],
  relationType: RelationType,
): number {
  let score = 50; // 기본 50점에서 가감

  // 1. 용신 교환 (40점 배분, +20 ~ -20)
  const yongSinScore = getYongSinScore(yongSinExchange);
  score += yongSinScore;

  // 2. 일간 관계 (20점 배분, +10 ~ -10)
  score += getDayGanScore(dayGanRelation, relationType);

  // 3. 지지 합충 (25점 배분)
  score += getJijiScore(jijiRelations);

  // 4. 신살 (15점 배분)
  score += getSinsalScore(sinsalA, sinsalB, relationType);

  // 범위 제한
  return Math.max(0, Math.min(100, Math.round(score)));
}

function getYongSinScore(exchange: YongSinExchange): number {
  let score = 0;
  const effectScore = { helpful: 10, neutral: 0, harmful: -10 };
  score += effectScore[exchange.aToB];
  score += effectScore[exchange.bToA];
  return score;
}

function getDayGanScore(relation: DayGanRelation, relationType: RelationType): number {
  switch (relation.type) {
    case '상생':
      return relationType === 'couple' ? 8 : 6;
    case '비겁':
      return relationType === 'friend' || relationType === 'friends' ? 6 : 2;
    case '상극':
      return relationType === 'business' || relationType === 'boss_sub' ? 2 : -6;
    default:
      return 0;
  }
}

function getJijiScore(relations: CrossJijiRelation[]): number {
  let score = 0;
  for (const rel of relations) {
    const weight = rel.significance === 'high' ? 2 : rel.significance === 'medium' ? 1.5 : 1;
    switch (rel.type) {
      case '합':
        score += 3 * weight;
        break;
      case '충':
        score -= 3 * weight;
        break;
      case '형':
        score -= 2 * weight;
        break;
      case '파':
        score -= 1.5 * weight;
        break;
      case '해':
        score -= 1 * weight;
        break;
    }
  }
  // 25점 배분 범위 제한
  return Math.max(-12, Math.min(12, Math.round(score)));
}

function getSinsalScore(
  sinsalA: { name: string }[],
  sinsalB: { name: string }[],
  relationType: RelationType,
): number {
  let score = 0;
  const allSinsal = [...sinsalA.map(s => s.name), ...sinsalB.map(s => s.name)];

  // 도화살 — 연인에겐 +, 사업에겐 -
  const dohwaCount = allSinsal.filter(s => s === '도화살').length;
  if (relationType === 'couple') {
    score += dohwaCount * 2;
  } else if (relationType === 'business' || relationType === 'boss_sub') {
    score -= dohwaCount;
  }

  // 천을귀인 — 보편적 +
  const gwiin = allSinsal.filter(s => s === '천을귀인').length;
  score += gwiin * 2;

  // 역마살 — 사업에겐 +
  const yeokma = allSinsal.filter(s => s === '역마살').length;
  if (relationType === 'business') score += yeokma * 2;

  // 원진살 — 부정적
  const wonjin = allSinsal.filter(s => s === '원진살').length;
  score -= wonjin * 3;

  // 괴강살 — 상사/부하에선 주의
  const gwaegang = allSinsal.filter(s => s === '괴강살').length;
  if (relationType === 'boss_sub') score -= gwaegang * 2;

  return Math.max(-8, Math.min(8, score));
}

function getGunghamRating(score: number): GunghamRating {
  if (score >= 85) return '천생연분';
  if (score >= 70) return '좋은 인연';
  if (score >= 50) return '보통';
  if (score >= 35) return '노력 필요';
  return '주의';
}

// ── 관계 유형별 해석 ──

const RELATION_INTERPRETATION: Record<RelationType, {
  sangSaeng: { strengths: string[]; weaknesses: string[]; advice: string };
  biGeop: { strengths: string[]; weaknesses: string[]; advice: string };
  sangGeuk: { strengths: string[]; weaknesses: string[]; advice: string };
}> = {
  couple: {
    sangSaeng: {
      strengths: ['자연스러운 정서적 교류가 이루어집니다', '한쪽이 안정감을 주고 다른 쪽이 활력을 불어넣는 보완적 관계입니다'],
      weaknesses: ['에너지를 주는 쪽이 지칠 수 있습니다', '한쪽의 헌신이 당연시될 수 있습니다'],
      advice: '서로의 기여를 인정하고 감사를 표현하는 것이 중요합니다. 가끔은 역할을 바꿔보는 것도 좋습니다.',
    },
    biGeop: {
      strengths: ['서로를 잘 이해합니다', '취향과 가치관이 비슷해 편안합니다'],
      weaknesses: ['비슷한 부분이 많아 자극이 부족할 수 있습니다', '갈등 시 양보가 어려울 수 있습니다'],
      advice: '서로의 차이점에서 매력을 찾는 것이 좋습니다. 새로운 경험을 함께 시도해보세요.',
    },
    sangGeuk: {
      strengths: ['강렬한 끌림이 있을 수 있습니다', '서로를 성장시킬 수 있는 관계입니다'],
      weaknesses: ['감정적 충돌이 잦을 수 있습니다', '한쪽이 주도하고 다른 쪽이 따르는 구도가 되기 쉽습니다'],
      advice: '갈등을 성장의 기회로 전환하려는 노력이 필요합니다. 서로의 영역을 존중해주세요.',
    },
  },
  parent_child: {
    sangSaeng: {
      strengths: ['자연스러운 가르침과 배움의 관계입니다', '세대 간 에너지 전달이 원활합니다'],
      weaknesses: ['과보호나 과의존이 생길 수 있습니다'],
      advice: '적절한 거리를 유지하며 독립성을 키워주세요.',
    },
    biGeop: {
      strengths: ['서로를 이해하기 쉽습니다', '같은 관점에서 대화할 수 있습니다'],
      weaknesses: ['의견 충돌 시 양보가 어렵습니다', '각자의 주장이 강해질 수 있습니다'],
      advice: '세대 차이를 인정하고 열린 대화를 유지하세요.',
    },
    sangGeuk: {
      strengths: ['훈육과 성장의 동력이 될 수 있습니다'],
      weaknesses: ['갈등과 반발이 생기기 쉽습니다', '소통 단절의 위험이 있습니다'],
      advice: '강압보다 이해를 바탕으로 한 소통이 중요합니다. 서로의 입장을 경청하세요.',
    },
  },
  friend: {
    sangSaeng: {
      strengths: ['서로에게 좋은 영향을 주는 관계입니다', '함께 있으면 에너지가 충전됩니다'],
      weaknesses: ['한쪽이 더 많이 베푸는 구도가 될 수 있습니다'],
      advice: '균형 있는 교류를 유지하세요. 서로의 성장을 응원해주는 관계로 발전할 수 있습니다.',
    },
    biGeop: {
      strengths: ['깊은 공감과 이해가 가능합니다', '같은 관심사를 공유하기 좋습니다'],
      weaknesses: ['경쟁심이 생길 수 있습니다'],
      advice: '경쟁보다 협력에 초점을 맞추세요. 서로 다른 강점을 인정하면 더 좋은 관계가 됩니다.',
    },
    sangGeuk: {
      strengths: ['서로 다른 시각을 제공합니다', '성장의 자극이 됩니다'],
      weaknesses: ['의견 차이로 갈등이 생길 수 있습니다'],
      advice: '다름을 인정하고 존중하는 것이 우정의 핵심입니다.',
    },
  },
  business: {
    sangSaeng: {
      strengths: ['한쪽이 아이디어를 내고 다른 쪽이 실행하는 보완 구조입니다', '시너지가 생기기 좋은 조합입니다'],
      weaknesses: ['역할 분담이 명확하지 않으면 갈등이 생깁니다'],
      advice: '역할과 책임을 명확히 정하고 정기적으로 점검하세요.',
    },
    biGeop: {
      strengths: ['같은 방향을 보고 있어 의사결정이 빠릅니다'],
      weaknesses: ['비슷한 강점끼리 겹쳐 비효율이 생길 수 있습니다', '견제 기능이 약합니다'],
      advice: '서로 다른 분야를 맡아 시너지를 만드세요. 외부 자문을 활용하는 것도 좋습니다.',
    },
    sangGeuk: {
      strengths: ['서로 견제하며 균형을 잡을 수 있습니다', '리스크 관리에 유리합니다'],
      weaknesses: ['결정 과정에서 충돌이 잦을 수 있습니다'],
      advice: '의사결정 프로세스를 미리 정하세요. 갈등은 사업의 질을 높이는 도구로 활용할 수 있습니다.',
    },
  },
  boss_sub: {
    sangSaeng: {
      strengths: ['자연스러운 지도-학습 관계가 형성됩니다', '업무 흐름이 원활합니다'],
      weaknesses: ['자율성이 제한될 수 있습니다'],
      advice: '상사는 방향을 제시하되 실행의 자율성을 보장하세요.',
    },
    biGeop: {
      strengths: ['서로의 업무 스타일을 이해합니다'],
      weaknesses: ['주도권 다툼이 생길 수 있습니다', '의견 충돌 시 해소가 어렵습니다'],
      advice: '역할의 경계를 명확히 하고, 의사결정 권한을 분명히 정하세요.',
    },
    sangGeuk: {
      strengths: ['강한 추진력이 생길 수 있습니다'],
      weaknesses: ['업무 스트레스가 높아질 수 있습니다', '갈등이 업무 성과에 직접 영향을 줍니다'],
      advice: '정기적 소통으로 오해를 방지하세요. 상호 존중을 기반으로 관계를 구축해야 합니다.',
    },
  },
  team: {
    sangSaeng: {
      strengths: ['팀 내 에너지 흐름이 원활합니다'],
      weaknesses: ['역할 구분이 모호해질 수 있습니다'],
      advice: '각자의 역할을 명확히 하면 시너지가 극대화됩니다.',
    },
    biGeop: {
      strengths: ['팀의 결속력이 강합니다'],
      weaknesses: ['다양성이 부족할 수 있습니다'],
      advice: '외부의 다른 시각을 적극 수용하세요.',
    },
    sangGeuk: {
      strengths: ['다양한 시각으로 문제를 해결할 수 있습니다'],
      weaknesses: ['팀 내 갈등이 생기기 쉽습니다'],
      advice: '갈등 관리 규칙을 미리 정하고, 정기적으로 소통 시간을 가지세요.',
    },
  },
  family: {
    sangSaeng: {
      strengths: ['가족 간 자연스러운 유대가 형성됩니다'],
      weaknesses: ['과의존 구조가 될 수 있습니다'],
      advice: '각자의 독립성을 존중하면서 유대를 유지하세요.',
    },
    biGeop: {
      strengths: ['서로를 잘 이해합니다'],
      weaknesses: ['갈등 시 감정이 깊어질 수 있습니다'],
      advice: '가족이라도 적절한 거리가 필요합니다.',
    },
    sangGeuk: {
      strengths: ['서로 다른 성향이 가족의 다양성을 만듭니다'],
      weaknesses: ['세대 갈등이나 가치관 충돌이 있을 수 있습니다'],
      advice: '서로의 다름을 가족의 강점으로 받아들이세요.',
    },
  },
  friends: {
    sangSaeng: {
      strengths: ['그룹 내 자연스러운 리더십이 형성됩니다'],
      weaknesses: ['특정 인물에 대한 의존이 생길 수 있습니다'],
      advice: '리더십을 돌아가며 발휘하면 더 건강한 그룹이 됩니다.',
    },
    biGeop: {
      strengths: ['깊은 동류 의식과 결속력이 있습니다'],
      weaknesses: ['외부 의견에 폐쇄적이 될 수 있습니다'],
      advice: '그룹 밖의 관계도 소중히 여기세요.',
    },
    sangGeuk: {
      strengths: ['다양한 시각으로 풍부한 대화가 가능합니다'],
      weaknesses: ['갈등이 그룹을 분열시킬 수 있습니다'],
      advice: '갈등 시 중재 역할을 할 수 있는 사람이 중요합니다.',
    },
  },
};

function getInterpretation(
  dayGanRelation: DayGanRelation,
  relationType: RelationType,
  nameA: string,
  nameB: string,
  score: number,
): PairInterpretation {
  const template = RELATION_INTERPRETATION[relationType];
  const key = dayGanRelation.type === '상생' ? 'sangSaeng'
    : dayGanRelation.type === '비겁' ? 'biGeop'
    : 'sangGeuk';

  const interp = template[key];
  const rating = getGunghamRating(score);

  let summary: string;
  if (rating === '천생연분' || rating === '좋은 인연') {
    summary = `${nameA}와 ${nameB}의 관계는 서로에게 긍정적인 에너지를 주는 좋은 인연입니다. 다만 이 점수가 관계의 전부가 아닙니다.`;
  } else if (rating === '보통') {
    summary = `${nameA}와 ${nameB}의 관계는 노력에 따라 좋아질 수 있는 가능성이 있습니다. 점수는 참고치일 뿐, 관계의 질은 서로의 노력에 달려 있습니다.`;
  } else {
    summary = `${nameA}와 ${nameB}의 관계는 서로 다른 부분이 많아 의식적인 노력이 필요합니다. 하지만 점수가 낮다고 반드시 나쁜 관계는 아닙니다.`;
  }

  return {
    summary,
    strengths: interp.strengths,
    weaknesses: interp.weaknesses,
    advice: interp.advice,
  };
}

// ── 그룹 역학 (3인) ──

function analyzeGroupDynamics(
  persons: GunghamPerson[],
  pairs: GunghamPair[],
): GroupDynamics {
  // 전체 점수 = 쌍별 점수 평균
  const overallScore = Math.round(pairs.reduce((sum, p) => sum + p.score, 0) / pairs.length);

  // 오행 분포
  const elementCount: Record<Element, number> = { '木': 0, '火': 0, '土': 0, '金': 0, '水': 0 };
  for (const person of persons) {
    const elements = getPillarElements(person.pillars);
    for (const e of elements) elementCount[e]++;
  }

  const sorted = Object.entries(elementCount).sort(([, a], [, b]) => b - a);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  const ohengBalance = `그룹 전체에서 ${strongest[0]}(이)가 가장 강하고(${strongest[1]}개), ${weakest[0]}(이)가 가장 약합니다(${weakest[1]}개).`;

  // 핵심 인물 = 가장 많은 쌍에서 높은 점수를 받는 사람
  const personScores: Record<string, number> = {};
  for (const person of persons) personScores[person.name] = 0;
  for (const pair of pairs) {
    personScores[pair.personA] += pair.score;
    personScores[pair.personB] += pair.score;
  }
  const keyPerson = Object.entries(personScores).sort(([, a], [, b]) => b - a)[0][0];

  // 또한 용신을 가장 많이 보완해주는 사람 = 그룹 중심
  const description = overallScore >= 65
    ? `세 사람의 관계는 전반적으로 조화롭습니다. ${keyPerson}이(가) 그룹의 중심 역할을 하는 경향이 있습니다.`
    : overallScore >= 45
    ? `세 사람의 관계는 균형 잡히지만 부분적 갈등 가능성이 있습니다. ${keyPerson}이(가) 중재자 역할을 하면 좋겠습니다.`
    : `세 사람의 관계에는 조율이 필요합니다. ${keyPerson}이(가) 다리 역할을 하면 관계가 개선될 수 있습니다.`;

  return { overallScore, ohengBalance, keyPerson, description };
}

// ── 메인 분석 함수 ──

export function analyzeGungham(input: GunghamInput): GunghamResult {
  if (input.persons.length < 2 || input.persons.length > 3) {
    throw new Error('궁합 분석은 2인 또는 3인만 지원합니다.');
  }

  // 1. 각 인원 개별 분석
  const analyzedPersons: { person: GunghamPerson; sinsal: { name: string }[] }[] = [];

  for (const p of input.persons) {
    const sajuInput: SajuInput = {
      birthDate: p.birthDate,
      birthTime: p.birthTime,
      calendar: p.calendar || 'solar',
      birthCity: p.birthCity,
      gender: p.gender,
    };

    const full = analyzeFullSaju(sajuInput);
    const dayGanElement = STEM_ELEMENT[full.pillars.day.gan];

    analyzedPersons.push({
      person: {
        name: p.name,
        pillars: full.pillars,
        dayGanElement,
        strengthLevel: full.strength.level,
        yongSinPrimary: full.yongSin.final.primary as Element,
      },
      sinsal: full.sinsal,
    });
  }

  // 2. 쌍별 분석
  const pairs: GunghamPair[] = [];

  for (let i = 0; i < analyzedPersons.length; i++) {
    for (let j = i + 1; j < analyzedPersons.length; j++) {
      const a = analyzedPersons[i];
      const b = analyzedPersons[j];

      const dayGanRelation = getDayGanRelation(
        a.person.dayGanElement,
        b.person.dayGanElement,
        a.person.name,
        b.person.name,
      );

      const yongSinExchange: YongSinExchange = {
        aToB: getYongSinEffect(a.person.dayGanElement, a.person.pillars, b.person.yongSinPrimary),
        bToA: getYongSinEffect(b.person.dayGanElement, b.person.pillars, a.person.yongSinPrimary),
        description: '',
      };
      yongSinExchange.description = getYongSinExchangeDescription(
        yongSinExchange.aToB, yongSinExchange.bToA, a.person.name, b.person.name,
      );

      const jijiRelations = detectCrossJijiRelations(
        a.person.pillars, b.person.pillars, a.person.name, b.person.name,
      );

      const score = calculateScore(
        dayGanRelation, yongSinExchange, jijiRelations,
        a.sinsal, b.sinsal, input.relationType,
      );

      const rating = getGunghamRating(score);

      const interpretation = getInterpretation(
        dayGanRelation, input.relationType, a.person.name, b.person.name, score,
      );

      pairs.push({
        personA: a.person.name,
        personB: b.person.name,
        dayGanRelation,
        yongSinExchange,
        jijiRelations,
        score,
        rating,
        interpretation,
      });
    }
  }

  // 3. 그룹 역학 (3인)
  let groupDynamics: GroupDynamics | undefined;
  if (analyzedPersons.length === 3) {
    groupDynamics = analyzeGroupDynamics(
      analyzedPersons.map(a => a.person),
      pairs,
    );
  }

  return {
    persons: analyzedPersons.map(a => a.person),
    pairs,
    groupDynamics,
  };
}

// ── 관점 질문 세트 ──

export interface PerspectiveQuestion {
  id: string;
  question: string;
  options: { label: string; value: string }[];
}

export const PERSPECTIVE_QUESTIONS: Record<string, PerspectiveQuestion[]> = {
  couple: [
    {
      id: 'desire',
      question: '이 관계에서 무엇을 원하나?',
      options: [
        { label: '편안함과 안정', value: 'stability' },
        { label: '설렘과 열정', value: 'passion' },
        { label: '함께 성장하는 동반자', value: 'growth' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'state',
      question: '지금 자네의 상태는?',
      options: [
        { label: '외롭거나 힘든 시기', value: 'hard' },
        { label: '안정적인 편', value: 'stable' },
        { label: '변화를 원하는 시기', value: 'change' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'expect',
      question: '이 사람에게 가장 바라는 것은?',
      options: [
        { label: '정서적 위로와 공감', value: 'empathy' },
        { label: '미래를 함께 그릴 수 있는 비전', value: 'vision' },
        { label: '있는 그대로의 나를 받아주는 것', value: 'acceptance' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
  ],
  parent_child: [
    {
      id: 'value',
      question: '이 관계에서 가장 중요한 것은?',
      options: [
        { label: '서로에 대한 이해', value: 'understanding' },
        { label: '신뢰와 존중', value: 'trust' },
        { label: '솔직한 소통', value: 'honest' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'current',
      question: '지금 이 관계는 어떤 상태인가?',
      options: [
        { label: '가깝고 편안하다', value: 'close' },
        { label: '거리감이 있다', value: 'distant' },
        { label: '갈등이 있다', value: 'conflict' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'wish',
      question: '이 관계가 어떻게 되길 바라나?',
      options: [
        { label: '지금처럼 유지', value: 'maintain' },
        { label: '더 가까워지고 싶다', value: 'closer' },
        { label: '서로 독립적이되 연결된 관계', value: 'independent' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
  ],
  friend: [
    {
      id: 'important',
      question: '이 사람과의 관계에서 중요한 것은?',
      options: [
        { label: '마음이 통하는 교감', value: 'empathy' },
        { label: '서로에게 좋은 영향', value: 'influence' },
        { label: '함께 있을 때의 즐거움', value: 'fun' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'duration',
      question: '이 사람과 얼마나 오래 알았나?',
      options: [
        { label: '아직 잘 모르는 사이', value: 'new' },
        { label: '어느 정도 알고 있다', value: 'moderate' },
        { label: '오래된 관계', value: 'long' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'concern',
      question: '이 관계에서 걱정되는 것이 있나?',
      options: [
        { label: '특별히 없다', value: 'none' },
        { label: '가끔 의견 충돌이 있다', value: 'clash' },
        { label: '거리가 멀어지는 느낌', value: 'drifting' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
  ],
  business: [
    {
      id: 'priority',
      question: '이 파트너십에서 가장 중요한 것은?',
      options: [
        { label: '실력과 전문성 보완', value: 'complement' },
        { label: '신뢰와 투명성', value: 'trust' },
        { label: '추진력과 실행력', value: 'execution' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'stage',
      question: '지금 사업의 상태는?',
      options: [
        { label: '준비/초기 단계', value: 'early' },
        { label: '성장 중', value: 'growing' },
        { label: '어려움을 겪고 있다', value: 'struggling' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'role',
      question: '이 사람에게 기대하는 역할은?',
      options: [
        { label: '의사결정 파트너', value: 'decision' },
        { label: '실무 실행자', value: 'executor' },
        { label: '외부 네트워크/영업', value: 'network' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
  ],
  boss_sub: [
    {
      id: 'need',
      question: '이 관계에서 가장 필요한 것은?',
      options: [
        { label: '명확한 방향 제시와 피드백', value: 'direction' },
        { label: '자율성과 신뢰', value: 'autonomy' },
        { label: '성과에 대한 공정한 평가', value: 'fairness' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'environment',
      question: '지금 업무 환경은 어떤가?',
      options: [
        { label: '안정적이고 순탄', value: 'stable' },
        { label: '빠르게 변화 중', value: 'changing' },
        { label: '압박이 큰 상황', value: 'pressure' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
    {
      id: 'change',
      question: '이 사람과의 관계에서 바꾸고 싶은 것은?',
      options: [
        { label: '소통 방식', value: 'communication' },
        { label: '업무 분담', value: 'workload' },
        { label: '특별히 없다', value: 'none' },
        { label: '잘 모르겠어요', value: 'neutral' },
      ],
    },
  ],
};

// ── 관점 기반 해석 재조합 ──

export interface PerspectiveAnswer {
  questionId: string;
  value: string;
}

export interface PerspectiveInterpretation {
  opening: string;
  insights: string[];
  closing: string;
}

export function generatePerspectiveInterpretation(
  pair: GunghamPair,
  relationType: RelationType,
  answers: PerspectiveAnswer[],
): PerspectiveInterpretation {
  const insights: string[] = [];
  let opening = '';
  let closing = '';

  const answerMap: Record<string, string> = {};
  for (const a of answers) answerMap[a.questionId] = a.value;

  const rel = pair.dayGanRelation.type;
  const score = pair.score;

  if (relationType === 'couple') {
    opening = getCoupleOpening(rel, answerMap);
    insights.push(...getCoupleInsights(rel, answerMap, pair));
    closing = getCoupleClosing(score, answerMap);
  } else if (relationType === 'parent_child') {
    opening = getParentChildOpening(rel, answerMap);
    insights.push(...getParentChildInsights(rel, answerMap, pair));
    closing = getParentChildClosing(score, answerMap);
  } else if (relationType === 'friend' || relationType === 'friends') {
    opening = getFriendOpening(rel, answerMap);
    insights.push(...getFriendInsights(rel, answerMap, pair));
    closing = getFriendClosing(score, answerMap);
  } else if (relationType === 'business') {
    opening = getBusinessOpening(rel, answerMap);
    insights.push(...getBusinessInsights(rel, answerMap, pair));
    closing = getBusinessClosing(score, answerMap);
  } else if (relationType === 'boss_sub') {
    opening = getBossSubOpening(rel, answerMap);
    insights.push(...getBossSubInsights(rel, answerMap, pair));
    closing = getBossSubClosing(score, answerMap);
  } else {
    // team, family — 기본 해석
    opening = '이 관점에서 보면...';
    insights.push(pair.interpretation.summary);
    closing = '숫자에 얽매이지 말고, 이해의 도구로 사용하게.';
  }

  return { opening, insights, closing };
}

// ── couple 관점 해석 ──

function getCoupleOpening(rel: DayGanRelationType, answers: Record<string, string>): string {
  const desire = answers['desire'] || 'neutral';
  if (desire === 'stability') {
    return rel === '상극'
      ? '편안함을 원하는 자네에게 이 관계의 긴장감은 도전이 될 수 있네.'
      : '안정을 추구하는 자네에게 이 관계는 따뜻한 쉼터가 될 수 있네.';
  }
  if (desire === 'passion') {
    return rel === '비겁'
      ? '설렘을 원하는 자네에게 이 관계는 다소 익숙하게 느껴질 수 있네.'
      : '열정을 추구하는 자네라면, 이 관계에서 강한 에너지를 느낄 수 있네.';
  }
  if (desire === 'growth') {
    return '함께 성장하길 원하는 자네에게, 이 관계는 서로를 비추는 거울이 될 수 있네.';
  }
  return '이 관점에서 두 사람의 관계를 살펴보겠네.';
}

function getCoupleInsights(rel: DayGanRelationType, answers: Record<string, string>, pair: GunghamPair): string[] {
  const insights: string[] = [];
  const state = answers['state'] || 'neutral';
  const expect = answers['expect'] || 'neutral';

  if (state === 'hard') {
    if (rel === '상극') {
      insights.push('지금은 힘든 시기라 이 관계의 긴장감이 부담될 수 있네. 서로 거리를 두되 완전히 멀어지지 않는 것이 좋겠어.');
    } else {
      insights.push('힘든 시기에 이 사람은 자네에게 위안이 될 수 있네. 함께하는 시간을 소중히 여기게.');
    }
  } else if (state === 'stable') {
    if (rel === '상극') {
      insights.push('안정적인 지금, 이 자극이 오히려 정체된 자네를 깨울 수 있네. 성장의 기회로 삼을 수 있어.');
    } else {
      insights.push('안정적인 시기에 만난 인연은 오래 갈 가능성이 높네. 이 기반 위에 관계를 쌓아가게.');
    }
  } else if (state === 'change') {
    insights.push('변화를 원하는 시기에 만난 인연이라면, 서로가 새로운 방향을 제시할 수 있네.');
  }

  if (expect === 'empathy') {
    const exchange = pair.yongSinExchange;
    if (exchange.bToA === 'helpful') {
      insights.push('정서적 위로를 원하는 자네에게, 이 사람은 용신을 도와주는 구조이니 실제로 마음의 안정을 줄 수 있는 사람이네.');
    } else {
      insights.push('정서적 공감을 바라지만, 오행 구조상 방식이 다를 수 있네. 직접 표현하는 것이 중요하네.');
    }
  } else if (expect === 'vision') {
    insights.push('미래를 함께 그리길 원하는 자네에게, 이 관계는 서로의 약점을 보완해주는 방향으로 발전할 수 있네.');
  } else if (expect === 'acceptance') {
    insights.push('있는 그대로 받아주길 바라는 것은 모든 관계의 기본이네. 이 사람도 같은 마음일 것이야.');
  }

  return insights;
}

function getCoupleClosing(score: number, answers: Record<string, string>): string {
  if (score >= 70) return '좋은 인연이지만, 점수가 높아도 노력 없이 유지되는 관계는 없네. 서로를 향한 마음을 잊지 말게.';
  if (score >= 50) return '관계는 만들어가는 것이네. 서로의 부족함을 채워주려는 마음이 있다면, 이 인연은 충분히 깊어질 수 있네.';
  return '점수가 낮더라도 서로의 다름을 이해하면 더 깊은 관계가 될 수 있네. 숫자에 얽매이지 말게.';
}

// ── parent_child 관점 해석 ──

function getParentChildOpening(rel: DayGanRelationType, answers: Record<string, string>): string {
  const value = answers['value'] || 'neutral';
  if (value === 'understanding') return '이해를 중시하는 자네라면, 사주 구조를 통해 서로의 성향을 더 깊이 알 수 있네.';
  if (value === 'trust') return '신뢰와 존중은 모든 관계의 기본이네. 사주가 보여주는 구조를 통해 서로를 더 이해할 수 있네.';
  if (value === 'honest') return '솔직한 소통을 원하는 자네에게, 두 사람의 오행 구조가 대화의 힌트를 줄 수 있네.';
  return '이 관점에서 두 사람의 관계를 살펴보겠네.';
}

function getParentChildInsights(rel: DayGanRelationType, answers: Record<string, string>, pair: GunghamPair): string[] {
  const insights: string[] = [];
  const current = answers['current'] || 'neutral';

  if (current === 'close') {
    insights.push('가깝고 편안한 관계라면, 지금의 유대를 유지하면서 각자의 성장도 응원해주게.');
  } else if (current === 'distant') {
    if (rel === '상극') {
      insights.push('거리감이 있는 것은 오행 구조상 자연스러운 면이 있네. 서로의 방식이 다를 뿐이야.');
    } else {
      insights.push('거리감이 있다면, 작은 것부터 공유하며 다시 가까워질 수 있네.');
    }
  } else if (current === 'conflict') {
    insights.push('갈등이 있다면, 사주 구조를 통해 서로의 다른 점을 이해하는 것이 첫걸음이네.');
  }

  const wish = answers['wish'] || 'neutral';
  if (wish === 'closer') {
    insights.push('더 가까워지고 싶다면, 상대의 오행 성향에 맞는 방식으로 다가가보게.');
  } else if (wish === 'independent') {
    insights.push('독립적이되 연결된 관계를 원한다면, 서로의 영역을 존중하면서 핵심적인 부분에서 연결 고리를 유지하게.');
  }

  return insights;
}

function getParentChildClosing(score: number, answers: Record<string, string>): string {
  return '가족 관계는 점수로 매길 수 없는 것이네. 사주는 서로를 이해하는 도구일 뿐, 관계의 깊이는 마음에 달려 있네.';
}

// ── friend 관점 해석 ──

function getFriendOpening(rel: DayGanRelationType, answers: Record<string, string>): string {
  const important = answers['important'] || 'neutral';
  if (important === 'empathy') return '마음이 통하는 교감을 중시하는 자네에게, 이 관계의 오행 구조를 살펴보겠네.';
  if (important === 'influence') return '서로에게 좋은 영향을 주는 관계를 원하는 자네에게, 용신 교환 구조가 중요한 힌트를 주네.';
  if (important === 'fun') return '함께하는 즐거움을 중시하는 자네라면, 두 사람의 에너지 흐름이 잘 맞는지 살펴보겠네.';
  return '이 관점에서 두 사람의 관계를 살펴보겠네.';
}

function getFriendInsights(rel: DayGanRelationType, answers: Record<string, string>, pair: GunghamPair): string[] {
  const insights: string[] = [];
  const concern = answers['concern'] || 'neutral';

  if (concern === 'clash') {
    if (rel === '상극') {
      insights.push('의견 충돌은 오행 구조상 자연스러운 면이 있네. 서로 다른 시각이 오히려 관계를 풍요롭게 만들 수 있어.');
    } else {
      insights.push('가끔의 충돌은 관계가 살아있다는 증거이네. 서로의 의견을 존중하며 조율해가게.');
    }
  } else if (concern === 'drifting') {
    insights.push('거리가 멀어지는 느낌이라면, 작은 연락이라도 꾸준히 유지하는 것이 좋겠네.');
  } else if (concern === 'none') {
    insights.push('걱정이 없다면 좋은 관계를 유지하고 있는 것이네. 감사하는 마음을 가지게.');
  }

  return insights;
}

function getFriendClosing(score: number, answers: Record<string, string>): string {
  return '좋은 친구는 인생의 보물이네. 점수는 참고일 뿐, 서로를 아끼는 마음이 관계의 본질이야.';
}

// ── business 관점 해석 ──

function getBusinessOpening(rel: DayGanRelationType, answers: Record<string, string>): string {
  const priority = answers['priority'] || 'neutral';
  if (priority === 'complement') return '실력 보완을 중시하는 자네에게, 두 사람의 오행 조합이 어떤 시너지를 낼 수 있는지 살펴보겠네.';
  if (priority === 'trust') return '신뢰를 중시하는 것은 사업의 기본이네. 오행 구조를 통해 서로의 성향을 이해해보게.';
  if (priority === 'execution') return '추진력과 실행력을 원하는 자네에게, 이 파트너십의 에너지 구조를 살펴보겠네.';
  return '이 관점에서 사업 관계를 살펴보겠네.';
}

function getBusinessInsights(rel: DayGanRelationType, answers: Record<string, string>, pair: GunghamPair): string[] {
  const insights: string[] = [];
  const stage = answers['stage'] || 'neutral';

  if (stage === 'early') {
    if (rel === '상극') {
      insights.push('초기 단계에서 이 사람의 에너지가 돌파구를 만들 수 있네. 견제가 오히려 신중한 결정을 도울 수 있어.');
    } else {
      insights.push('초기 단계에서는 서로의 강점을 살려 역할을 분담하는 것이 중요하네.');
    }
  } else if (stage === 'growing') {
    insights.push('성장 중인 사업에서는 서로의 약점을 보완하는 것이 핵심이네. 용신 교환 구조를 잘 활용하게.');
  } else if (stage === 'struggling') {
    insights.push('어려운 시기에는 서로를 탓하기보다 각자의 강점에 집중하는 것이 중요하네.');
  }

  const role = answers['role'] || 'neutral';
  if (role === 'decision') {
    insights.push('의사결정 파트너를 원한다면, 서로의 관점 차이가 오히려 더 나은 결정을 이끌 수 있네.');
  } else if (role === 'executor') {
    insights.push('실무 실행을 기대한다면, 이 사람의 오행 성향이 실행력에 맞는지 살펴보게.');
  }

  return insights;
}

function getBusinessClosing(score: number, answers: Record<string, string>): string {
  return '사업 관계는 감정보다 구조가 중요하네. 역할 분담과 소통 규칙을 명확히 정하고, 정기적으로 점검하게.';
}

// ── boss_sub 관점 해석 ──

function getBossSubOpening(rel: DayGanRelationType, answers: Record<string, string>): string {
  const need = answers['need'] || 'neutral';
  if (need === 'direction') return '명확한 방향과 피드백을 원하는 자네에게, 이 관계의 에너지 흐름을 살펴보겠네.';
  if (need === 'autonomy') return '자율성을 중시하는 자네라면, 이 관계에서 어떤 공간이 필요한지 살펴보겠네.';
  if (need === 'fairness') return '공정한 평가를 원하는 것은 당연한 것이네. 오행 구조를 통해 서로의 기대를 이해해보게.';
  return '이 관점에서 관계를 살펴보겠네.';
}

function getBossSubInsights(rel: DayGanRelationType, answers: Record<string, string>, pair: GunghamPair): string[] {
  const insights: string[] = [];
  const env = answers['environment'] || 'neutral';

  if (env === 'pressure') {
    if (rel === '상극') {
      insights.push('압박이 큰 상황에서 상충이 있지만, 위기 상황에서 서로의 빈틈을 메울 수 있는 구조이기도 하네.');
    } else {
      insights.push('압박이 큰 상황에서 서로의 강점을 활용하면 위기를 넘길 수 있네.');
    }
  } else if (env === 'changing') {
    insights.push('빠르게 변화하는 환경에서는 유연한 소통이 핵심이네. 서로의 방식을 존중하면서 적응해가게.');
  } else if (env === 'stable') {
    insights.push('안정적인 환경에서는 장기적 관계를 구축하기 좋은 조건이네.');
  }

  return insights;
}

function getBossSubClosing(score: number, answers: Record<string, string>): string {
  return '직장 관계는 전문성과 존중으로 만들어가는 것이네. 사주는 참고일 뿐, 실력과 태도가 관계의 기반이야.';
}
