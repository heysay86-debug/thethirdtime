import lookupData from '../../data/lunar_lookup.json';

const { solarToLunar, lunarToSolar } = lookupData as {
  solarToLunar: Record<string, { year: number; month: number; day: number; isLeap: boolean }>;
  lunarToSolar: Record<string, string>;
};

export interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeap: boolean;
}

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

function toSolarKey(year: number, month: number, day: number): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}`;
}

function toLunarKey(year: number, month: number, day: number, isLeap: boolean): string {
  return `${year}-${padTwo(month)}-${padTwo(day)}${isLeap ? '-L' : ''}`;
}

/**
 * 양력 → 음력 변환
 * @returns LunarDate 또는 범위 밖이면 null
 */
export function solarToLunarDate(year: number, month: number, day: number): LunarDate | null {
  const entry = solarToLunar[toSolarKey(year, month, day)];
  if (!entry) return null;
  return { ...entry };
}

/**
 * 음력 → 양력 변환
 * @returns { year, month, day } 또는 범위 밖이면 null
 */
export function lunarToSolarDate(
  year: number, month: number, day: number, isLeap = false
): { year: number; month: number; day: number } | null {
  const solarKey = lunarToSolar[toLunarKey(year, month, day, isLeap)];
  if (!solarKey) return null;
  const [y, m, d] = solarKey.split('-').map(Number);
  return { year: y, month: m, day: d };
}

/**
 * 특정 음력 연/월이 윤달인지 확인
 */
export function hasLeapMonth(lunarYear: number, lunarMonth: number): boolean {
  // 윤달 1일이 존재하면 해당 월에 윤달이 있음
  return toLunarKey(lunarYear, lunarMonth, 1, true) in lunarToSolar;
}
