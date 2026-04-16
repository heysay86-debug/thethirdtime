import { analyzeDayMasterStrength } from '@engine/day_master_strength';

describe('day_master_strength — 신강/신약 판단', () => {
  // 1986-09-15 01:17: 丙寅 丁酉 壬戌 庚子
  // 壬丁합 → 丁 합거, 酉戌해 + 酉子파 → 월령 약화
  // 70점대 신강
  it('壬戌 유월 (시주 庚子) → 신강 (70점대)', () => {
    const r = analyzeDayMasterStrength('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: { gan: '庚', ji: '子' },
    });
    expect(r.wolryeong).toBe('득령');
    expect(r.level).toBe('신강');
    expect(r.score).toBeGreaterThanOrEqual(65);
    expect(r.score).toBeLessThan(80);
    // 천간합 검출
    expect(r.cheonganHaps).toHaveLength(1);
    expect(r.cheonganHaps[0].stem1).toBe('丁');
    expect(r.cheonganHaps[0].stem2).toBe('壬');
    // 월지 손상 검출
    expect(r.monthDamage.length).toBeGreaterThan(0);
  });

  // 1986-09-15 시각미상: 丙寅 丁酉 壬戌
  it('壬戌 유월 (시주 없음) → 중화', () => {
    const r = analyzeDayMasterStrength('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    });
    expect(r.level).toBe('중화');
    expect(r.score).toBeGreaterThanOrEqual(40);
    expect(r.score).toBeLessThan(65);
  });

  // 1983-08-19: 癸亥 庚申 己卯 丙寅
  it('己卯 신월 → 신약', () => {
    const r = analyzeDayMasterStrength('己', {
      year: { gan: '癸', ji: '亥' },
      month: { gan: '庚', ji: '申' },
      day: { gan: '己', ji: '卯' },
      hour: { gan: '丙', ji: '寅' },
    });
    expect(r.wolryeong).toBe('실령');
    expect(r.level).toBe('신약');
    expect(r.score).toBeLessThan(40);
  });

  // 1987-04-18: 丁卯 甲辰 丁酉 甲辰
  it('丁酉 진월, 인성 강 → 신강~중화', () => {
    const r = analyzeDayMasterStrength('丁', {
      year: { gan: '丁', ji: '卯' },
      month: { gan: '甲', ji: '辰' },
      day: { gan: '丁', ji: '酉' },
      hour: { gan: '甲', ji: '辰' },
    });
    expect(r.score).toBeGreaterThanOrEqual(55);
    expect(r.score).toBeLessThan(80);
  });

  // 극강: 비겁+인성 가득
  it('극강 케이스', () => {
    const r = analyzeDayMasterStrength('甲', {
      year: { gan: '甲', ji: '寅' },
      month: { gan: '壬', ji: '寅' },
      day: { gan: '甲', ji: '子' },
      hour: { gan: '壬', ji: '寅' },
    });
    expect(r.level).toBe('극강');
    expect(r.score).toBeGreaterThanOrEqual(80);
  });

  // 극약: 관살+재성 가득
  it('극약 케이스', () => {
    const r = analyzeDayMasterStrength('甲', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '戊', ji: '申' },
    });
    expect(r.level).toBe('극약');
    expect(r.score).toBeLessThan(20);
  });
});

describe('day_master_strength — 천간합·지지 형충파해 검출', () => {
  it('壬丁합 검출', () => {
    const r = analyzeDayMasterStrength('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    });
    expect(r.cheonganHaps).toHaveLength(1);
    expect(r.cheonganHaps[0].hwaElement).toBe('木');
  });

  it('천간합 없는 사주', () => {
    const r = analyzeDayMasterStrength('甲', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '戊', ji: '申' },
    });
    expect(r.cheonganHaps).toHaveLength(0);
  });

  it('酉戌해 검출', () => {
    const r = analyzeDayMasterStrength('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    });
    expect(r.monthDamage.some(d => d.type === '해')).toBe(true);
  });
});
