import { getIljin, getIljinByDate } from '@engine/data/iljin_adapter';

describe('iljin_adapter', () => {
  describe('getIljin', () => {
    const cases: [string, string, string][] = [
      ['1900-01-01', '갑술', '甲戌'],
      ['1970-06-15', '병인', '丙寅'],
      ['2000-01-01', '무오', '戊午'],
      ['2024-02-29', '계해', '癸亥'],
      ['2049-12-31', '경진', '庚辰'],
    ];

    it.each(cases)('%s → %s(%s)', (date, korean, hanja) => {
      const result = getIljin(date);
      expect(result).not.toBeNull();
      expect(result!.korean).toBe(korean);
      expect(result!.hanja).toBe(hanja);
    });

    it('범위 밖 날짜는 null을 반환한다', () => {
      expect(getIljin('1899-12-31')).toBeNull();
      expect(getIljin('2050-01-01')).toBeNull();
    });
  });

  describe('getIljinByDate', () => {
    it('Date 객체로 조회할 수 있다', () => {
      const result = getIljinByDate(new Date(2000, 0, 1));
      expect(result).not.toBeNull();
      expect(result!.korean).toBe('무오');
    });
  });
});
