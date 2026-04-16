/**
 * 십성(十星) 계산
 * 일간(日干)을 기준으로 다른 천간·지지와의 오행 관계를 10가지로 분류
 */

/** 천간 → 오행·음양 매핑 */
const STEM_INFO: Record<string, { element: string; yin: boolean }> = {
  '甲': { element: '木', yin: false },
  '乙': { element: '木', yin: true },
  '丙': { element: '火', yin: false },
  '丁': { element: '火', yin: true },
  '戊': { element: '土', yin: false },
  '己': { element: '土', yin: true },
  '庚': { element: '金', yin: false },
  '辛': { element: '金', yin: true },
  '壬': { element: '水', yin: false },
  '癸': { element: '水', yin: true },
};

/** 오행 상생: A가 B를 생한다 */
const GENERATES: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

/** 오행 상극: A가 B를 극한다 */
const DESTROYS: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

/** 지지 → 본기(정기) 천간 매핑 */
const BRANCH_MAIN_STEM: Record<string, string> = {
  '子': '癸', '丑': '己', '寅': '甲', '卯': '乙',
  '辰': '戊', '巳': '丙', '午': '丁', '未': '己',
  '申': '庚', '酉': '辛', '戌': '戊', '亥': '壬',
};

export type TenGodName =
  | '비견' | '겁재'
  | '식신' | '상관'
  | '편재' | '정재'
  | '편관' | '정관'
  | '편인' | '정인';

/**
 * 일간과 대상 천간의 십성 관계를 판단한다.
 */
export function getTenGod(dayStem: string, targetStem: string): TenGodName {
  const day = STEM_INFO[dayStem];
  const target = STEM_INFO[targetStem];
  if (!day || !target) {
    throw new Error(`잘못된 천간: ${dayStem}, ${targetStem}`);
  }

  const sameYin = day.yin === target.yin;

  // 같은 오행 → 비견/겁재
  if (day.element === target.element) {
    return sameYin ? '비견' : '겁재';
  }
  // 내가 생하는 오행 → 식신/상관
  if (GENERATES[day.element] === target.element) {
    return sameYin ? '식신' : '상관';
  }
  // 내가 극하는 오행 → 편재/정재
  if (DESTROYS[day.element] === target.element) {
    return sameYin ? '편재' : '정재';
  }
  // 나를 극하는 오행 → 편관/정관
  if (DESTROYS[target.element] === day.element) {
    return sameYin ? '편관' : '정관';
  }
  // 나를 생하는 오행 → 편인/정인
  if (GENERATES[target.element] === day.element) {
    return sameYin ? '편인' : '정인';
  }

  throw new Error(`십성 계산 오류: ${dayStem}(${day.element}) - ${targetStem}(${target.element})`);
}

export interface TenGodsResult {
  /** 연간 십성 */
  yearGan: TenGodName;
  /** 월간 십성 */
  monthGan: TenGodName;
  /** 일간은 자기 자신 (비견) */
  dayGan: '비견';
  /** 시간 십성 (시각 미상이면 null) */
  hourGan: TenGodName | null;
  /** 연지 십성 (본기 기준) */
  yearJi: TenGodName;
  /** 월지 십성 (본기 기준) */
  monthJi: TenGodName;
  /** 일지 십성 (본기 기준) */
  dayJi: TenGodName;
  /** 시지 십성 (본기 기준, 시각 미상이면 null) */
  hourJi: TenGodName | null;
}

/**
 * 사주 4기둥의 십성을 산출한다.
 * 지지는 본기(정기) 천간 기준.
 */
export function calculateTenGods(
  dayStem: string,
  pillars: {
    year: { gan: string; ji: string };
    month: { gan: string; ji: string };
    day: { gan: string; ji: string };
    hour: { gan: string; ji: string } | null;
  },
): TenGodsResult {
  return {
    yearGan: getTenGod(dayStem, pillars.year.gan),
    monthGan: getTenGod(dayStem, pillars.month.gan),
    dayGan: '비견',
    hourGan: pillars.hour ? getTenGod(dayStem, pillars.hour.gan) : null,
    yearJi: getTenGod(dayStem, BRANCH_MAIN_STEM[pillars.year.ji]),
    monthJi: getTenGod(dayStem, BRANCH_MAIN_STEM[pillars.month.ji]),
    dayJi: getTenGod(dayStem, BRANCH_MAIN_STEM[pillars.day.ji]),
    hourJi: pillars.hour ? getTenGod(dayStem, BRANCH_MAIN_STEM[pillars.hour.ji]) : null,
  };
}
