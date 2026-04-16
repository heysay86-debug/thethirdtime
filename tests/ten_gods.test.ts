import { getTenGod, calculateTenGods } from '@engine/ten_gods';

describe('ten_gods — 십성 기본 판정', () => {
  // 일간 甲(양목) 기준 전체 10개 십성 검증
  describe('일간 甲 기준', () => {
    const cases: [string, string, string][] = [
      // [대상천간, 기대십성, 설명]
      ['甲', '비견', '같은 오행+같은 음양 = 비견'],
      ['乙', '겁재', '같은 오행+다른 음양 = 겁재'],
      ['丙', '식신', '내가 생(木→火)+같은 음양 = 식신'],
      ['丁', '상관', '내가 생(木→火)+다른 음양 = 상관'],
      ['戊', '편재', '내가 극(木→土)+같은 음양 = 편재'],
      ['己', '정재', '내가 극(木→土)+다른 음양 = 정재'],
      ['庚', '편관', '나를 극(金→木)+같은 음양 = 편관'],
      ['辛', '정관', '나를 극(金→木)+다른 음양 = 정관'],
      ['壬', '편인', '나를 생(水→木)+같은 음양 = 편인'],
      ['癸', '정인', '나를 생(水→木)+다른 음양 = 정인'],
    ];

    it.each(cases)('甲 vs %s → %s (%s)', (target, expected) => {
      expect(getTenGod('甲', target)).toBe(expected);
    });
  });

  // 일간 壬(양수) 기준 — 다른 오행으로 교차 검증
  describe('일간 壬 기준', () => {
    const cases: [string, string][] = [
      ['壬', '비견'],  // 같은 오행+같은 음양
      ['癸', '겁재'],  // 같은 오행+다른 음양
      ['甲', '식신'],  // 내가 생(水→木)+같은 음양
      ['乙', '상관'],  // 내가 생(水→木)+다른 음양
      ['丙', '편재'],  // 내가 극(水→火)+같은 음양
      ['丁', '정재'],  // 내가 극(水→火)+다른 음양
      ['戊', '편관'],  // 나를 극(土→水)+같은 음양
      ['己', '정관'],  // 나를 극(土→水)+다른 음양
      ['庚', '편인'],  // 나를 생(金→水)+같은 음양
      ['辛', '정인'],  // 나를 생(金→水)+다른 음양
    ];

    it.each(cases)('壬 vs %s → %s', (target, expected) => {
      expect(getTenGod('壬', target)).toBe(expected);
    });
  });
});

describe('ten_gods — 레퍼런스 사주 십성 배치', () => {
  // 1986-09-15 시각미상: 丙寅 丁酉 壬戌 (시주 없음)
  // 일간 壬(양수) 기준:
  //   연간 丙 = 편재, 월간 丁 = 정재, 시간 = null
  //   연지 寅(본기 甲) = 식신, 월지 酉(본기 辛) = 정인, 일지 戌(본기 戊) = 편관
  it('1986-09-15: 壬戌 일간 기준 십성', () => {
    const result = calculateTenGods('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    });

    expect(result.yearGan).toBe('편재');
    expect(result.monthGan).toBe('정재');
    expect(result.dayGan).toBe('비견');
    expect(result.hourGan).toBeNull();
    expect(result.yearJi).toBe('식신');
    expect(result.monthJi).toBe('정인');
    expect(result.dayJi).toBe('편관');
    expect(result.hourJi).toBeNull();
  });

  // 1983-08-19 04:00: 癸亥 庚申 己卯 丙寅
  // 일간 己(음토) 기준:
  //   연간 癸 = 편재(내가 극 土→水, 다른음양→정재)...
  //   잠깐: 己는 음토, 癸는 음수. 토극수이므로 내가 극하는 관계.
  //   같은음양(둘다음) = 편재
  it('1983-08-19 04:00: 己卯 일간 기준 십성', () => {
    const result = calculateTenGods('己', {
      year: { gan: '癸', ji: '亥' },
      month: { gan: '庚', ji: '申' },
      day: { gan: '己', ji: '卯' },
      hour: { gan: '丙', ji: '寅' },
    });

    // 己(음토) vs 癸(음수): 토극수, 같은음양 → 편재
    expect(result.yearGan).toBe('편재');
    // 己(음토) vs 庚(양금): 토생금, 다른음양 → 상관
    expect(result.monthGan).toBe('상관');
    expect(result.dayGan).toBe('비견');
    // 己(음토) vs 丙(양화): 화생토, 다른음양 → 편인 (나를 생, 다른음양→정인? 아니 편인)
    // 己=음, 丙=양 → 다른음양 → 정인
    expect(result.hourGan).toBe('정인');

    // 연지 亥(본기 壬, 양수): 토극수, 다른음양 → 정재
    expect(result.yearJi).toBe('정재');
    // 월지 申(본기 庚, 양금): 토생금, 다른음양 → 상관
    expect(result.monthJi).toBe('상관');
    // 일지 卯(본기 乙, 음목): 목극토(나를 극), 같은음양 → 편관
    expect(result.dayJi).toBe('편관');
    // 시지 寅(본기 甲, 양목): 목극토(나를 극), 다른음양 → 정관
    expect(result.hourJi).toBe('정관');
  });

  // 1987-04-18 08:30: 丁卯 甲辰 丁酉 甲辰
  // 일간 丁(음화) 기준
  it('1987-04-18 08:30: 丁酉 일간 기준 십성', () => {
    const result = calculateTenGods('丁', {
      year: { gan: '丁', ji: '卯' },
      month: { gan: '甲', ji: '辰' },
      day: { gan: '丁', ji: '酉' },
      hour: { gan: '甲', ji: '辰' },
    });

    // 丁 vs 丁: 같은 오행+같은 음양 → 비견
    expect(result.yearGan).toBe('비견');
    // 丁(음화) vs 甲(양목): 목생화(나를 생), 다른음양 → 정인
    expect(result.monthGan).toBe('정인');
    expect(result.dayGan).toBe('비견');
    expect(result.hourGan).toBe('정인');

    // 연지 卯(본기 乙, 음목): 목생화(나를 생), 같은음양 → 편인
    expect(result.yearJi).toBe('편인');
    // 월지 辰(본기 戊, 양토): 화생토(내가 생), 다른음양 → 상관
    expect(result.monthJi).toBe('상관');
    // 일지 酉(본기 辛, 음금): 화극금(내가 극), 같은음양 → 편재
    expect(result.dayJi).toBe('편재');
    // 시지 辰(본기 戊, 양토): 화생토(내가 생), 다른음양 → 상관
    expect(result.hourJi).toBe('상관');
  });
});
