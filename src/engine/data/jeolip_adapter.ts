import jeolipData from '../../../data/jeolip.json';

const jeolipMap = jeolipData as Record<string, JeolgiEntry[]>;

export interface JeolgiEntry {
  name: string;    // 절기명 (e.g. "입춘")
  month: number;   // 양력 월
  day: number;     // 양력 일
  time: string;    // "HH:MM" (KST)
}

/** 12절 — 월주 판정에 사용 */
export const TWELVE_JEOL = [
  '소한', '입춘', '경칩', '청명', '입하', '망종',
  '소서', '입추', '백로', '한로', '입동', '대설',
] as const;

/**
 * 연도의 24절기 목록을 조회한다.
 * @returns 절기 배열 (소한→동지 순). 범위 밖이면 null.
 */
export function getJeolgiByYear(year: number): JeolgiEntry[] | null {
  return jeolipMap[String(year)] ?? null;
}

/**
 * 특정 연도에서 이름으로 절기를 찾는다.
 */
export function findJeolgi(year: number, name: string): JeolgiEntry | null {
  const list = getJeolgiByYear(year);
  if (!list) return null;
  return list.find(e => e.name === name) ?? null;
}

/**
 * 절기 항목을 Date 객체(KST)로 변환한다.
 */
export function jeolgiToDate(year: number, entry: JeolgiEntry): Date {
  const [h, m] = entry.time.split(':').map(Number);
  return new Date(year, entry.month - 1, entry.day, h, m);
}
