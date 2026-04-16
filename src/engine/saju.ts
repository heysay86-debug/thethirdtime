import { getYearPillar } from './pillar_year';
import { getMonthPillar } from './pillar_month';
import { getDayPillar } from './pillar_day';
import { getHourPillar } from './pillar_hour';
import { getCityOffset } from './data/longitude_table';
import { lunarToSolarDate } from './calendar';

export interface Pillar {
  gan: string;
  ji: string;
}

export interface SajuInput {
  /** 생년월일 "YYYY-MM-DD" */
  birthDate: string;
  /** 출생 시각 "HH:MM" (24h). 미상이면 생략 */
  birthTime?: string;
  /** 달력 유형 */
  calendar: 'solar' | 'lunar';
  /** 음력 윤달 여부 (calendar="lunar" 시 필수) */
  isLeapMonth?: boolean;
  /** 출생 도시 (진태양시 보정용, 미입력 시 서울) */
  birthCity?: string;
  /** 성별 (대운 순행/역행 결정용) */
  gender?: 'M' | 'F';
}

export interface SajuResult {
  yearPillar: Pillar;
  monthPillar: Pillar;
  dayPillar: Pillar;
  hourPillar: Pillar | null;
  birth: {
    solar: string;
    time: string | null;
    adjustedTime: string | null;
    city: string;
    offsetMinutes: number;
  };
}

/**
 * 사주 4기둥을 산출한다.
 *
 * 1. 입력 정규화 (음력→양력, 진태양시 보정)
 * 2. 연주·월주·일주·시주 순서로 계산
 */
export function calculateSaju(input: SajuInput): SajuResult {
  // 1. 양력 날짜 확정
  const [y, m, d] = input.birthDate.split('-').map(Number);
  let solarYear: number, solarMonth: number, solarDay: number;

  if (input.calendar === 'lunar') {
    const solar = lunarToSolarDate(y, m, d, input.isLeapMonth ?? false);
    if (!solar) {
      throw new Error(`음력→양력 변환 실패: ${input.birthDate} (지원 범위: 1900~2049)`);
    }
    solarYear = solar.year;
    solarMonth = solar.month;
    solarDay = solar.day;
  } else {
    solarYear = y;
    solarMonth = m;
    solarDay = d;
  }

  const solarDateStr = `${solarYear}-${String(solarMonth).padStart(2, '0')}-${String(solarDay).padStart(2, '0')}`;

  // 2. 진태양시 보정
  const city = input.birthCity?.trim() || '서울';
  const offsetMinutes = getCityOffset(input.birthCity);

  const timeKnown = !!input.birthTime;
  let birthDate: Date;
  let adjustedTimeStr: string | null = null;

  if (timeKnown) {
    const [hh, mm] = input.birthTime!.split(':').map(Number);
    // KST 벽시계 시각으로 Date 생성 후 진태양시 보정
    birthDate = new Date(solarYear, solarMonth - 1, solarDay, hh, mm);
    birthDate = new Date(birthDate.getTime() + offsetMinutes * 60 * 1000);
    adjustedTimeStr = `${String(birthDate.getHours()).padStart(2, '0')}:${String(birthDate.getMinutes()).padStart(2, '0')}`;
  } else {
    // 시각 미상: 정오로 설정 (연주·월주·일주만 의미)
    birthDate = new Date(solarYear, solarMonth - 1, solarDay, 12, 0);
  }

  // 3. 4기둥 산출
  const yearPillar = getYearPillar(birthDate);
  const monthPillar = getMonthPillar(birthDate);
  const dayPillar = getDayPillar(birthDate);
  const hourResult = getHourPillar(birthDate, timeKnown);

  return {
    yearPillar,
    monthPillar,
    dayPillar,
    hourPillar: hourResult.known ? hourResult.pillar : null,
    birth: {
      solar: solarDateStr,
      time: input.birthTime ?? null,
      adjustedTime: adjustedTimeStr,
      city,
      offsetMinutes,
    },
  };
}
