import { getYearPillar } from '@engine/pillar_year';

describe('pillar_year — 연주 산출', () => {
  // 기본 연주 검증
  // 1900년 = 경자(庚子)년, 서기4년 갑자 기준: (1900-4)%10=6→庚, (1900-4)%12=8→申...
  // 실제: 1900년 = 경자년. (1900-4)%10=6→庚 ✓, (1900-4)%12=8→申? 아닌데...
  // 검증: 서기4년 갑자 기준이면 1900-4=1896, 1896%12=0→子 ✓

  it('1900년 = 경자(庚子)년', () => {
    // 입춘(2/4 14:52) 이후
    const result = getYearPillar(new Date(1900, 2, 1));
    expect(result).toEqual({ gan: '庚', ji: '子' });
  });

  it('2024년 = 갑진(甲辰)년', () => {
    // 입춘(2/4 17:27) 이후
    const result = getYearPillar(new Date(2024, 2, 1));
    expect(result).toEqual({ gan: '甲', ji: '辰' });
  });

  it('2000년 = 경진(庚辰)년', () => {
    const result = getYearPillar(new Date(2000, 5, 15));
    expect(result).toEqual({ gan: '庚', ji: '辰' });
  });

  // 입춘 경계 케이스 — 2024년 입춘: 2/4 17:27
  describe('입춘 경계 (2024년 입춘: 2/4 17:27)', () => {
    it('입춘 전날(2/3) → 2023년 계묘(癸卯)년', () => {
      const result = getYearPillar(new Date(2024, 1, 3, 12, 0));
      expect(result).toEqual({ gan: '癸', ji: '卯' });
    });

    it('입춘 당일 시각 이전(2/4 17:00) → 2023년 계묘(癸卯)년', () => {
      const result = getYearPillar(new Date(2024, 1, 4, 17, 0));
      expect(result).toEqual({ gan: '癸', ji: '卯' });
    });

    it('입춘 당일 시각 이후(2/4 18:00) → 2024년 갑진(甲辰)년', () => {
      const result = getYearPillar(new Date(2024, 1, 4, 18, 0));
      expect(result).toEqual({ gan: '甲', ji: '辰' });
    });

    it('입춘 다음날(2/5) → 2024년 갑진(甲辰)년', () => {
      const result = getYearPillar(new Date(2024, 1, 5, 10, 0));
      expect(result).toEqual({ gan: '甲', ji: '辰' });
    });
  });

  // 2025년 입춘: 2/3 23:10 — 야간 입춘 경계
  describe('야간 입춘 경계 (2025년 입춘: 2/3 23:10)', () => {
    it('2/3 23:00 → 2024년 갑진(甲辰)년', () => {
      const result = getYearPillar(new Date(2025, 1, 3, 23, 0));
      expect(result).toEqual({ gan: '甲', ji: '辰' });
    });

    it('2/3 23:30 → 2025년 을사(乙巳)년', () => {
      const result = getYearPillar(new Date(2025, 1, 3, 23, 30));
      expect(result).toEqual({ gan: '乙', ji: '巳' });
    });
  });

  // 1월 출생 — 항상 전년도 연주
  it('1월 1일 출생 → 전년도 연주', () => {
    // 2024-01-01 → 2023년 계묘(癸卯)
    const result = getYearPillar(new Date(2024, 0, 1));
    expect(result).toEqual({ gan: '癸', ji: '卯' });
  });
});
