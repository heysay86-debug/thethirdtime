/**
 * 금전운 분석 엔진
 *
 * 3단계 구조:
 *   1. 재성궁 분석 — 월주+일지 기반, 편재/정재 유형, 재성 오행, 재성 세력
 *   2. 금전 성향 — 돈 버는 방식, 소비 패턴, 역마살/귀문관살 유무, 신강약 영향
 *   3. 재물 시기 — 재성 오행이 오는 대운 시기, 편재/정재 세운 연도
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

/** 오행 상극: A가 B를 극한다 */
const DESTROYS: Record<Element, Element> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

// ── 재성 판별 ──

export type JaeseongType = '편재' | '정재';

/**
 * 일간이 극하는 오행 = 재성 오행.
 * 음양 같으면 편재, 다르면 정재.
 */
export function getJaeseongElement(dayGan: string): Element {
  const myElement = STEM_ELEMENT[dayGan];
  return DESTROYS[myElement];
}

export function getJaeseongType(dayGan: string, targetStem: string): JaeseongType {
  const dayInfo = STEM_INFO[dayGan];
  const targetInfo = STEM_INFO[targetStem];
  if (!dayInfo || !targetInfo) throw new Error(`잘못된 천간: ${dayGan}, ${targetStem}`);
  if (DESTROYS[dayInfo.element] !== targetInfo.element) {
    throw new Error(`${targetStem}은 ${dayGan}의 재성이 아닙니다`);
  }
  return dayInfo.yin === targetInfo.yin ? '편재' : '정재';
}

// ── 재성 세력 판정 ──

export type JaeseongStrength = 'strong' | 'moderate' | 'weak';

export interface JaeseongStrengthResult {
  level: JaeseongStrength;
  count: number;             // 원국 8글자 중 재성 오행 개수 (천간4+지지4)
  jijangganJeonggiCount: number; // 지장간 정기 중 재성 오행 개수
}

/**
 * 재성 세력을 판정한다.
 * - 원국 8글자(천간4+지지4) 중 재성 오행 개수 카운트
 * - 지장간 정기 중 재성 오행 여부 확인
 * - strong: 3개 이상 또는 2개+정기, moderate: 2개, weak: 0~1개
 */
export function analyzeJaeseongStrength(
  dayGan: string,
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  },
): JaeseongStrengthResult {
  const jaeElement = getJaeseongElement(dayGan);

  // 천간 카운트 (일간 제외: 연간, 월간, 시간)
  const gans = [pillars.year.gan, pillars.month.gan];
  if (pillars.hour) gans.push(pillars.hour.gan);

  let count = 0;
  for (const g of gans) {
    if (STEM_ELEMENT[g] === jaeElement) count++;
  }

  // 지지 카운트 (4지지)
  const jis = [pillars.year.ji, pillars.month.ji, pillars.day.ji];
  if (pillars.hour) jis.push(pillars.hour.ji);

  for (const j of jis) {
    if (BRANCH_ELEMENT[j] === jaeElement) count++;
  }

  // 지장간 정기 중 재성 오행 개수
  let jijangganJeonggiCount = 0;
  for (const j of jis) {
    const entries = getJijanggan(j);
    const jeonggi = entries[entries.length - 1]; // 마지막이 정기
    if (STEM_ELEMENT[jeonggi.stem] === jaeElement) {
      jijangganJeonggiCount++;
    }
  }

  let level: JaeseongStrength;
  if (count >= 3 || (count >= 2 && jijangganJeonggiCount >= 1)) {
    level = 'strong';
  } else if (count >= 2) {
    level = 'moderate';
  } else {
    level = 'weak';
  }

  return { level, count, jijangganJeonggiCount };
}

// ── 금전 성향 ──

const ELEMENT_MONEY_STYLE: Record<Element, { earning: string; spending: string }> = {
  '木': {
    earning: '계획적이고 성장 지향적인 방식으로 재물을 모읍니다. 투자나 사업 확장에 관심이 큽니다.',
    spending: '자기계발이나 미래 투자에 돈을 씁니다. 충동 소비보다는 장기적 안목의 지출.',
  },
  '火': {
    earning: '열정과 추진력으로 빠르게 돈을 법니다. 인맥과 영업력이 재물의 원천.',
    spending: '화끈하게 쓰는 편입니다. 대인관계나 유흥에 지출이 크고, 쥐었다 놓기도 합니다.',
  },
  '土': {
    earning: '안정적이고 꾸준하게 재물을 축적합니다. 부동산 등 실물 자산에 강합니다.',
    spending: '검소한 편입니다. 필요한 곳에만 쓰고, 저축 습관이 좋습니다.',
  },
  '金': {
    earning: '조직적이고 체계적인 방식으로 돈을 법니다. 금융이나 기술 분야에서 두각.',
    spending: '원칙적이고 절제된 소비. 품질 좋은 것에 투자하되 낭비는 하지 않습니다.',
  },
  '水': {
    earning: '유연하고 지혜로운 방식으로 재물을 모읍니다. 정보력과 기회 포착에 강합니다.',
    spending: '흐르는 물처럼 돈이 들어오고 나갑니다. 재테크에 관심이 많지만 변동성도 큽니다.',
  },
};

// ── 신강약 + 재성 조합 해석 ──

type StrengthLevel = '극강' | '신강' | '중화' | '신약' | '극약';

function getStrengthJaeseongInteraction(
  strengthLevel: StrengthLevel,
  jaeStrength: JaeseongStrength,
): { label: string; desc: string } {
  const isStrong = strengthLevel === '극강' || strengthLevel === '신강';
  const isWeak = strengthLevel === '신약' || strengthLevel === '극약';

  if (isStrong && (jaeStrength === 'strong' || jaeStrength === 'moderate')) {
    return {
      label: '신강재강(身強財強)',
      desc: '몸도 강하고 재물도 강합니다. 큰 재물을 감당할 힘이 있어 재물운이 좋습니다. 적극적으로 재테크나 사업을 해도 좋습니다.',
    };
  }
  if (isStrong && jaeStrength === 'weak') {
    return {
      label: '신강재약(身強財弱)',
      desc: '힘은 있으나 재물이 약합니다. 능력은 있는데 돈으로 연결이 안 되는 경우. 재성 대운이 올 때가 기회입니다.',
    };
  }
  if (isWeak && (jaeStrength === 'strong' || jaeStrength === 'moderate')) {
    return {
      label: '재다신약(財多身弱)',
      desc: '재물은 많으나 이를 감당할 힘이 부족합니다. 돈은 보이나 잡기 어렵고, 과도한 재물 욕심은 오히려 해가 됩니다. 인성(도움)이나 비겁(동업)의 도움이 필요합니다.',
    };
  }
  if (isWeak && jaeStrength === 'weak') {
    return {
      label: '신약재약(身弱財弱)',
      desc: '몸도 약하고 재물도 약합니다. 소규모로 꾸준히 모으는 것이 좋습니다. 인성으로 힘을 기른 뒤 재물을 취하는 전략이 필요합니다.',
    };
  }
  // 중화
  return {
    label: '중화(中和)',
    desc: '신강도 신약도 아닌 균형 상태입니다. 재물 운은 대운과 세운의 흐름에 따라 변합니다.',
  };
}

// ── 결과 타입 ──

export interface MoneyReading {
  // 1단계: 재성궁 분석
  jaeseongGung: {
    jaeseongElement: Element;
    primaryType: JaeseongType | null;   // 원국에 재성이 있으면 주된 유형
    pyeonjaeCount: number;
    jeongjaeCount: number;
    jaeseongStrength: JaeseongStrengthResult;
    monthJiElement: Element;
    dayJiElement: Element;
  };

  // 2단계: 금전 성향
  moneyStyle: {
    dayGanElement: Element;
    earningStyle: string;
    spendingStyle: string;
    strengthJaeseong: { label: string; desc: string };
    hasYeokma: boolean;
    hasGwimungwan: boolean;
    hasSiksangSaengjae: boolean;  // 식상생재 여부
  };

  // 3단계: 재물 시기
  timing: {
    jaeseongDaeun: { startAge: number; endAge: number; gan: string; ji: string; rating: string }[];
    pyeonjaeSeunyears: number[];
    jeongjaeSeunyears: number[];
  };
}

// ── 메인 분석 함수 ──

export function analyzeMoney(
  sajuResult: {
    pillars: { year: { gan: string; ji: string }; month: { gan: string; ji: string }; day: { gan: string; ji: string }; hour: { gan: string; ji: string } | null };
    tenGods: any;
    sinsal: { name: string; position: string }[];
    strength: { level: StrengthLevel; score: number };
    yongSin: { final: { primary: string } };
    daeun: { periods: any[] } | null;
    seun: any[];
  },
): MoneyReading {
  const dayGan = sajuResult.pillars.day.gan;
  const dayGanElement = STEM_ELEMENT[dayGan];
  const jaeElement = getJaeseongElement(dayGan);

  // 재성 세력
  const jaeStrength = analyzeJaeseongStrength(dayGan, sajuResult.pillars);

  // 십성에서 편재/정재 카운트
  const tenGods = sajuResult.tenGods;
  const allTenGods = [
    tenGods.yearGan, tenGods.monthGan, tenGods.hourGan,
    tenGods.yearJi, tenGods.monthJi, tenGods.dayJi, tenGods.hourJi,
  ].filter(Boolean);

  const pyeonjaeCount = allTenGods.filter((t: string) => t === '편재').length;
  const jeongjaeCount = allTenGods.filter((t: string) => t === '정재').length;

  let primaryType: JaeseongType | null = null;
  if (pyeonjaeCount > 0 || jeongjaeCount > 0) {
    primaryType = pyeonjaeCount >= jeongjaeCount ? '편재' : '정재';
  }

  // 신살
  const hasYeokma = sajuResult.sinsal.some(s => s.name === '역마살');
  const hasGwimungwan = sajuResult.sinsal.some(s => s.name === '귀문관살');

  // 식상생재 여부: 원국에 식신/상관이 있고 재성도 있는지
  const hasShiksang = allTenGods.some((t: string) => t === '식신' || t === '상관');
  const hasJaeseong = pyeonjaeCount > 0 || jeongjaeCount > 0;
  const hasSiksangSaengjae = hasShiksang && hasJaeseong;

  // 신강약 + 재성 조합
  const strengthJaeseong = getStrengthJaeseongInteraction(
    sajuResult.strength.level,
    jaeStrength.level,
  );

  // 대운에서 재성 오행이 오는 시기
  const jaeseongDaeun: MoneyReading['timing']['jaeseongDaeun'] = [];
  if (sajuResult.daeun) {
    for (const p of sajuResult.daeun.periods) {
      const ganEl = STEM_ELEMENT[p.gan];
      const jiEl = BRANCH_ELEMENT[p.ji];
      if (ganEl === jaeElement || jiEl === jaeElement) {
        jaeseongDaeun.push({
          startAge: p.startAge, endAge: p.endAge,
          gan: p.gan, ji: p.ji, rating: p.analysis.rating,
        });
      }
    }
  }

  // 세운에서 편재/정재 연도
  const dayInfo = STEM_INFO[dayGan];
  const pyeonjaeSeunyears: number[] = [];
  const jeongjaeSeunyears: number[] = [];

  for (const s of sajuResult.seun) {
    const ganEl = STEM_ELEMENT[s.gan];
    if (ganEl === jaeElement) {
      const ganInfo = STEM_INFO[s.gan];
      if (ganInfo.yin === dayInfo.yin) {
        pyeonjaeSeunyears.push(s.year);
      } else {
        jeongjaeSeunyears.push(s.year);
      }
    }
    const jiEl = BRANCH_ELEMENT[s.ji];
    if (jiEl === jaeElement) {
      // 지지는 본기 기준으로 편/정 판단
      const jijanggan = getJijanggan(s.ji);
      const jeonggi = jijanggan[jijanggan.length - 1];
      const jeongiInfo = STEM_INFO[jeonggi.stem];
      if (jeongiInfo && DESTROYS[dayInfo.element] === jeongiInfo.element) {
        if (jeongiInfo.yin === dayInfo.yin) {
          if (!pyeonjaeSeunyears.includes(s.year)) pyeonjaeSeunyears.push(s.year);
        } else {
          if (!jeongjaeSeunyears.includes(s.year)) jeongjaeSeunyears.push(s.year);
        }
      }
    }
  }

  return {
    jaeseongGung: {
      jaeseongElement: jaeElement,
      primaryType,
      pyeonjaeCount,
      jeongjaeCount,
      jaeseongStrength: jaeStrength,
      monthJiElement: BRANCH_ELEMENT[sajuResult.pillars.month.ji],
      dayJiElement: BRANCH_ELEMENT[sajuResult.pillars.day.ji],
    },
    moneyStyle: {
      dayGanElement,
      earningStyle: ELEMENT_MONEY_STYLE[dayGanElement].earning,
      spendingStyle: ELEMENT_MONEY_STYLE[dayGanElement].spending,
      strengthJaeseong: strengthJaeseong,
      hasYeokma,
      hasGwimungwan,
      hasSiksangSaengjae,
    },
    timing: {
      jaeseongDaeun,
      pyeonjaeSeunyears,
      jeongjaeSeunyears,
    },
  };
}
