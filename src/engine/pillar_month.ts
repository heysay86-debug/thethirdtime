import { findJeolgi, jeolgiToDate, JeolgiEntry } from './data/jeolip_adapter';
import { getYearPillar } from './pillar_year';

const CHEONGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 12절 → 월지 매핑 (입춘=寅부터) */
const JEOL_TO_MONTH: { jeol: string; ji: string }[] = [
  { jeol: '입춘', ji: '寅' },
  { jeol: '경칩', ji: '卯' },
  { jeol: '청명', ji: '辰' },
  { jeol: '입하', ji: '巳' },
  { jeol: '망종', ji: '午' },
  { jeol: '소서', ji: '未' },
  { jeol: '입추', ji: '申' },
  { jeol: '백로', ji: '酉' },
  { jeol: '한로', ji: '戌' },
  { jeol: '입동', ji: '亥' },
  { jeol: '대설', ji: '子' },
  { jeol: '소한', ji: '丑' },
];

/** 오호둔 월건법: 연간 index → 정월(寅月) 천간 index */
const OHODUN: Record<number, number> = {
  0: 2,  // 甲 → 丙
  5: 2,  // 己 → 丙
  1: 4,  // 乙 → 戊
  6: 4,  // 庚 → 戊
  2: 6,  // 丙 → 庚
  7: 6,  // 辛 → 庚
  3: 8,  // 丁 → 壬
  8: 8,  // 壬 → 壬
  4: 0,  // 戊 → 甲
  9: 0,  // 癸 → 甲
};

export interface Pillar {
  gan: string;
  ji: string;
}

/**
 * 월주(月柱)를 산출한다.
 *
 * - 12절 절입 시각 기준으로 월지 결정
 * - 오호둔 월건법으로 월간 결정
 *
 * @param birthDate 양력 출생일시 (KST)
 * @returns Pillar { gan, ji }
 */
export function getMonthPillar(birthDate: Date): Pillar {
  const solarYear = birthDate.getFullYear();

  // 현재 연도와 전년도의 12절 절입 시각을 수집하여 해당 구간을 찾는다
  const monthJi = findMonthJi(birthDate, solarYear);
  const yearPillar = getYearPillar(birthDate);
  const yearGanIdx = CHEONGAN.indexOf(yearPillar.gan as typeof CHEONGAN[number]);

  // 월간 계산: 오호둔으로 정월 천간을 구한 뒤, 寅(정월)부터의 거리만큼 순행
  const baseGanIdx = OHODUN[yearGanIdx];
  const jiIdx = JIJI.indexOf(monthJi as typeof JIJI[number]);
  // 寅=2, 월지에서 寅까지의 거리
  const offset = ((jiIdx - 2) % 12 + 12) % 12;
  const monthGanIdx = (baseGanIdx + offset) % 10;

  return {
    gan: CHEONGAN[monthGanIdx],
    ji: monthJi,
  };
}

/**
 * 출생일시가 속하는 월지를 결정한다.
 */
function findMonthJi(birthDate: Date, solarYear: number): string {
  // 12절을 시간순으로 정렬하여 birthDate가 속하는 구간을 찾는다
  // 소한(1월)은 전년도 대설 이후~당해 입춘 이전 구간이므로 전년도 소한도 고려
  const boundaries: { date: Date; ji: string }[] = [];

  // 전년도 소한 (12월 = 丑)
  const prevSohan = findJeolgi(solarYear - 1, '소한');
  if (prevSohan) {
    boundaries.push({ date: jeolgiToDate(solarYear - 1, prevSohan), ji: '丑' });
  }

  // 당해 12절
  for (const { jeol, ji } of JEOL_TO_MONTH) {
    const entry = findJeolgi(solarYear, jeol);
    if (entry) {
      boundaries.push({ date: jeolgiToDate(solarYear, entry), ji });
    }
  }

  // 익년 입춘 (상한 경계용)
  const nextIpchun = findJeolgi(solarYear + 1, '입춘');
  if (nextIpchun) {
    boundaries.push({ date: jeolgiToDate(solarYear + 1, nextIpchun), ji: '寅' });
  }

  // 시간순 정렬
  boundaries.sort((a, b) => a.date.getTime() - b.date.getTime());

  // birthDate가 속하는 구간의 월지 반환
  for (let i = boundaries.length - 1; i >= 0; i--) {
    if (birthDate >= boundaries[i].date) {
      return boundaries[i].ji;
    }
  }

  // 전년도 대설 이전 → 전년도 소한 구간 처리 필요
  // 이론상 여기까지 오면 전전년도 대설~전년도 소한 사이
  // 1900년 1월 초 등 극단 케이스
  const prevPrevDaseol = findJeolgi(solarYear - 2, '대설');
  if (prevPrevDaseol) {
    return '子'; // 대설 이후 = 子月
  }

  throw new Error(`월주 산출 실패: ${birthDate.toISOString()}`);
}
