import { getIljin } from './data/iljin_adapter';

export interface Pillar {
  gan: string;
  ji: string;
}

/**
 * 일주(日柱)를 산출한다.
 *
 * iljin.json에서 양력 날짜로 일진을 조회한다.
 * 이석영 기준 야자시/조자시 분리설 채택:
 * - 23:00~23:59 (야자시): 일주는 당일 유지
 * - 00:00~00:59 (조자시): 일주는 해당 날짜(익일) 그대로
 * → 결과적으로 일주는 항상 양력 날짜 기준.
 *
 * @param birthDate 양력 출생일시 (KST)
 * @returns Pillar { gan, ji }
 */
export function getDayPillar(birthDate: Date): Pillar {
  const y = birthDate.getFullYear();
  const m = String(birthDate.getMonth() + 1).padStart(2, '0');
  const d = String(birthDate.getDate()).padStart(2, '0');
  const dateKey = `${y}-${m}-${d}`;

  const iljin = getIljin(dateKey);
  if (!iljin) {
    throw new Error(`일진 데이터 없음: ${dateKey} (지원 범위: 1900-01-01 ~ 2049-12-31)`);
  }

  // 한자 간지에서 천간·지지 분리 (2글자: 첫째=간, 둘째=지)
  const gan = iljin.hanja[0];
  const ji = iljin.hanja[1];

  return { gan, ji };
}
