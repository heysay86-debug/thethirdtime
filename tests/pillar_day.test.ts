import { getDayPillar } from '@engine/pillar_day';

describe('pillar_day — 일주 산출', () => {
  const cases: [string, number, number, number, string, string][] = [
    // [설명, year, month(0-idx), day, 간, 지]
    ['1986-09-15 壬戌', 1986, 8, 15, '壬', '戌'],
    ['2024-02-29 癸亥 (윤년)', 2024, 1, 29, '癸', '亥'],
    ['1900-01-01 甲戌 (범위 시작)', 1900, 0, 1, '甲', '戌'],
    ['2049-12-31 庚辰 (범위 끝)', 2049, 11, 31, '庚', '辰'],
    ['2000-06-15 甲辰', 2000, 5, 15, '甲', '辰'],
  ];

  it.each(cases)('%s', (_, y, m, d, gan, ji) => {
    const result = getDayPillar(new Date(y, m, d, 12, 0));
    expect(result).toEqual({ gan, ji });
  });

  describe('자시 경계 — 이석영 기준 야자시/조자시 분리', () => {
    // 1986-09-15 = 壬戌, 1986-09-16 = 癸亥
    it('23:30 (야자시) → 당일 일주 유지 (壬戌)', () => {
      const result = getDayPillar(new Date(1986, 8, 15, 23, 30));
      expect(result).toEqual({ gan: '壬', ji: '戌' });
    });

    it('00:30 (조자시) → 해당 날짜 일주 (癸亥 = 9/16)', () => {
      const result = getDayPillar(new Date(1986, 8, 16, 0, 30));
      expect(result).toEqual({ gan: '癸', ji: '亥' });
    });
  });

  it('범위 밖 날짜는 에러를 던진다', () => {
    expect(() => getDayPillar(new Date(1899, 11, 31))).toThrow();
    expect(() => getDayPillar(new Date(2050, 0, 1))).toThrow();
  });
});
