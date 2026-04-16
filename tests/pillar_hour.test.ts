import { getHourPillar } from '@engine/pillar_hour';

describe('pillar_hour — 시주 산출', () => {
  // 1986-09-15 일주 = 壬戌, 일간 壬(8) → 오서둔: 자시 시간 = 庚(6)
  // 庚子(자), 辛丑(축), 壬寅(인), 癸卯(묘), 甲辰(진), 乙巳(사),
  // 丙午(오), 丁未(미), 戊申(신), 己酉(유), 庚戌(술), 辛亥(해)

  describe('12시진 전체 — 1986-09-15 (일간 壬)', () => {
    const cases: [string, number, string, string][] = [
      ['00:30 조자시', 0, '庚', '子'],
      ['01:30 축시',   1, '辛', '丑'],
      ['03:30 인시',   3, '壬', '寅'],
      ['05:30 묘시',   5, '癸', '卯'],
      ['07:30 진시',   7, '甲', '辰'],
      ['09:30 사시',   9, '乙', '巳'],
      ['11:30 오시',  11, '丙', '午'],
      ['13:30 미시',  13, '丁', '未'],
      ['15:30 신시',  15, '戊', '申'],
      ['17:30 유시',  17, '己', '酉'],
      ['19:30 술시',  19, '庚', '戌'],
      ['21:30 해시',  21, '辛', '亥'],
    ];

    it.each(cases)('%s → %s%s', (_, hour, gan, ji) => {
      const result = getHourPillar(new Date(1986, 8, 15, hour, 30));
      expect(result.known).toBe(true);
      expect(result.pillar).toEqual({ gan, ji });
    });
  });

  // 야자시 특례: 23:00~23:59 → 시지=子, 시간은 익일 일간 기준
  describe('야자시 특례', () => {
    // 1986-09-15 23:30 → 익일(9/16) 일주 = 癸亥, 일간 癸(9) → 오서둔: 壬(8)
    it('1986-09-15 23:30 → 壬子 (익일 일간 癸 기준)', () => {
      const result = getHourPillar(new Date(1986, 8, 15, 23, 30));
      expect(result.pillar).toEqual({ gan: '壬', ji: '子' });
    });

    // 2024-02-29 23:00 → 익일(3/1) 일주 = 甲子, 일간 甲(0) → 오서둔: 甲(0)
    it('2024-02-29 23:00 → 甲子 (익일 일간 甲 기준)', () => {
      const result = getHourPillar(new Date(2024, 1, 29, 23, 0));
      expect(result.pillar).toEqual({ gan: '甲', ji: '子' });
    });
  });

  // 다른 일간 오서둔 검증: 2000-06-15 일주 = 甲辰, 일간 甲(0) → 자시 甲(0)
  describe('오서둔 검증 — 일간 甲', () => {
    it('2000-06-15 07:00 진시 → 戊辰', () => {
      // 甲(0)+4=4→戊
      const result = getHourPillar(new Date(2000, 5, 15, 7, 0));
      expect(result.pillar).toEqual({ gan: '戊', ji: '辰' });
    });
  });

  // 시각 미상
  it('시각 미상 → known: false', () => {
    const result = getHourPillar(new Date(1986, 8, 15, 12, 0), false);
    expect(result.known).toBe(false);
    expect(result.pillar).toEqual({ gan: '', ji: '' });
  });
});
