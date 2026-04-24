/**
 * 정통 시초법(서죽점법) 엔진
 *
 * 대연지수 50에서 1을 빼 49개로 시작.
 * 삼변(三變)을 거쳐 1효를 산출하고, 이를 6번 반복하여 괘를 완성한다.
 *
 * 각 효의 값:
 *   6 = 노음(老陰) — 음효, 변효 (━━✕━━)
 *   7 = 소양(少陽) — 양효, 불변 (━━━━━)
 *   8 = 소음(少陰) — 음효, 불변 (━━ ━━)
 *   9 = 노양(老陽) — 양효, 변효 (━━━○━)
 */

export type YaoValue = 6 | 7 | 8 | 9;

export interface YaoResult {
  value: YaoValue;
  isYang: boolean;     // 양효 여부 (7, 9)
  isChanging: boolean; // 변효 여부 (6, 9)
  label: string;       // 노음/소양/소음/노양
}

export interface SichoStep {
  leftCount: number;
  rightCount: number;
  fingerStick: number;   // 괘일 (손가락에 끼운 수)
  leftRemainder: number; // 왼쪽 4로 나눈 나머지
  rightRemainder: number;// 오른쪽 4로 나눈 나머지
  removed: number;       // 이번 변에서 빼낸 수
}

export interface SambyeonResult {
  steps: [SichoStep, SichoStep, SichoStep];
  remaining: number;  // 최종 남은 시초 수
  yao: YaoResult;
}

/**
 * 1변 수행
 * @param total 현재 시초 총 수
 * @returns SichoStep + 남은 시초 수
 */
function oneByeon(total: number): { step: SichoStep; remaining: number } {
  // 분이: 랜덤으로 좌우 나눔
  const leftCount = Math.floor(Math.random() * (total - 2)) + 1;
  const rightCount = total - leftCount;

  // 괘일: 오른쪽에서 1개를 손가락에
  const fingerStick = 1;
  const rightAfter = rightCount - fingerStick;

  // 게사: 왼쪽을 4개씩 셈
  let leftRemainder = leftCount % 4;
  if (leftRemainder === 0) leftRemainder = 4;

  // 오른쪽을 4개씩 셈
  let rightRemainder = rightAfter % 4;
  if (rightRemainder === 0) rightRemainder = 4;

  const removed = fingerStick + leftRemainder + rightRemainder;

  return {
    step: { leftCount, rightCount, fingerStick, leftRemainder, rightRemainder, removed },
    remaining: total - removed,
  };
}

/**
 * 삼변을 수행하여 1효를 산출
 */
export function performSambyeon(): SambyeonResult {
  const total = 49; // 대연지수 50 - 태극 1

  const r1 = oneByeon(total);
  const r2 = oneByeon(r1.remaining);
  const r3 = oneByeon(r2.remaining);

  const remaining = r3.remaining;
  const yaoValue = (remaining / 4) as YaoValue;

  const yao: YaoResult = {
    value: yaoValue,
    isYang: yaoValue === 7 || yaoValue === 9,
    isChanging: yaoValue === 6 || yaoValue === 9,
    label: yaoValue === 6 ? '노음' : yaoValue === 7 ? '소양' : yaoValue === 8 ? '소음' : '노양',
  };

  return {
    steps: [r1.step, r2.step, r3.step],
    remaining,
    yao,
  };
}

/**
 * 6효를 모두 수행하여 본괘 + 지괘를 산출
 */
export function castHexagram(): {
  yaos: YaoResult[];
  originalGua: number[]; // 본괘 (0=음, 1=양) 아래→위
  changedGua: number[];  // 지괘 (변효 뒤집힘)
  hasChange: boolean;
} {
  const yaos: YaoResult[] = [];
  for (let i = 0; i < 6; i++) {
    const result = performSambyeon();
    yaos.push(result.yao);
  }

  const originalGua = yaos.map(y => y.isYang ? 1 : 0);
  const changedGua = yaos.map(y => {
    if (y.isChanging) return y.isYang ? 0 : 1; // 변효: 뒤집힘
    return y.isYang ? 1 : 0;
  });

  return {
    yaos,
    originalGua,
    changedGua,
    hasChange: yaos.some(y => y.isChanging),
  };
}

// ─── 64괘 이름 ────────────────────────────────────────────────

const TRIGRAM_NAMES = ['곤', '진', '감', '태', '간', '리', '손', '건'] as const;
// 소성괘 인덱스: 하위 3효를 2진수로 변환 (초효가 LSB)

export function trigramIndex(bits: number[]): number {
  return bits[0] + bits[1] * 2 + bits[2] * 4;
}

// 64괘 배열 (하괘 index × 8 + 상괘 index)
const GUA_64: Record<string, { name: string; korean: string }> = {
  '0,0': { name: '坤爲地', korean: '곤위지' },
  '0,1': { name: '地雷復', korean: '지뢰복' },
  '0,2': { name: '地水師', korean: '지수사' },
  '0,3': { name: '地澤臨', korean: '지택림' },
  '0,4': { name: '地山謙', korean: '지산겸' },
  '0,5': { name: '地火明夷', korean: '지화명이' },
  '0,6': { name: '地風升', korean: '지풍승' },
  '0,7': { name: '地天泰', korean: '지천태' },
  '1,0': { name: '雷地豫', korean: '뇌지예' },
  '1,1': { name: '震爲雷', korean: '진위뢰' },
  '1,2': { name: '雷水解', korean: '뇌수해' },
  '1,3': { name: '雷澤歸妹', korean: '뇌택귀매' },
  '1,4': { name: '雷山小過', korean: '뇌산소과' },
  '1,5': { name: '雷火豊', korean: '뇌화풍' },
  '1,6': { name: '雷風恒', korean: '뇌풍항' },
  '1,7': { name: '雷天大壯', korean: '뇌천대장' },
  '2,0': { name: '水地比', korean: '수지비' },
  '2,1': { name: '水雷屯', korean: '수뢰둔' },
  '2,2': { name: '坎爲水', korean: '감위수' },
  '2,3': { name: '水澤節', korean: '수택절' },
  '2,4': { name: '水山蹇', korean: '수산건' },
  '2,5': { name: '水火旣濟', korean: '수화기제' },
  '2,6': { name: '水風井', korean: '수풍정' },
  '2,7': { name: '水天需', korean: '수천수' },
  '3,0': { name: '澤地萃', korean: '택지췌' },
  '3,1': { name: '澤雷隨', korean: '택뢰수' },
  '3,2': { name: '澤水困', korean: '택수곤' },
  '3,3': { name: '兌爲澤', korean: '태위택' },
  '3,4': { name: '澤山咸', korean: '택산함' },
  '3,5': { name: '澤火革', korean: '택화혁' },
  '3,6': { name: '澤風大過', korean: '택풍대과' },
  '3,7': { name: '澤天夬', korean: '택천쾌' },
  '4,0': { name: '山地剝', korean: '산지박' },
  '4,1': { name: '山雷頤', korean: '산뢰이' },
  '4,2': { name: '山水蒙', korean: '산수몽' },
  '4,3': { name: '山澤損', korean: '산택손' },
  '4,4': { name: '艮爲山', korean: '간위산' },
  '4,5': { name: '山火賁', korean: '산화비' },
  '4,6': { name: '山風蠱', korean: '산풍고' },
  '4,7': { name: '山天大畜', korean: '산천대축' },
  '5,0': { name: '火地晋', korean: '화지진' },
  '5,1': { name: '火雷噬嗑', korean: '화뢰서합' },
  '5,2': { name: '火水未濟', korean: '화수미제' },
  '5,3': { name: '火澤睽', korean: '화택규' },
  '5,4': { name: '火山旅', korean: '화산여' },
  '5,5': { name: '離爲火', korean: '이위화' },
  '5,6': { name: '火風鼎', korean: '화풍정' },
  '5,7': { name: '火天大有', korean: '화천대유' },
  '6,0': { name: '風地觀', korean: '풍지관' },
  '6,1': { name: '風雷益', korean: '풍뢰익' },
  '6,2': { name: '風水渙', korean: '풍수환' },
  '6,3': { name: '風澤中孚', korean: '풍택중부' },
  '6,4': { name: '風山漸', korean: '풍산점' },
  '6,5': { name: '風火家人', korean: '풍화가인' },
  '6,6': { name: '巽爲風', korean: '손위풍' },
  '6,7': { name: '風天小畜', korean: '풍천소축' },
  '7,0': { name: '天地否', korean: '천지비' },
  '7,1': { name: '天雷无妄', korean: '천뢰무망' },
  '7,2': { name: '天水訟', korean: '천수송' },
  '7,3': { name: '天澤履', korean: '천택리' },
  '7,4': { name: '天山遯', korean: '천산둔' },
  '7,5': { name: '天火同人', korean: '천화동인' },
  '7,6': { name: '天風姤', korean: '천풍구' },
  '7,7': { name: '乾爲天', korean: '건위천' },
};

export function getGuaName(gua: number[]): { name: string; korean: string } {
  const lower = trigramIndex(gua.slice(0, 3));
  const upper = trigramIndex(gua.slice(3, 6));
  return GUA_64[`${lower},${upper}`] || { name: '?', korean: '?' };
}

export function getLowerTrigramName(gua: number[]): string {
  return TRIGRAM_NAMES[trigramIndex(gua.slice(0, 3))];
}

export function getUpperTrigramName(gua: number[]): string {
  return TRIGRAM_NAMES[trigramIndex(gua.slice(3, 6))];
}
