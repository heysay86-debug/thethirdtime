import iljinData from '../../../data/iljin.json';

const iljinMap = iljinData as Record<string, string>;

export interface Iljin {
  korean: string;  // e.g. "갑술"
  hanja: string;   // e.g. "甲戌"
  raw: string;     // e.g. "갑술(甲戌)"
}

/**
 * 양력 날짜(YYYY-MM-DD)로 일진을 조회한다.
 * @returns Iljin 객체. 범위 밖이면 null.
 */
export function getIljin(date: string): Iljin | null {
  const raw = iljinMap[date];
  if (!raw) return null;

  const parenIdx = raw.indexOf('(');
  const korean = raw.slice(0, parenIdx);
  const hanja = raw.slice(parenIdx + 1, -1);

  return { korean, hanja, raw };
}

/**
 * Date 객체로 일진을 조회한다.
 */
export function getIljinByDate(date: Date): Iljin | null {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return getIljin(`${y}-${m}-${d}`);
}
