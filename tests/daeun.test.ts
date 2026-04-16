import { calculateDaeun, calculateSeUn } from '@engine/daeun';

const REF_PILLARS = {
  year: { gan: '丙', ji: '寅' },
  month: { gan: '丁', ji: '酉' },
  day: { gan: '壬', ji: '戌' },
  hour: { gan: '庚', ji: '子' },
};

describe('daeun — 대운 계산 + 분석', () => {
  // 1986-09-15 01:17 남, 용신 木
  it('양남 순행, 첫 대운 戊戌', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'M', birth, REF_PILLARS, '木');

    expect(r.direction).toBe('순행');
    expect(r.periods[0].gan).toBe('戊');
    expect(r.periods[0].ji).toBe('戌');
    expect(r.periods[1].gan).toBe('己');
    expect(r.periods[1].ji).toBe('亥');
  });

  it('각 대운에 analysis가 포함된다', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'M', birth, REF_PILLARS, '木');

    const first = r.periods[0];
    expect(first.analysis).toBeDefined();
    expect(first.analysis.ganTenGod).toBeDefined();
    expect(first.analysis.jiTenGod).toBeDefined();
    expect(first.analysis.yongSinRelation).toBeDefined();
    expect(first.analysis.score).toBeGreaterThanOrEqual(0);
    expect(first.analysis.score).toBeLessThanOrEqual(100);
    expect(first.analysis.rating).toBeDefined();
  });

  it('용신 희신 대운은 점수가 높다', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'M', birth, REF_PILLARS, '木');

    // 壬寅 대운 (48~57세): 壬=비견(기신), 寅=甲木(식신=용신) → 희신
    const imInPeriod = r.periods.find(p => p.gan === '壬' && p.ji === '寅');
    expect(imInPeriod).toBeDefined();
    expect(imInPeriod!.analysis.yongSinRelation).toBe('희신');
  });

  it('역행 대운 간지 순서', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'F', birth, REF_PILLARS, '木');

    expect(r.direction).toBe('역행');
    expect(r.periods[0].gan).toBe('丙');
    expect(r.periods[0].ji).toBe('申');
  });

  it('대운 시작 나이 1~10세', () => {
    const birth = new Date(2000, 0, 15, 12, 0);
    const pillars = {
      year: { gan: '庚', ji: '辰' },
      month: { gan: '丁', ji: '丑' },
      day: { gan: '甲', ji: '午' },
      hour: null,
    };
    const r = calculateDaeun('庚', '丁', '丑', 'M', birth, pillars, '火');
    expect(r.startAge).toBeGreaterThanOrEqual(1);
    expect(r.startAge).toBeLessThanOrEqual(10);
  });

  it('10년 주기 연속', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'M', birth, REF_PILLARS, '木');
    for (let i = 1; i < r.periods.length; i++) {
      expect(r.periods[i].startAge).toBe(r.periods[i - 1].startAge + 10);
    }
  });

  it('대운 지지 충 검출', () => {
    const birth = new Date(1986, 8, 15, 0, 45);
    const r = calculateDaeun('丙', '丁', '酉', 'M', birth, REF_PILLARS, '木');

    // 甲辰 대운 (68~77): 辰과 원국 戌(일지)은 辰戌충
    const gapJin = r.periods.find(p => p.gan === '甲' && p.ji === '辰');
    expect(gapJin).toBeDefined();
    const hasChung = gapJin!.analysis.jijiRelations.some(r => r.type === '충');
    expect(hasChung).toBe(true);
  });
});

describe('seun — 세운 계산 + 분석', () => {
  it('세운에 analysis가 포함된다', () => {
    const seun = calculateSeUn(2026, 2030, REF_PILLARS, '木');
    expect(seun).toHaveLength(5);
    expect(seun[0].analysis).toBeDefined();
    expect(seun[0].analysis.ganTenGod).toBeDefined();
    expect(seun[0].analysis.rating).toBeDefined();
  });

  it('2026 丙午 세운 분석', () => {
    const seun = calculateSeUn(2026, 2026, REF_PILLARS, '木');
    expect(seun[0].gan).toBe('丙');
    expect(seun[0].ji).toBe('午');
    // 壬 일간 vs 丙 = 편재, 午 정기 丁 = 정재
    expect(seun[0].analysis.ganTenGod).toBe('편재');
    expect(seun[0].analysis.jiTenGod).toBe('정재');
  });

  it('1986년 = 丙寅', () => {
    const seun = calculateSeUn(1986, 1986, REF_PILLARS, '木');
    expect(seun[0]).toMatchObject({ year: 1986, gan: '丙', ji: '寅' });
  });
});
