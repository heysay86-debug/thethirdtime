/**
 * 사업운 분석 엔진
 *
 * 3단계 구조:
 *   1. 관성+재성 복합 분석 — 관성 유형, 재성 유형, 4가지 조합 해석, 사업적성 점수(0~100)
 *   2. 업종 적성 — 용신 오행별 추천 업종 3~5개, 비추 업종 2~3개
 *   3. 사업 시기 + 주의점 — 최적 대운, 주의 시기(비겁 대운, 편관 무제화)
 */

import { getJijanggan } from './jijanggan';

type Element = '木' | '火' | '土' | '金' | '水';

const STEM_ELEMENT: Record<string, Element> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const BRANCH_ELEMENT: Record<string, Element> = {
  '子': '水', '丑': '土', '寅': '木', '卯': '木', '辰': '土', '巳': '火',
  '午': '火', '未': '土', '申': '金', '酉': '金', '戌': '土', '亥': '水',
};

const STEM_INFO: Record<string, { element: Element; yin: boolean }> = {
  '甲': { element: '木', yin: false }, '乙': { element: '木', yin: true },
  '丙': { element: '火', yin: false }, '丁': { element: '火', yin: true },
  '戊': { element: '土', yin: false }, '己': { element: '土', yin: true },
  '庚': { element: '金', yin: false }, '辛': { element: '金', yin: true },
  '壬': { element: '水', yin: false }, '癸': { element: '水', yin: true },
};

/** A가 B를 극한다 */
const DESTROYS: Record<Element, Element> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

/** A가 B를 생한다 */
const GENERATES: Record<Element, Element> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

// ── 관성 판별 ──

type GwanseongType = '편관' | '정관' | null;

function getGwanseongElement(dayGan: string): Element {
  const myElement = STEM_ELEMENT[dayGan];
  // 나를 극하는 오행 = 관성
  const DESTROYED_BY: Record<Element, Element> = {
    '木': '金', '火': '水', '土': '木', '金': '火', '水': '土',
  };
  return DESTROYED_BY[myElement];
}

// ── 사업적성 점수 ──

export interface BusinessScoreBreakdown {
  pyeonjae: number;      // 편재 유무: +30
  siksangSaengjae: number; // 식상생재: +20
  yeokma: number;        // 역마: +10
  pyeongwanJehwa: number;  // 편관 제화: +15
  singang: number;       // 신강: +25
  total: number;
}

export function calculateBusinessScore(
  tenGodsArray: string[],
  hasYeokma: boolean,
  strengthLevel: string,
  hasPyeongwanJehwa: boolean,
): BusinessScoreBreakdown {
  const hasPyeonjae = tenGodsArray.includes('편재');
  const hasSiksang = tenGodsArray.some(t => t === '식신' || t === '상관');
  const hasJae = tenGodsArray.some(t => t === '편재' || t === '정재');
  const hasSiksangSaengjae = hasSiksang && hasJae;
  const isStrong = strengthLevel === '신강' || strengthLevel === '극강';

  const pyeonjae = hasPyeonjae ? 30 : 0;
  const siksangSaengjae = hasSiksangSaengjae ? 20 : 0;
  const yeokma = hasYeokma ? 10 : 0;
  const pyeongwanJehwa = hasPyeongwanJehwa ? 15 : 0;
  const singang = isStrong ? 25 : 0;

  return {
    pyeonjae,
    siksangSaengjae,
    yeokma,
    pyeongwanJehwa,
    singang,
    total: pyeonjae + siksangSaengjae + yeokma + pyeongwanJehwa + singang,
  };
}

// ── 관성+재성 조합 해석 ──

type GwanJaeCombination = '관강재강' | '관강재약' | '관약재강' | '관약재약';

function getGwanJaeCombination(
  gwanCount: number,
  jaeCount: number,
): GwanJaeCombination {
  const gwanStrong = gwanCount >= 2;
  const jaeStrong = jaeCount >= 2;

  if (gwanStrong && jaeStrong) return '관강재강';
  if (gwanStrong && !jaeStrong) return '관강재약';
  if (!gwanStrong && jaeStrong) return '관약재강';
  return '관약재약';
}

const GWAN_JAE_INTERPRETATION: Record<GwanJaeCombination, { label: string; desc: string }> = {
  '관강재강': {
    label: '관성과 재성이 모두 강한 유형',
    desc: '조직 운영과 재물 관리 모두에 능합니다. 규모 있는 사업이 가능하며, 체계적인 경영과 수익 창출을 동시에 할 수 있습니다.',
  },
  '관강재약': {
    label: '관성은 강하나 재성이 약한 유형',
    desc: '관리 능력과 통솔력은 뛰어나지만, 돈을 직접 버는 것보다 조직에서 높은 자리에 오르는 것이 유리합니다. 사업보다 전문직이나 임원이 적합할 수 있습니다.',
  },
  '관약재강': {
    label: '관성은 약하고 재성이 강한 유형',
    desc: '돈을 버는 감각은 뛰어나지만, 조직 관리나 규율에는 약합니다. 소규모 자영업이나 프리랜서형 사업이 적합합니다.',
  },
  '관약재약': {
    label: '관성과 재성이 모두 약한 유형',
    desc: '사업 운이 약한 편입니다. 큰 사업보다는 자기 전문성을 살리는 1인 기업이나 기술 기반 사업이 적합합니다.',
  },
};

// ── 업종 매핑 ──

export const INDUSTRY_BY_ELEMENT: Record<Element, { recommended: string[]; notRecommended: string[] }> = {
  '木': {
    recommended: ['교육', '출판', '환경', '농업', '패션'],
    notRecommended: ['금융', '금속가공', '광업'],
  },
  '火': {
    recommended: ['IT', '요식업', '엔터테인먼트', '미디어', '전자상거래'],
    notRecommended: ['수산업', '냉동', '물류'],
  },
  '土': {
    recommended: ['부동산', '중개업', '건설', '요식업', '유통'],
    notRecommended: ['임업', '조경', '목공'],
  },
  '金': {
    recommended: ['금융', '제조업', '법률', '의료기기', '자동차'],
    notRecommended: ['교육', '출판', '농업'],
  },
  '水': {
    recommended: ['무역', '유통', '서비스업', '관광', '수산'],
    notRecommended: ['전자', '조명', '화학'],
  },
};

// ── 주의 시기 ──

interface CautionPeriod {
  type: '비겁대운' | '편관무제화';
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
  reason: string;
}

// ── 결과 타입 ──

export interface BusinessReading {
  // 1단계: 관성+재성 복합 분석
  gwanJaeAnalysis: {
    gwanseongElement: Element;
    gwanseongCount: number;
    pyeongwanCount: number;
    jeonggwanCount: number;
    jaeseongElement: Element;
    jaeseongCount: number;
    combination: GwanJaeCombination;
    combinationLabel: string;
    combinationDesc: string;
    businessScore: BusinessScoreBreakdown;
  };

  // 2단계: 업종 적성
  industryFit: {
    yongsinElement: Element;
    recommended: string[];
    notRecommended: string[];
  };

  // 3단계: 사업 시기 + 주의점
  timing: {
    bestDaeun: { startAge: number; endAge: number; gan: string; ji: string; rating: string }[];
    cautionPeriods: CautionPeriod[];
  };
}

// ── 메인 분석 함수 ──

export function analyzeBusiness(
  sajuResult: {
    pillars: { year: { gan: string; ji: string }; month: { gan: string; ji: string }; day: { gan: string; ji: string }; hour: { gan: string; ji: string } | null };
    tenGods: any;
    sinsal: { name: string; position: string }[];
    strength: { level: string; score: number };
    yongSin: { final: { primary: string } };
    daeun: { periods: any[] } | null;
    seun: any[];
  },
): BusinessReading {
  const dayGan = sajuResult.pillars.day.gan;
  const dayInfo = STEM_INFO[dayGan];
  const gwanElement = getGwanseongElement(dayGan);
  const jaeElement = DESTROYS[dayInfo.element]; // 내가 극하는 오행

  const yongsinElement = sajuResult.yongSin.final.primary as Element;

  // 십성 배열
  const tenGods = sajuResult.tenGods;
  const allTenGods: string[] = [
    tenGods.yearGan, tenGods.monthGan, tenGods.hourGan,
    tenGods.yearJi, tenGods.monthJi, tenGods.dayJi, tenGods.hourJi,
  ].filter(Boolean);

  // 관성 카운트
  const pyeongwanCount = allTenGods.filter(t => t === '편관').length;
  const jeonggwanCount = allTenGods.filter(t => t === '정관').length;
  const gwanseongCount = pyeongwanCount + jeonggwanCount;

  // 재성 카운트
  const pyeonjaeCount = allTenGods.filter(t => t === '편재').length;
  const jeongjaeCount = allTenGods.filter(t => t === '정재').length;
  const jaeseongCount = pyeonjaeCount + jeongjaeCount;

  // 관+재 조합
  const combination = getGwanJaeCombination(gwanseongCount, jaeseongCount);
  const comboInfo = GWAN_JAE_INTERPRETATION[combination];

  // 편관 제화 여부: 편관이 있고, 식신이나 상관으로 제어되는지
  const hasPyeongwan = pyeongwanCount > 0;
  const hasJehwa = allTenGods.some(t => t === '식신' || t === '상관');
  const hasPyeongwanJehwa = hasPyeongwan && hasJehwa;

  // 역마살
  const hasYeokma = sajuResult.sinsal.some(s => s.name === '역마살');

  // 사업적성 점수
  const businessScore = calculateBusinessScore(
    allTenGods,
    hasYeokma,
    sajuResult.strength.level,
    hasPyeongwanJehwa,
  );

  // 업종 적성
  const industryInfo = INDUSTRY_BY_ELEMENT[yongsinElement];

  // 최적 대운: 재성 오행이 오는 대운 + 식상생재 대운
  const bestDaeun: BusinessReading['timing']['bestDaeun'] = [];
  const cautionPeriods: CautionPeriod[] = [];

  if (sajuResult.daeun) {
    for (const p of sajuResult.daeun.periods) {
      const ganEl = STEM_ELEMENT[p.gan];
      const jiEl = BRANCH_ELEMENT[p.ji];

      // 재성 오행 또는 식상 오행이 오는 대운 = 최적
      const siksangElement = GENERATES[dayInfo.element]; // 내가 생하는 오행
      if (ganEl === jaeElement || jiEl === jaeElement || ganEl === siksangElement || jiEl === siksangElement) {
        bestDaeun.push({
          startAge: p.startAge, endAge: p.endAge,
          gan: p.gan, ji: p.ji, rating: p.analysis.rating,
        });
      }

      // 비겁 대운 주의
      const ganTenGod = p.analysis.ganTenGod;
      const jiTenGod = p.analysis.jiTenGod;
      if (ganTenGod === '비견' || ganTenGod === '겁재' || jiTenGod === '비견' || jiTenGod === '겁재') {
        cautionPeriods.push({
          type: '비겁대운',
          startAge: p.startAge, endAge: p.endAge,
          gan: p.gan, ji: p.ji,
          reason: '비겁 대운은 경쟁이 심해지고 동업 분쟁, 재물 유출의 위험이 있습니다.',
        });
      }

      // 편관 무제화 주의
      if ((ganTenGod === '편관' || jiTenGod === '편관') && !hasPyeongwanJehwa) {
        cautionPeriods.push({
          type: '편관무제화',
          startAge: p.startAge, endAge: p.endAge,
          gan: p.gan, ji: p.ji,
          reason: '편관이 제화되지 않은 상태에서 편관 대운이 오면, 관재(소송/시비/사고) 위험이 높습니다.',
        });
      }
    }
  }

  return {
    gwanJaeAnalysis: {
      gwanseongElement: gwanElement,
      gwanseongCount,
      pyeongwanCount,
      jeonggwanCount,
      jaeseongElement: jaeElement,
      jaeseongCount,
      combination,
      combinationLabel: comboInfo.label,
      combinationDesc: comboInfo.desc,
      businessScore,
    },
    industryFit: {
      yongsinElement,
      recommended: industryInfo.recommended,
      notRecommended: industryInfo.notRecommended,
    },
    timing: {
      bestDaeun,
      cautionPeriods,
    },
  };
}
