/**
 * 지장간(地藏干) — 지지 안에 숨어있는 천간
 * 각 지지에는 여기(餘氣), 중기(中氣), 정기(正氣)가 있다.
 * 세력 배분은 전통 명리학 기준 (이석영 사주첩경 참조)
 */

export interface JijangganEntry {
  stem: string;       // 천간 (한자)
  role: '여기' | '중기' | '정기';
  days: number;       // 세력을 가지는 일수
  strength: number;   // 세력 비율 (%)
}

/**
 * 12지지별 지장간 테이블
 * 배열 순서: 여기 → 중기 → 정기 (시간순)
 */
export const JIJANGGAN_TABLE: Record<string, JijangganEntry[]> = {
  '子': [
    { stem: '壬', role: '여기', days: 10, strength: 33 },
    { stem: '癸', role: '정기', days: 20, strength: 67 },
  ],
  '丑': [
    { stem: '癸', role: '여기', days: 9, strength: 29 },
    { stem: '辛', role: '중기', days: 3, strength: 10 },
    { stem: '己', role: '정기', days: 19, strength: 61 },
  ],
  '寅': [
    { stem: '戊', role: '여기', days: 7, strength: 23 },
    { stem: '丙', role: '중기', days: 7, strength: 23 },
    { stem: '甲', role: '정기', days: 16, strength: 54 },
  ],
  '卯': [
    { stem: '甲', role: '여기', days: 10, strength: 33 },
    { stem: '乙', role: '정기', days: 20, strength: 67 },
  ],
  '辰': [
    { stem: '乙', role: '여기', days: 9, strength: 30 },
    { stem: '癸', role: '중기', days: 3, strength: 10 },
    { stem: '戊', role: '정기', days: 18, strength: 60 },
  ],
  '巳': [
    { stem: '戊', role: '여기', days: 7, strength: 23 },
    { stem: '庚', role: '중기', days: 9, strength: 29 },
    { stem: '丙', role: '정기', days: 15, strength: 48 },
  ],
  '午': [
    { stem: '丙', role: '여기', days: 10, strength: 33 },
    { stem: '己', role: '중기', days: 10, strength: 33 },
    { stem: '丁', role: '정기', days: 10, strength: 34 },
  ],
  '未': [
    { stem: '丁', role: '여기', days: 9, strength: 29 },
    { stem: '乙', role: '중기', days: 3, strength: 10 },
    { stem: '己', role: '정기', days: 19, strength: 61 },
  ],
  '申': [
    { stem: '己', role: '여기', days: 7, strength: 23 },
    { stem: '壬', role: '중기', days: 7, strength: 23 },
    { stem: '庚', role: '정기', days: 17, strength: 54 },
  ],
  '酉': [
    { stem: '庚', role: '여기', days: 10, strength: 33 },
    { stem: '辛', role: '정기', days: 20, strength: 67 },
  ],
  '戌': [
    { stem: '辛', role: '여기', days: 9, strength: 29 },
    { stem: '丁', role: '중기', days: 3, strength: 10 },
    { stem: '戊', role: '정기', days: 19, strength: 61 },
  ],
  '亥': [
    { stem: '戊', role: '여기', days: 7, strength: 23 },
    { stem: '甲', role: '중기', days: 9, strength: 29 },
    { stem: '壬', role: '정기', days: 15, strength: 48 },
  ],
};

/**
 * 지지의 지장간을 조회한다.
 * @returns 여기→중기→정기 순서의 배열
 */
export function getJijanggan(branch: string): JijangganEntry[] {
  const entries = JIJANGGAN_TABLE[branch];
  if (!entries) {
    throw new Error(`잘못된 지지: ${branch}`);
  }
  return entries;
}

/**
 * 지지의 정기(본기) 천간을 반환한다.
 */
export function getMainStem(branch: string): string {
  const entries = getJijanggan(branch);
  return entries[entries.length - 1].stem;
}

/**
 * 사주 4기둥의 지장간을 모두 산출한다.
 */
export function calculateAllJijanggan(pillars: {
  year: { ji: string };
  month: { ji: string };
  day: { ji: string };
  hour: { ji: string } | null;
}): {
  year: JijangganEntry[];
  month: JijangganEntry[];
  day: JijangganEntry[];
  hour: JijangganEntry[] | null;
} {
  return {
    year: getJijanggan(pillars.year.ji),
    month: getJijanggan(pillars.month.ji),
    day: getJijanggan(pillars.day.ji),
    hour: pillars.hour ? getJijanggan(pillars.hour.ji) : null,
  };
}
