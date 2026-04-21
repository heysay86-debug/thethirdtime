/**
 * 경량 윤달 조회 (클라이언트용)
 *
 * lunar_lookup.json (4.5MB)을 import하지 않고
 * 윤달 여부만 확인할 수 있는 경량 테이블.
 * 607 bytes.
 */

import leapData from './leap-months.json';

const LEAP_MAP: Record<number, number> = leapData as any;

/**
 * 특정 음력 연/월이 윤달인지 확인 (클라이언트 안전)
 */
export function hasLeapMonthLite(lunarYear: number, lunarMonth: number): boolean {
  return LEAP_MAP[lunarYear] === lunarMonth;
}
