/**
 * 대운(大運) · 세운(歲運) 계산 + 상세 분석
 *
 * 대운: 월주에서 순행/역행하여 10년 주기 간지 산출
 * 세운: 해당 연도 간지 (서기 4년=갑자 기준)
 * 분석: 각 대운/세운의 간지와 원국(사주)의 상호작용 평가
 */

import { findJeolgi, jeolgiToDate } from './data/jeolip_adapter';
import { getTenGod, TenGodName } from './ten_gods';
import { getMainStem } from './jijanggan';
import { detectCheonganHap, detectJijiRelations, CheonganHapInfo, JijiRelation } from './relations';
import { getSibiiSinsal, SibiiSinsalEntry } from './sinsal';

// ── 상수 ──

const CHEONGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

type Element = '木' | '火' | '土' | '金' | '水';

const STEM_ELEMENT: Record<string, Element> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const IS_YANG_GAN: Record<string, boolean> = {
  '甲': true, '乙': false, '丙': true, '丁': false, '戊': true,
  '己': false, '庚': true, '辛': false, '壬': true, '癸': false,
};

const JEOL_NAMES = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;

// ── 타입 ──

export interface PeriodAnalysis {
  /** 대운 천간의 일간 기준 십성 */
  ganTenGod: TenGodName;
  /** 대운 지지 정기의 일간 기준 십성 */
  jiTenGod: TenGodName;
  /** 용신 오행과의 관계 */
  yongSinRelation: '희신' | '기신' | '중립';
  /** 원국과의 천간합 */
  cheonganHaps: CheonganHapInfo[];
  /** 원국과의 지지 형충파해 */
  jijiRelations: JijiRelation[];
  /** 종합 점수 (0~100, 50=중립) */
  score: number;
  /** 평가 */
  rating: '대길' | '길' | '평' | '흉' | '대흉';
}

export interface DaeunPeriod {
  index: number;
  startAge: number;
  endAge: number;
  gan: string;
  ji: string;
  analysis: PeriodAnalysis;
  sinsal: SibiiSinsalEntry[];
}

export interface SeUnYear {
  year: number;
  gan: string;
  ji: string;
  analysis: PeriodAnalysis;
  sinsal: SibiiSinsalEntry[];
}

export interface DaeunResult {
  direction: '순행' | '역행';
  startAge: number;
  periods: DaeunPeriod[];
}

type Pillars = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
};

// ── 대운 ──

export function calculateDaeun(
  yearGan: string,
  monthGan: string,
  monthJi: string,
  gender: 'M' | 'F',
  birthDate: Date,
  pillars: Pillars,
  yongSinElement: Element,
  maxAge = 100,
): DaeunResult {
  const isYangGan = IS_YANG_GAN[yearGan];
  const isForward = (gender === 'M' && isYangGan) || (gender === 'F' && !isYangGan);
  const direction: '순행' | '역행' = isForward ? '순행' : '역행';
  const startAge = calculateStartAge(birthDate, isForward);
  const dayStem = pillars.day.gan;

  const monthGanIdx = CHEONGAN.indexOf(monthGan as typeof CHEONGAN[number]);
  const monthJiIdx = JIJI.indexOf(monthJi as typeof JIJI[number]);

  const periods: DaeunPeriod[] = [];
  let currentAge = startAge;
  let idx = 1;

  while (currentAge < maxAge) {
    const step = isForward ? idx : -idx;
    const ganIdx = ((monthGanIdx + step) % 10 + 10) % 10;
    const jiIdx = ((monthJiIdx + step) % 12 + 12) % 12;
    const gan = CHEONGAN[ganIdx];
    const ji = JIJI[jiIdx];

    const analysis = analyzePeriod(gan, ji, dayStem, pillars, yongSinElement);
    const sinsal = getSibiiSinsal(pillars.year.ji, ji);

    periods.push({ index: idx, startAge: currentAge, endAge: currentAge + 9, gan, ji, analysis, sinsal });
    currentAge += 10;
    idx++;
  }

  return { direction, startAge, periods };
}

// ── 세운 ──

export function calculateSeUn(
  startYear: number,
  endYear: number,
  pillars: Pillars,
  yongSinElement: Element,
): SeUnYear[] {
  const dayStem = pillars.day.gan;
  const result: SeUnYear[] = [];

  for (let year = startYear; year <= endYear; year++) {
    const ganIdx = ((year - 4) % 10 + 10) % 10;
    const jiIdx = ((year - 4) % 12 + 12) % 12;
    const gan = CHEONGAN[ganIdx];
    const ji = JIJI[jiIdx];

    const analysis = analyzePeriod(gan, ji, dayStem, pillars, yongSinElement);
    const sinsal = getSibiiSinsal(pillars.year.ji, ji);
    result.push({ year, gan, ji, analysis, sinsal });
  }

  return result;
}

// ── 대운/세운 공통 분석 ──

function analyzePeriod(
  periodGan: string,
  periodJi: string,
  dayStem: string,
  pillars: Pillars,
  yongSinElement: Element,
): PeriodAnalysis {
  // 1. 십성 관계
  const ganTenGod = getTenGod(dayStem, periodGan);
  const jiMainStem = getMainStem(periodJi);
  const jiTenGod = jiMainStem === dayStem ? '비견' as TenGodName : getTenGod(dayStem, jiMainStem);

  // 2. 용신 관계
  const ganElement = STEM_ELEMENT[periodGan];
  const jiElement = STEM_ELEMENT[getMainStem(periodJi)];
  const yongSinRelation = evaluateYongSinRelation(ganElement, jiElement, yongSinElement, dayStem);

  // 3. 원국과의 천간합 (대운/세운 간을 가상 기둥으로 추가)
  const virtualPillars = {
    year: pillars.year,
    month: pillars.month,
    day: pillars.day,
    hour: { gan: periodGan, ji: periodJi }, // 대운/세운을 가상 시주 위치에
  };
  // 시주가 있으면 대운과의 합을 별도 검출
  const cheonganHaps = detectPeriodCheonganHaps(periodGan, pillars);
  const jijiRelations = detectPeriodJijiRelations(periodJi, pillars);

  // 4. 종합 점수
  const score = calculatePeriodScore(ganTenGod, jiTenGod, yongSinRelation, cheonganHaps, jijiRelations, dayStem);
  const rating = scoreToRating(score);

  return { ganTenGod, jiTenGod, yongSinRelation, cheonganHaps, jijiRelations, score, rating };
}

function evaluateYongSinRelation(
  ganElement: Element, jiElement: Element, yongSinElement: Element, dayStem: string,
): '희신' | '기신' | '중립' {
  const dayElement = STEM_ELEMENT[dayStem];

  // 오행 생극 관계
  const GENERATES: Record<Element, Element> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
  const DESTROYED_BY: Record<Element, Element> = { '木': '金', '火': '水', '土': '木', '金': '火', '水': '土' };

  // 대운 오행이 용신과 같거나 용신을 생하면 희신
  if (ganElement === yongSinElement || jiElement === yongSinElement) return '희신';
  if (GENERATES[ganElement] === yongSinElement || GENERATES[jiElement] === yongSinElement) return '희신';

  // 대운 오행이 용신을 극하면 기신
  if (DESTROYED_BY[yongSinElement] === ganElement || DESTROYED_BY[yongSinElement] === jiElement) return '기신';

  return '중립';
}

/** 대운/세운 천간과 원국 4천간의 합 검출 */
function detectPeriodCheonganHaps(periodGan: string, pillars: Pillars): CheonganHapInfo[] {
  const HAP_PAIRS: [string, string, string][] = [
    ['甲', '己', '土'], ['乙', '庚', '金'], ['丙', '辛', '水'], ['丁', '壬', '木'], ['戊', '癸', '火'],
  ];

  const origGans = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
    { stem: pillars.day.gan, pos: '일간' },
  ];
  if (pillars.hour) origGans.push({ stem: pillars.hour.gan, pos: '시간' });

  const results: CheonganHapInfo[] = [];
  for (const g of origGans) {
    const pair = HAP_PAIRS.find(([a, b]) =>
      (periodGan === a && g.stem === b) || (periodGan === b && g.stem === a)
    );
    if (pair) {
      results.push({
        stem1: periodGan, stem2: g.stem,
        position1: '대운', position2: g.pos,
        hwaElement: pair[2],
      });
    }
  }
  return results;
}

/** 대운/세운 지지와 원국 4지지의 충형해파 검출 */
function detectPeriodJijiRelations(periodJi: string, pillars: Pillars): JijiRelation[] {
  const CHUNG: [string, string][] = [
    ['子', '午'], ['丑', '未'], ['寅', '申'], ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
  ];
  const HYEONG: [string, string][] = [
    ['寅', '巳'], ['巳', '申'], ['寅', '申'], ['丑', '戌'], ['戌', '未'], ['丑', '未'],
    ['子', '卯'], ['卯', '子'],
  ];
  const HAE: [string, string][] = [
    ['子', '未'], ['丑', '午'], ['寅', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
  ];

  const origJis = [
    { ji: pillars.year.ji, pos: '연지' },
    { ji: pillars.month.ji, pos: '월지' },
    { ji: pillars.day.ji, pos: '일지' },
  ];
  if (pillars.hour) origJis.push({ ji: pillars.hour.ji, pos: '시지' });

  const results: JijiRelation[] = [];
  const match = (pairs: [string, string][], a: string, b: string) =>
    pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));

  for (const j of origJis) {
    if (match(CHUNG, periodJi, j.ji)) {
      results.push({ type: '충', ji1: periodJi, ji2: j.ji, position1: '대운', position2: j.pos });
    }
    if (match(HYEONG, periodJi, j.ji)) {
      results.push({ type: '형', ji1: periodJi, ji2: j.ji, position1: '대운', position2: j.pos });
    }
    if (match(HAE, periodJi, j.ji)) {
      results.push({ type: '해', ji1: periodJi, ji2: j.ji, position1: '대운', position2: j.pos });
    }
  }
  return results;
}

function calculatePeriodScore(
  ganTenGod: TenGodName, jiTenGod: TenGodName,
  yongSinRelation: '희신' | '기신' | '중립',
  haps: CheonganHapInfo[], relations: JijiRelation[],
  dayStem: string,
): number {
  let score = 50;

  // 용신 관계 (가장 중요, ±20)
  if (yongSinRelation === '희신') score += 20;
  else if (yongSinRelation === '기신') score -= 20;

  // 천간 십성 (±10)
  score += tenGodScore(ganTenGod) * 10;

  // 지지 십성 (±8)
  score += tenGodScore(jiTenGod) * 8;

  // 천간합 (합은 변화, 일반적으로 ±5)
  score += haps.length * 3;

  // 지지 충 (-10), 형 (-5), 해 (-3)
  for (const r of relations) {
    if (r.type === '충') score -= 10;
    else if (r.type === '형') score -= 5;
    else if (r.type === '해') score -= 3;
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/** 십성이 일간에 유리한지 평가 (-1 ~ +1) */
function tenGodScore(tg: TenGodName): number {
  // 일반적으로 정관·정인·식신이 길, 편관·겁재·상관이 흉
  // 하지만 이는 신강/신약에 따라 다름 — 여기서는 중립적 평가
  const scores: Record<TenGodName, number> = {
    '비견': 0, '겁재': -0.3,
    '식신': 0.5, '상관': -0.2,
    '편재': 0.3, '정재': 0.5,
    '편관': -0.3, '정관': 0.5,
    '편인': 0.2, '정인': 0.5,
  };
  return scores[tg];
}

function scoreToRating(score: number): '대길' | '길' | '평' | '흉' | '대흉' {
  if (score >= 75) return '대길';
  if (score >= 60) return '길';
  if (score >= 40) return '평';
  if (score >= 25) return '흉';
  return '대흉';
}

// ── 대운 시작 나이 ──

function calculateStartAge(birthDate: Date, isForward: boolean): number {
  const solarYear = birthDate.getFullYear();
  const jeolDates: Date[] = [];

  for (const year of [solarYear - 1, solarYear, solarYear + 1]) {
    for (const jeolName of JEOL_NAMES) {
      const entry = findJeolgi(year, jeolName);
      if (entry) jeolDates.push(jeolgiToDate(year, entry));
    }
  }
  jeolDates.sort((a, b) => a.getTime() - b.getTime());

  let targetDate: Date | null = null;
  if (isForward) {
    for (const d of jeolDates) {
      if (d.getTime() > birthDate.getTime()) { targetDate = d; break; }
    }
  } else {
    for (let i = jeolDates.length - 1; i >= 0; i--) {
      if (jeolDates[i].getTime() <= birthDate.getTime()) { targetDate = jeolDates[i]; break; }
    }
  }

  if (!targetDate) return 3;
  const dayDiff = Math.abs(targetDate.getTime() - birthDate.getTime()) / (1000 * 60 * 60 * 24);
  return Math.max(1, Math.min(10, Math.round(dayDiff / 3)));
}
