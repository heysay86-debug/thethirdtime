import { getTwelveStage, calculateTwelveStages } from '../src/engine/twelve_stages';

describe('십이운성 (Twelve Life Stages)', () => {
  describe('getTwelveStage', () => {
    test('甲 일간 + 亥 지지 → 장생', () => {
      expect(getTwelveStage('甲', '亥')).toBe('장생');
    });

    test('甲 일간 + 午 지지 → 사', () => {
      expect(getTwelveStage('甲', '午')).toBe('사');
    });

    test('壬 일간 + 申 지지 → 장생', () => {
      expect(getTwelveStage('壬', '申')).toBe('장생');
    });

    test('壬 일간 + 子 지지 → 제왕', () => {
      expect(getTwelveStage('壬', '子')).toBe('제왕');
    });

    test('壬 일간 + 戌 지지 → 관대 (1986-09-15 일주 기준)', () => {
      expect(getTwelveStage('壬', '戌')).toBe('관대');
    });

    test('유효하지 않은 천간 → 에러', () => {
      expect(() => getTwelveStage('X', '子')).toThrow('유효하지 않은 천간');
    });

    test('유효하지 않은 지지 → 에러', () => {
      expect(() => getTwelveStage('甲', 'X')).toThrow('유효하지 않은 지지');
    });
  });

  describe('calculateTwelveStages', () => {
    test('壬 일간, 寅/酉/戌/子 → year=병, month=목욕, day=관대, hour=제왕', () => {
      const result = calculateTwelveStages('壬', {
        year: { ji: '寅' },
        month: { ji: '酉' },
        day: { ji: '戌' },
        hour: { ji: '子' },
      });

      expect(result.year).toBe('병');
      expect(result.month).toBe('목욕');
      expect(result.day).toBe('관대');
      expect(result.hour).toBe('제왕');
    });

    test('시주가 null이면 hour도 null', () => {
      const result = calculateTwelveStages('甲', {
        year: { ji: '亥' },
        month: { ji: '子' },
        day: { ji: '丑' },
        hour: null,
      });

      expect(result.year).toBe('장생');
      expect(result.month).toBe('목욕');
      expect(result.day).toBe('관대');
      expect(result.hour).toBeNull();
    });
  });
});
