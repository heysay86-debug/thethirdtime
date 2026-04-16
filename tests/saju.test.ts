import { calculateSaju } from '@engine/saju';

describe('saju — 4기둥 통합 파이프라인', () => {
  // 레퍼런스 1: 1986-09-15 시각 미상
  it('1986-09-15 시각 미상 → 丙寅 丁酉 壬戌 (시주 없음)', () => {
    const r = calculateSaju({ birthDate: '1986-09-15', calendar: 'solar' });
    expect(r.yearPillar).toEqual({ gan: '丙', ji: '寅' });
    expect(r.monthPillar).toEqual({ gan: '丁', ji: '酉' });
    expect(r.dayPillar).toEqual({ gan: '壬', ji: '戌' });
    expect(r.hourPillar).toBeNull();
  });

  // 레퍼런스 2: 2000-01-01 12:00 서울 (입춘 전 → 1999년 기준)
  it('2000-01-01 12:00 서울 → 己卯 丁丑 戊午 戊午', () => {
    const r = calculateSaju({ birthDate: '2000-01-01', birthTime: '12:00', calendar: 'solar' });
    expect(r.yearPillar).toEqual({ gan: '己', ji: '卯' });
    expect(r.monthPillar).toEqual({ gan: '丁', ji: '丑' });
    expect(r.dayPillar).toEqual({ gan: '戊', ji: '午' });
    expect(r.hourPillar).toEqual({ gan: '戊', ji: '午' });
  });

  // 레퍼런스 3: 1990-03-18 14:30 서울
  it('1990-03-18 14:30 서울 → 庚午 己卯 壬午 丁未', () => {
    const r = calculateSaju({ birthDate: '1990-03-18', birthTime: '14:30', calendar: 'solar' });
    expect(r.yearPillar).toEqual({ gan: '庚', ji: '午' });
    expect(r.monthPillar).toEqual({ gan: '己', ji: '卯' });
    expect(r.dayPillar).toEqual({ gan: '壬', ji: '午' });
    expect(r.hourPillar).toEqual({ gan: '丁', ji: '未' });
  });

  // 레퍼런스 4: 입춘 경계 — 2024-02-04 18:00 (입춘 17:27, 보정후 17:28 → 입춘 직후)
  it('2024-02-04 18:00 서울 (입춘 직후) → 甲辰 丙寅 戊戌 辛酉', () => {
    const r = calculateSaju({ birthDate: '2024-02-04', birthTime: '18:00', calendar: 'solar' });
    expect(r.yearPillar).toEqual({ gan: '甲', ji: '辰' });
    expect(r.monthPillar).toEqual({ gan: '丙', ji: '寅' });
    expect(r.dayPillar).toEqual({ gan: '戊', ji: '戌' });
    expect(r.hourPillar).toEqual({ gan: '辛', ji: '酉' });
  });

  // 레퍼런스 5: 입춘 경계 — 2024-02-04 17:00 (보정후 16:28 → 입춘 전)
  it('2024-02-04 17:00 서울 (입춘 전) → 癸卯 乙丑 戊戌 庚申', () => {
    const r = calculateSaju({ birthDate: '2024-02-04', birthTime: '17:00', calendar: 'solar' });
    expect(r.yearPillar).toEqual({ gan: '癸', ji: '卯' });
    expect(r.monthPillar).toEqual({ gan: '乙', ji: '丑' });
    expect(r.dayPillar).toEqual({ gan: '戊', ji: '戌' });
    expect(r.hourPillar).toEqual({ gan: '庚', ji: '申' });
  });

  describe('음력 입력', () => {
    // 음력 2024-01-01 = 양력 2024-02-10
    it('음력 2024-01-01 12:00 → 양력 2024-02-10 기준 계산', () => {
      const r = calculateSaju({ birthDate: '2024-01-01', birthTime: '12:00', calendar: 'lunar' });
      expect(r.birth.solar).toBe('2024-02-10');
      expect(r.yearPillar).toEqual({ gan: '甲', ji: '辰' });
    });
  });

  describe('진태양시 보정', () => {
    it('서울 보정값 = -32분', () => {
      const r = calculateSaju({ birthDate: '2000-06-15', birthTime: '12:00', calendar: 'solar', birthCity: '서울' });
      expect(r.birth.offsetMinutes).toBe(-32);
      expect(r.birth.adjustedTime).toBe('11:28');
    });

    it('부산 보정값 = -24분', () => {
      const r = calculateSaju({ birthDate: '2000-06-15', birthTime: '12:00', calendar: 'solar', birthCity: '부산' });
      expect(r.birth.offsetMinutes).toBe(-24);
      expect(r.birth.adjustedTime).toBe('11:36');
    });

    it('미등록 도시 → 서울 기준', () => {
      const r = calculateSaju({ birthDate: '2000-06-15', birthTime: '12:00', calendar: 'solar', birthCity: '뉴욕' });
      expect(r.birth.offsetMinutes).toBe(-32);
    });

    // 보정으로 시주가 바뀌는 경계 케이스
    // 1986-09-15 01:17 서울 → 보정후 00:45 → 자시(庚子)
    it('01:17 서울 보정 → 00:45 자시로 변경', () => {
      const r = calculateSaju({ birthDate: '1986-09-15', birthTime: '01:17', calendar: 'solar', birthCity: '서울' });
      expect(r.birth.adjustedTime).toBe('00:45');
      expect(r.hourPillar).toEqual({ gan: '庚', ji: '子' });
    });
  });
});
