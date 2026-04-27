import { analyzeMoney, getJaeseongElement, analyzeJaeseongStrength } from '@engine/money_reading';
import { analyzeSaju } from '@engine/analyze';

describe('money_reading — 금전운 분석', () => {
  // ── 편재/정재 판별 ──

  it('甲일간 → 재성 오행 土', () => {
    expect(getJaeseongElement('甲')).toBe('土');
  });

  it('壬일간 → 재성 오행 火', () => {
    expect(getJaeseongElement('壬')).toBe('火');
  });

  it('丙일간 → 재성 오행 金', () => {
    expect(getJaeseongElement('丙')).toBe('金');
  });

  it('庚일간 → 재성 오행 木', () => {
    expect(getJaeseongElement('庚')).toBe('木');
  });

  // ── 재성 세력 판정 ──

  it('재성 strong: 원국에 재성 오행 3개 이상', () => {
    // 甲일간, 재성=土, 지지에 丑未戌(土 3개)
    const result = analyzeJaeseongStrength('甲', {
      year: { gan: '甲', ji: '丑' },
      month: { gan: '乙', ji: '未' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '丙', ji: '寅' },
    });
    expect(result.level).toBe('strong');
    expect(result.count).toBeGreaterThanOrEqual(3);
  });

  it('재성 weak: 원국에 재성 오행 0~1개', () => {
    // 甲일간, 재성=土, 지지에 子卯酉亥(土 0개)
    const result = analyzeJaeseongStrength('甲', {
      year: { gan: '壬', ji: '子' },
      month: { gan: '乙', ji: '卯' },
      day: { gan: '甲', ji: '酉' },
      hour: { gan: '丙', ji: '亥' },
    });
    expect(result.level).toBe('weak');
    expect(result.count).toBeLessThanOrEqual(1);
  });

  // ── 통합 분석: 신강+재강, 신약+재강 ──

  it('1986-09-15 01:17 남 서울 → 금전운 전체 구조 반환', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    expect(saju.moneyReading).toBeDefined();
    const mr = saju.moneyReading!;

    // 壬일간 → 재성 火
    expect(mr.jaeseongGung.jaeseongElement).toBe('火');
    expect(mr.jaeseongGung.jaeseongStrength.level).toBeDefined();
    expect(['strong', 'moderate', 'weak']).toContain(mr.jaeseongGung.jaeseongStrength.level);

    // 금전 성향
    expect(mr.moneyStyle.dayGanElement).toBe('水');
    expect(mr.moneyStyle.earningStyle).toBeTruthy();
    expect(mr.moneyStyle.spendingStyle).toBeTruthy();
    expect(mr.moneyStyle.strengthJaeseong.label).toBeTruthy();

    // 시기
    expect(Array.isArray(mr.timing.jaeseongDaeun)).toBe(true);
    expect(Array.isArray(mr.timing.pyeonjaeSeunyears)).toBe(true);
    expect(Array.isArray(mr.timing.jeongjaeSeunyears)).toBe(true);
  });

  it('신강+재강 → 신강재강 라벨', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    // 壬일간, 신강 70점
    expect(saju.strength.level).toBe('신강');
    const mr = saju.moneyReading!;
    // 라벨이 신강 관련이어야 함
    expect(mr.moneyStyle.strengthJaeseong.label).toMatch(/신강|중화/);
  });

  it('1983-08-19 04:00 → 신약 사주 금전운', () => {
    const saju = analyzeSaju({
      birthDate: '1983-08-19',
      birthTime: '04:00',
      calendar: 'solar',
      gender: 'F',
    });
    expect(saju.strength.level).toBe('신약');
    const mr = saju.moneyReading!;
    // 己일간 → 재성 水
    expect(mr.jaeseongGung.jaeseongElement).toBe('水');
    expect(mr.moneyStyle.strengthJaeseong.label).toMatch(/신약|재다|중화/);
  });

  // ── 대운 시기 추출 ──

  it('대운에서 재성 오행 시기가 추출됨', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    const mr = saju.moneyReading!;
    // 대운이 있으면 재성 대운도 있을 수 있음
    if (mr.timing.jaeseongDaeun.length > 0) {
      const first = mr.timing.jaeseongDaeun[0];
      expect(first.startAge).toBeDefined();
      expect(first.endAge).toBeDefined();
      expect(first.gan).toBeTruthy();
      expect(first.ji).toBeTruthy();
      expect(first.rating).toBeTruthy();
    }
  });

  it('세운에서 편재/정재 연도가 추출됨', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    const mr = saju.moneyReading!;
    const allYears = [...mr.timing.pyeonjaeSeunyears, ...mr.timing.jeongjaeSeunyears];
    // 10년 세운 중 재성 연도가 하나는 있어야 함
    expect(allYears.length).toBeGreaterThan(0);
    for (const y of allYears) {
      expect(y).toBeGreaterThanOrEqual(2026);
      expect(y).toBeLessThanOrEqual(2035);
    }
  });

  it('성별 없이도 금전운 분석 가능', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
    });
    expect(saju.moneyReading).toBeDefined();
    expect(saju.moneyReading!.jaeseongGung.jaeseongElement).toBe('火');
  });
});
