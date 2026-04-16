import { solarToLunarDate, lunarToSolarDate, hasLeapMonth } from '@engine/calendar';

describe('calendar — 양력→음력 변환', () => {
  // 설날 (음력 1월 1일) — 매년 공개 확인 가능한 날짜
  const seollalCases: [string, number, number, number, number, number, number][] = [
    // [설명, 양력Y, 양력M, 양력D, 음력Y, 음력M, 음력D]
    ['2023 설날', 2023, 1, 22, 2023, 1, 1],
    ['2024 설날', 2024, 2, 10, 2024, 1, 1],
    ['2025 설날', 2025, 1, 29, 2025, 1, 1],
    ['1988 설날', 1988, 2, 18, 1988, 1, 1],
  ];

  it.each(seollalCases)('%s: 양력 %d-%d-%d → 음력 %d-%d-%d', (_, sy, sm, sd, ly, lm, ld) => {
    const result = solarToLunarDate(sy, sm, sd);
    expect(result).not.toBeNull();
    expect(result!.year).toBe(ly);
    expect(result!.month).toBe(lm);
    expect(result!.day).toBe(ld);
    expect(result!.isLeap).toBe(false);
  });

  // 추석 (음력 8월 15일)
  it('2024 추석: 양력 2024-09-17 → 음력 8월 15일', () => {
    const result = solarToLunarDate(2024, 9, 17);
    expect(result).toEqual({ year: 2024, month: 8, day: 15, isLeap: false });
  });

  // 연초 경계: 양력 1월인데 음력은 전년도
  it('연초 경계: 양력 1900-01-01 → 음력 1899년 12월 1일', () => {
    const result = solarToLunarDate(1900, 1, 1);
    expect(result).toEqual({ year: 1899, month: 12, day: 1, isLeap: false });
  });

  it('연초 경계: 양력 1988-02-17 → 음력 1987년 12월 30일', () => {
    const result = solarToLunarDate(1988, 2, 17);
    expect(result).toEqual({ year: 1987, month: 12, day: 30, isLeap: false });
  });

  // 윤달
  it('윤달: 양력 2020-05-23 → 음력 2020년 윤4월 1일', () => {
    const result = solarToLunarDate(2020, 5, 23);
    expect(result).toEqual({ year: 2020, month: 4, day: 1, isLeap: true });
  });

  // 범위 밖
  it('범위 밖 날짜는 null 반환', () => {
    expect(solarToLunarDate(1899, 12, 31)).toBeNull();
    expect(solarToLunarDate(2050, 1, 1)).toBeNull();
  });
});

describe('calendar — 음력→양력 변환', () => {
  it('음력 2024-01-01 → 양력 2024-02-10', () => {
    const result = lunarToSolarDate(2024, 1, 1);
    expect(result).toEqual({ year: 2024, month: 2, day: 10 });
  });

  it('음력 2024-08-15 → 양력 2024-09-17', () => {
    const result = lunarToSolarDate(2024, 8, 15);
    expect(result).toEqual({ year: 2024, month: 9, day: 17 });
  });

  it('윤달 음력→양력: 2020년 윤4월 1일 → 양력 2020-05-23', () => {
    const result = lunarToSolarDate(2020, 4, 1, true);
    expect(result).toEqual({ year: 2020, month: 5, day: 23 });
  });

  it('윤달이 아닌 같은 월과 구분된다: 2020년 4월 1일(평달)', () => {
    const result = lunarToSolarDate(2020, 4, 1, false);
    expect(result).not.toBeNull();
    // 평달 4월 1일은 윤4월 1일과 다른 양력 날짜여야 함
    expect(result).not.toEqual({ year: 2020, month: 5, day: 23 });
  });

  it('범위 밖은 null 반환', () => {
    expect(lunarToSolarDate(1899, 1, 1)).toBeNull();
  });
});

describe('calendar — 윤달 확인', () => {
  it('2020년 4월은 윤달이 있다', () => {
    expect(hasLeapMonth(2020, 4)).toBe(true);
  });

  it('2020년 3월은 윤달이 없다', () => {
    expect(hasLeapMonth(2020, 3)).toBe(false);
  });

  it('1900년 8월은 윤달이 있다', () => {
    expect(hasLeapMonth(1900, 8)).toBe(true);
  });
});
