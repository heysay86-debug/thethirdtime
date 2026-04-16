import { analyzeSaju } from '@engine/analyze';
import { SajuResultSchema } from '@engine/schema';

describe('analyze — 전체 통합 분석', () => {
  it('1986-09-15 01:17 서울 → Zod 스키마 통과', () => {
    const result = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
    });

    // Zod 검증 (analyze 내부에서도 실행되지만 명시적 확인)
    expect(() => SajuResultSchema.parse(result)).not.toThrow();

    // 4기둥
    expect(result.pillars.year).toEqual({ gan: '丙', ji: '寅' });
    expect(result.pillars.month).toEqual({ gan: '丁', ji: '酉' });
    expect(result.pillars.day).toEqual({ gan: '壬', ji: '戌' });
    expect(result.pillars.hour).toEqual({ gan: '庚', ji: '子' });

    // 신강/신약
    expect(result.strength.level).toBe('신강');
    expect(result.strength.score).toBeGreaterThanOrEqual(65);
    expect(result.strength.score).toBeLessThan(80);

    // 격국
    expect(result.gyeokGuk.type).toBe('편인격');

    // 용신
    expect(result.yongSin.final.primary).toBe('木');
    expect(result.yongSin.methods.eokbu.applicable).toBe(true);
    expect(result.yongSin.methods.johu.applicable).toBe(true);
  });

  it('시각 미상 → hour null, 시주 관련 필드 null', () => {
    const result = analyzeSaju({
      birthDate: '1986-09-15',
      calendar: 'solar',
    });

    expect(result.pillars.hour).toBeNull();
    expect(result.tenGods.hourGan).toBeNull();
    expect(result.tenGods.hourJi).toBeNull();
    expect(result.jijanggan.hour).toBeNull();

    expect(() => SajuResultSchema.parse(result)).not.toThrow();
  });

  it('음력 입력 → 양력 변환 후 분석', () => {
    const result = analyzeSaju({
      birthDate: '2024-01-01',
      birthTime: '12:00',
      calendar: 'lunar',
    });

    expect(result.birth.solar).toBe('2024-02-10');
    expect(() => SajuResultSchema.parse(result)).not.toThrow();
  });

  it('1983-08-19 04:00 → 전체 파이프라인', () => {
    const result = analyzeSaju({
      birthDate: '1983-08-19',
      birthTime: '04:00',
      calendar: 'solar',
    });

    expect(result.pillars.day).toEqual({ gan: '己', ji: '卯' });
    expect(result.strength.level).toBe('신약');
    expect(result.gyeokGuk.type).toBe('상관격');
    expect(result.yongSin.final.primary).toBe('火');

    expect(() => SajuResultSchema.parse(result)).not.toThrow();
  });

  it('JSON 직렬화/역직렬화 가능', () => {
    const result = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
    });

    const json = JSON.stringify(result);
    const parsed = JSON.parse(json);

    expect(() => SajuResultSchema.parse(parsed)).not.toThrow();
  });
});
