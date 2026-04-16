import { getDayPillar } from './pillar_day';
import { getIljin } from './data/iljin_adapter';

const CHEONGAN = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'] as const;
const JIJI = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'] as const;

/** 오서둔 시건법: 일간 index → 자시 천간 index */
const OSEODUN: Record<number, number> = {
  0: 0,  // 甲 → 甲
  5: 0,  // 己 → 甲
  1: 2,  // 乙 → 丙
  6: 2,  // 庚 → 丙
  2: 4,  // 丙 → 戊
  7: 4,  // 辛 → 戊
  3: 6,  // 丁 → 庚
  8: 6,  // 壬 → 庚
  4: 8,  // 戊 → 壬
  9: 8,  // 癸 → 壬
};

/** 시각 → 시지 index (0=子 ~ 11=亥). 야자시(23~24)는 12로 별도 반환 */
function getHourJiIdx(hour: number): number {
  if (hour >= 23) return 12; // 야자시 표시용
  if (hour < 1) return 0;   // 조자시 = 子
  return Math.floor((hour + 1) / 2);
}

export interface Pillar {
  gan: string;
  ji: string;
}

export interface HourPillarResult {
  pillar: Pillar;
  known: boolean;
}

/**
 * 시주(時柱)를 산출한다.
 *
 * - 오서둔 시건법으로 시간(時干) 결정
 * - 야자시(23:00~23:59) 특례: 시지는 子, 시간은 익일 일간 기준
 *
 * @param birthDate 양력 출생일시 (KST)
 * @param timeKnown 출생 시각을 알고 있는지 여부
 * @returns HourPillarResult
 */
export function getHourPillar(birthDate: Date, timeKnown = true): HourPillarResult {
  if (!timeKnown) {
    return { pillar: { gan: '', ji: '' }, known: false };
  }

  const hour = birthDate.getHours();
  const jiIdx = getHourJiIdx(hour);

  if (jiIdx === 12) {
    // 야자시: 시지=子, 시간은 익일 일간 기준
    const nextDay = new Date(birthDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDayPillar = getDayPillar(nextDay);
    const nextDayGanIdx = CHEONGAN.indexOf(nextDayPillar.gan as typeof CHEONGAN[number]);
    const baseGanIdx = OSEODUN[nextDayGanIdx];

    return {
      pillar: { gan: CHEONGAN[baseGanIdx], ji: '子' },
      known: true,
    };
  }

  // 일반 시간대 + 조자시
  const dayPillar = getDayPillar(birthDate);
  const dayGanIdx = CHEONGAN.indexOf(dayPillar.gan as typeof CHEONGAN[number]);
  const baseGanIdx = OSEODUN[dayGanIdx];
  const hourGanIdx = (baseGanIdx + jiIdx) % 10;

  return {
    pillar: { gan: CHEONGAN[hourGanIdx], ji: JIJI[jiIdx] },
    known: true,
  };
}
