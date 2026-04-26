/**
 * 연애운 분석 엔진
 *
 * 3단계 구조:
 *   1. 배우자 궁(宮) 해석 — 일지 기반, 생지/왕지/고지
 *   2. 연애 성향 — 일간 + 배우자별 + 신살 + 십이운성
 *   3. 맞는 인연의 초상화 — 용신 + 배우자별 오행 + 원국 조건
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

// ── 생지/왕지/고지 ──

type BranchType = '생지' | '왕지' | '고지';

const BRANCH_TYPE: Record<string, BranchType> = {
  '寅': '생지', '申': '생지', '巳': '생지', '亥': '생지',
  '子': '왕지', '午': '왕지', '卯': '왕지', '酉': '왕지',
  '辰': '고지', '戌': '고지', '丑': '고지', '未': '고지',
};

// 고지의 저장 오행
const GOJI_STORED: Record<string, { element: Element; stem: string; desc: string }> = {
  '辰': { element: '水', stem: '癸', desc: '물의 에너지가 응축되어 있는 창고' },
  '戌': { element: '火', stem: '丁', desc: '불의 에너지가 응축되어 있는 창고' },
  '丑': { element: '金', stem: '辛', desc: '쇠의 에너지가 응축되어 있는 창고' },
  '未': { element: '木', stem: '乙', desc: '나무의 에너지가 응축되어 있는 창고' },
};

// ── 배우자별 ──

function getSpouseStar(dayGan: string, gender: 'M' | 'F'): { type: '재성' | '관성'; element: Element } {
  const myElement = STEM_ELEMENT[dayGan];
  const DESTROYS: Record<Element, Element> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };
  const DESTROYED_BY: Record<Element, Element> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };

  if (gender === 'M') {
    return { type: '재성', element: DESTROYS[myElement] };
  } else {
    return { type: '관성', element: DESTROYED_BY[myElement] };
  }
}

// ── 오행 성격 키워드 ──

const ELEMENT_PERSONALITY: Record<Element, { keywords: string[]; loveStyle: string }> = {
  '木': {
    keywords: ['성장지향', '계획적', '추진력', '자기주장'],
    loveStyle: '함께 성장하는 관계를 원하며, 상대에게도 자기 발전을 기대합니다.',
  },
  '火': {
    keywords: ['열정적', '표현력', '화끈함', '감정적'],
    loveStyle: '감정 표현이 풍부하고 로맨틱한 관계를 추구합니다. 관심과 반응에 민감합니다.',
  },
  '土': {
    keywords: ['안정적', '포용력', '현실적', '묵묵함'],
    loveStyle: '편안하고 안정적인 관계를 원합니다. 한번 시작하면 오래 갑니다.',
  },
  '金': {
    keywords: ['결단력', '원칙적', '냉철', '깔끔함'],
    loveStyle: '기준이 명확하고 조건을 따지는 편입니다. 하지만 한번 마음을 주면 의리가 있습니다.',
  },
  '水': {
    keywords: ['지적', '유연함', '감수성', '자유로움'],
    loveStyle: '자유로운 관계를 선호하며, 지적 교감을 중요시합니다. 속을 잘 보여주지 않습니다.',
  },
};

// ── 정편 유형 ──

const JEONGPYEON_TYPE = {
  jeong: {
    label: '안정형',
    desc: '예측 가능하고 꾸준한 관계를 추구합니다. 결혼 지향적이고 전통적 가치관의 인연.',
  },
  pyeon: {
    label: '자극형',
    desc: '예측 불가능하고 강렬한 관계에 끌립니다. 비전통적이고 자유로운 인연.',
  },
};

// ── 생지/왕지/고지별 인연 특성 ──

const BRANCH_TYPE_LOVE: Record<BranchType, { label: string; meetingStyle: string; relationStyle: string }> = {
  '생지': {
    label: '성장형 인연',
    meetingStyle: '여행, 이직, 환경 변화 속에서 인연을 만날 확률이 높습니다. 움직이는 곳에 인연이 있습니다.',
    relationStyle: '함께 성장하는 관계입니다. 처음에는 서로 미완성이지만, 시간이 갈수록 맞춰갑니다.',
  },
  '왕지': {
    label: '강렬한 인연',
    meetingStyle: '첫 만남부터 강한 끌림이 있습니다. 도화 기운이 있어 이성에게 매력적입니다.',
    relationStyle: '감정이 뚜렷한 관계입니다. 좋을 때 아주 좋고, 부딪힐 때도 강렬합니다.',
  },
  '고지': {
    label: '숨겨진 인연',
    meetingStyle: '처음에는 별 느낌이 없다가 알수록 깊어지는 만남입니다. 시간이 필요합니다.',
    relationStyle: '겉으로는 무난하지만 안에 깊은 에너지가 있는 관계입니다. 고(庫)가 열리면 깊어집니다.',
  },
};

// ── 일지별 연애 성향 ──

const DAYJI_LOVE: Record<string, string> = {
  '子': '감성적이고 내면이 깊습니다. 비밀스러운 연애를 즐기는 경향이 있습니다.',
  '丑': '느리게 시작하지만 한번 맺으면 끈질기게 이어갑니다. 현실적인 조건을 중시합니다.',
  '寅': '적극적으로 다가가는 편입니다. 먼저 연락하고, 먼저 만남을 주도합니다.',
  '卯': '감수성이 풍부하고 로맨틱합니다. 분위기에 약하고, 예쁜 것에 끌립니다.',
  '辰': '이상이 높습니다. 쉽게 만족하지 못하지만, 맞는 사람을 만나면 헌신적입니다.',
  '巳': '열정적이지만 변덕이 있습니다. 관심이 식으면 빠르게 떠날 수 있습니다.',
  '午': '화끈한 연애를 좋아합니다. 전개가 빠르고, 감정 표현이 직접적입니다.',
  '未': '정이 많고 헌신적입니다. 상대를 위해 희생하는 것을 마다하지 않습니다.',
  '申': '현실적으로 연애합니다. 감정보다 조건과 미래를 함께 봅니다.',
  '酉': '외모와 분위기를 중시합니다. 예민하고 까다롭지만, 본인도 매력적입니다.',
  '戌': '의리 있고 보수적입니다. 한번 사귀면 쉽게 헤어지지 않으려 합니다.',
  '亥': '자유로운 연애를 추구합니다. 구속을 싫어하고, 이상주의적 사랑을 꿈꿉니다.',
};

// ── 메인 분석 함수 ──

export interface LoveReading {
  // 1단계: 배우자 궁
  spouseHouse: {
    dayJi: string;
    branchType: BranchType;
    branchTypeLabel: string;
    meetingStyle: string;
    relationStyle: string;
    dayJiLove: string;
    goji?: { element: Element; stem: string; desc: string }; // 고지인 경우만
  };

  // 2단계: 연애 성향
  loveStyle: {
    dayGanElement: Element;
    dayGanLoveStyle: string;
    spouseStarType: '재성' | '관성';
    spouseStarElement: Element;
    jeongOrPyeon: 'jeong' | 'pyeon';
    jeongPyeonLabel: string;
    jeongPyeonDesc: string;
    hasDohwa: boolean;
    hasHongyeom: boolean;
    hasWonjin: boolean;
    twelveStageDay: string;
  };

  // 3단계: 맞는 인연의 초상화
  idealPartner: {
    element: Element;
    keywords: string[];
    personalityDesc: string;
    yongsinElement: Element;
    yongsinDesc: string;
    idealSajuFeatures: string[];
  };

  // 시기
  timing: {
    spouseStarDaeun: { startAge: number; endAge: number; gan: string; ji: string; rating: string }[];
    dohwaYears: number[];
  };
}

export function analyzeLove(
  sajuResult: {
    pillars: { year: { gan: string; ji: string }; month: { gan: string; ji: string }; day: { gan: string; ji: string }; hour: { gan: string; ji: string } | null };
    tenGods: any;
    sinsal: { name: string; position: string }[];
    twelveStages: { day: string };
    yongSin: { final: { primary: string } };
    daeun: { periods: any[] } | null;
    seun: any[];
  },
  gender: 'M' | 'F',
): LoveReading {
  const dayGan = sajuResult.pillars.day.gan;
  const dayJi = sajuResult.pillars.day.ji;
  const dayGanElement = STEM_ELEMENT[dayGan];
  const branchType = BRANCH_TYPE[dayJi];
  const spouseStar = getSpouseStar(dayGan, gender);

  // 정/편 판단: 원국에 정재/정관이 더 많으면 정, 편재/편관이 더 많으면 편
  const tenGods = sajuResult.tenGods;
  const allTenGods = [tenGods.yearGan, tenGods.monthGan, tenGods.hourGan, tenGods.yearJi, tenGods.monthJi, tenGods.dayJi, tenGods.hourJi].filter(Boolean);

  let jeongCount = 0;
  let pyeonCount = 0;
  if (gender === 'M') {
    jeongCount = allTenGods.filter(t => t === '정재').length;
    pyeonCount = allTenGods.filter(t => t === '편재').length;
  } else {
    jeongCount = allTenGods.filter(t => t === '정관').length;
    pyeonCount = allTenGods.filter(t => t === '편관').length;
  }
  const jeongOrPyeon = jeongCount >= pyeonCount ? 'jeong' : 'pyeon';

  // 신살
  const hasDohwa = sajuResult.sinsal.some(s => s.name === '도화살');
  const hasHongyeom = sajuResult.sinsal.some(s => s.name === '홍염살');
  const hasWonjin = sajuResult.sinsal.some(s => s.name === '원진살');

  // 용신
  const yongsinElement = sajuResult.yongSin.final.primary as Element;

  // 용신 설명
  const YONGSIN_LOVE_DESC: Record<Element, string> = {
    '木': '나를 성장시켜주고 새로운 가능성을 열어주는 사람이 좋은 인연입니다.',
    '火': '나를 밝혀주고, 표현하게 해주고, 에너지를 불어넣어주는 사람이 좋은 인연입니다.',
    '土': '나를 안정시켜주고, 편안한 쉼터가 되어주는 사람이 좋은 인연입니다.',
    '金': '나를 다듬어주고, 방향을 잡아주고, 결단을 도와주는 사람이 좋은 인연입니다.',
    '水': '나를 지혜롭게 해주고, 유연하게 해주고, 깊이를 더해주는 사람이 좋은 인연입니다.',
  };

  // 맞는 인연의 사주 특징
  const idealFeatures: string[] = [];
  idealFeatures.push(`일간이 ${spouseStar.element} 오행이거나, 원국에 ${spouseStar.element}이 발달한 사람`);
  idealFeatures.push(`용신이 ${yongsinElement}인 당신에게 ${yongsinElement} 오행을 가진 사람이 이롭습니다`);

  if (branchType === '고지') {
    const stored = GOJI_STORED[dayJi];
    if (stored) {
      idealFeatures.push(`당신의 배우자궁(${dayJi})을 충으로 열어줄 수 있는 지지를 가진 사람`);
    }
  }
  if (branchType === '왕지') {
    idealFeatures.push('도화 기운에 끌리므로 외모나 분위기가 매력적인 사람');
  }
  if (branchType === '생지') {
    idealFeatures.push('함께 성장할 수 있는 비전을 가진 사람, 역마 기운이 맞는 사람');
  }

  // 대운에서 배우자별 시기
  const spouseStarDaeun: LoveReading['timing']['spouseStarDaeun'] = [];
  if (sajuResult.daeun) {
    for (const p of sajuResult.daeun.periods) {
      const ganEl = STEM_ELEMENT[p.gan];
      const jiEl = BRANCH_ELEMENT[p.ji];
      if (ganEl === spouseStar.element || jiEl === spouseStar.element) {
        spouseStarDaeun.push({
          startAge: p.startAge, endAge: p.endAge,
          gan: p.gan, ji: p.ji, rating: p.analysis.rating,
        });
      }
    }
  }

  // 도화 세운 (子午卯酉가 오는 해)
  const DOHWA_BRANCHES = new Set(['子', '午', '卯', '酉']);
  const dohwaYears = sajuResult.seun
    .filter((s: any) => DOHWA_BRANCHES.has(s.ji))
    .map((s: any) => s.year);

  return {
    spouseHouse: {
      dayJi,
      branchType,
      branchTypeLabel: BRANCH_TYPE_LOVE[branchType].label,
      meetingStyle: BRANCH_TYPE_LOVE[branchType].meetingStyle,
      relationStyle: BRANCH_TYPE_LOVE[branchType].relationStyle,
      dayJiLove: DAYJI_LOVE[dayJi] || '',
      goji: branchType === '고지' ? GOJI_STORED[dayJi] : undefined,
    },
    loveStyle: {
      dayGanElement,
      dayGanLoveStyle: ELEMENT_PERSONALITY[dayGanElement].loveStyle,
      spouseStarType: spouseStar.type,
      spouseStarElement: spouseStar.element,
      jeongOrPyeon,
      jeongPyeonLabel: JEONGPYEON_TYPE[jeongOrPyeon].label,
      jeongPyeonDesc: JEONGPYEON_TYPE[jeongOrPyeon].desc,
      hasDohwa,
      hasHongyeom,
      hasWonjin,
      twelveStageDay: sajuResult.twelveStages.day,
    },
    idealPartner: {
      element: spouseStar.element,
      keywords: ELEMENT_PERSONALITY[spouseStar.element].keywords,
      personalityDesc: ELEMENT_PERSONALITY[spouseStar.element].loveStyle,
      yongsinElement,
      yongsinDesc: YONGSIN_LOVE_DESC[yongsinElement],
      idealSajuFeatures: idealFeatures,
    },
    timing: {
      spouseStarDaeun,
      dohwaYears,
    },
  };
}
