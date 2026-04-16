import { getJijanggan, getMainStem, calculateAllJijanggan } from '@engine/jijanggan';

describe('jijanggan — 12지지 전체 지장간 출력', () => {
  // 12지지 전체 정기(본기) 검증
  const mainStemCases: [string, string][] = [
    ['子', '癸'], ['丑', '己'], ['寅', '甲'], ['卯', '乙'],
    ['辰', '戊'], ['巳', '丙'], ['午', '丁'], ['未', '己'],
    ['申', '庚'], ['酉', '辛'], ['戌', '戊'], ['亥', '壬'],
  ];

  it.each(mainStemCases)('%s의 정기 = %s', (branch, expected) => {
    expect(getMainStem(branch)).toBe(expected);
  });

  // 세부 지장간 검증: 여기·중기·정기 구조
  describe('寅(인) 지장간', () => {
    it('戊(여기) → 丙(중기) → 甲(정기)', () => {
      const entries = getJijanggan('寅');
      expect(entries).toHaveLength(3);
      expect(entries[0]).toEqual({ stem: '戊', role: '여기', days: 7, strength: 23 });
      expect(entries[1]).toEqual({ stem: '丙', role: '중기', days: 7, strength: 23 });
      expect(entries[2]).toEqual({ stem: '甲', role: '정기', days: 16, strength: 54 });
    });
  });

  describe('子(자) 지장간 — 2개만 있는 케이스', () => {
    it('壬(여기) → 癸(정기)', () => {
      const entries = getJijanggan('子');
      expect(entries).toHaveLength(2);
      expect(entries[0]).toEqual({ stem: '壬', role: '여기', days: 10, strength: 33 });
      expect(entries[1]).toEqual({ stem: '癸', role: '정기', days: 20, strength: 67 });
    });
  });

  describe('午(오) 지장간 — 세력 균등 케이스', () => {
    it('丙(여기) → 己(중기) → 丁(정기)', () => {
      const entries = getJijanggan('午');
      expect(entries).toHaveLength(3);
      expect(entries[0].strength).toBe(33);
      expect(entries[1].strength).toBe(33);
      expect(entries[2].strength).toBe(34);
    });
  });

  // 세력 합계 100% 검증
  describe('세력 합계 검증', () => {
    const allBranches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

    it.each(allBranches)('%s 세력 합계 = 100%%', (branch) => {
      const entries = getJijanggan(branch);
      const total = entries.reduce((sum, e) => sum + e.strength, 0);
      expect(total).toBe(100);
    });
  });
});

describe('jijanggan — 사주 4기둥 지장간', () => {
  // 1986-09-15: 丙寅 丁酉 壬戌 (시주 없음)
  it('1986-09-15 지장간 산출', () => {
    const result = calculateAllJijanggan({
      year: { ji: '寅' },
      month: { ji: '酉' },
      day: { ji: '戌' },
      hour: null,
    });

    // 寅: 戊·丙·甲
    expect(result.year.map(e => e.stem)).toEqual(['戊', '丙', '甲']);
    // 酉: 庚·辛
    expect(result.month.map(e => e.stem)).toEqual(['庚', '辛']);
    // 戌: 辛·丁·戊
    expect(result.day.map(e => e.stem)).toEqual(['辛', '丁', '戊']);
    // 시주 없음
    expect(result.hour).toBeNull();
  });

  // 1983-08-19 04:00: 癸亥 庚申 己卯 丙寅
  it('1983-08-19 지장간 산출', () => {
    const result = calculateAllJijanggan({
      year: { ji: '亥' },
      month: { ji: '申' },
      day: { ji: '卯' },
      hour: { ji: '寅' },
    });

    // 亥: 戊·甲·壬
    expect(result.year.map(e => e.stem)).toEqual(['戊', '甲', '壬']);
    // 申: 己·壬·庚
    expect(result.month.map(e => e.stem)).toEqual(['己', '壬', '庚']);
    // 卯: 甲·乙
    expect(result.day.map(e => e.stem)).toEqual(['甲', '乙']);
    // 寅: 戊·丙·甲
    expect(result.hour!.map(e => e.stem)).toEqual(['戊', '丙', '甲']);
  });
});
