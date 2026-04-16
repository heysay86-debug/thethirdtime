import { getJeolgiByYear, findJeolgi, jeolgiToDate } from '@engine/data/jeolip_adapter';

describe('jeolip_adapter', () => {
  describe('getJeolgiByYear', () => {
    it('1900년 절기 24개를 반환한다', () => {
      const list = getJeolgiByYear(1900);
      expect(list).not.toBeNull();
      expect(list!.length).toBe(24);
    });

    it('2049년 절기 24개를 반환한다', () => {
      const list = getJeolgiByYear(2049);
      expect(list).not.toBeNull();
      expect(list!.length).toBe(24);
    });

    it('범위 밖 연도는 null을 반환한다', () => {
      expect(getJeolgiByYear(1899)).toBeNull();
      expect(getJeolgiByYear(2050)).toBeNull();
    });
  });

  describe('findJeolgi', () => {
    it('1900년 입춘: 2월 4일 14:52', () => {
      const entry = findJeolgi(1900, '입춘');
      expect(entry).toEqual({ name: '입춘', month: 2, day: 4, time: '14:52' });
    });

    it('2000년 입춘: 2월 4일 21:40', () => {
      const entry = findJeolgi(2000, '입춘');
      expect(entry).toEqual({ name: '입춘', month: 2, day: 4, time: '21:40' });
    });

    it('2024년 소한: 1월 6일 05:49', () => {
      const entry = findJeolgi(2024, '소한');
      expect(entry).toEqual({ name: '소한', month: 1, day: 6, time: '05:49' });
    });

    it('존재하지 않는 절기명은 null을 반환한다', () => {
      expect(findJeolgi(2000, '없는절기')).toBeNull();
    });

    it('범위 밖 연도는 null을 반환한다', () => {
      expect(findJeolgi(1899, '입춘')).toBeNull();
    });
  });

  describe('jeolgiToDate', () => {
    it('절기를 Date 객체로 변환한다', () => {
      const date = jeolgiToDate(1900, { name: '입춘', month: 2, day: 4, time: '14:52' });
      expect(date.getFullYear()).toBe(1900);
      expect(date.getMonth()).toBe(1); // 0-indexed
      expect(date.getDate()).toBe(4);
      expect(date.getHours()).toBe(14);
      expect(date.getMinutes()).toBe(52);
    });
  });
});
