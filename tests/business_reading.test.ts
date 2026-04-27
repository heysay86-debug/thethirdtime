import { analyzeBusiness, calculateBusinessScore, INDUSTRY_BY_ELEMENT } from '@engine/business_reading';
import { analyzeSaju } from '@engine/analyze';

describe('business_reading — 사업운 분석', () => {
  // ── 사업적성 점수 계산 ──

  it('편재+식상생재+역마+편관제화+신강 → 만점 100', () => {
    const score = calculateBusinessScore(
      ['편재', '식신', '정재', '편관'],
      true,   // 역마
      '신강',
      true,   // 편관 제화
    );
    expect(score.pyeonjae).toBe(30);
    expect(score.siksangSaengjae).toBe(20);
    expect(score.yeokma).toBe(10);
    expect(score.pyeongwanJehwa).toBe(15);
    expect(score.singang).toBe(25);
    expect(score.total).toBe(100);
  });

  it('아무 조건도 없으면 0점', () => {
    const score = calculateBusinessScore(
      ['비견', '정인'],
      false,
      '신약',
      false,
    );
    expect(score.total).toBe(0);
  });

  it('편재만 있으면 30점', () => {
    const score = calculateBusinessScore(
      ['편재', '비견'],
      false,
      '신약',
      false,
    );
    expect(score.pyeonjae).toBe(30);
    expect(score.total).toBe(30);
  });

  it('신강만이면 25점', () => {
    const score = calculateBusinessScore(
      ['비견', '정인'],
      false,
      '극강',
      false,
    );
    expect(score.singang).toBe(25);
    expect(score.total).toBe(25);
  });

  // ── 업종 매핑 (용신 5개 오행) ──

  it('木 용신 → 교육/출판 추천', () => {
    const info = INDUSTRY_BY_ELEMENT['木'];
    expect(info.recommended).toContain('교육');
    expect(info.recommended).toContain('출판');
    expect(info.recommended.length).toBeGreaterThanOrEqual(3);
    expect(info.notRecommended.length).toBeGreaterThanOrEqual(2);
  });

  it('火 용신 → IT/요식업 추천', () => {
    const info = INDUSTRY_BY_ELEMENT['火'];
    expect(info.recommended).toContain('IT');
    expect(info.recommended).toContain('요식업');
  });

  it('土 용신 → 부동산/중개업 추천', () => {
    const info = INDUSTRY_BY_ELEMENT['土'];
    expect(info.recommended).toContain('부동산');
    expect(info.recommended).toContain('중개업');
  });

  it('金 용신 → 금융/제조업 추천', () => {
    const info = INDUSTRY_BY_ELEMENT['金'];
    expect(info.recommended).toContain('금융');
    expect(info.recommended).toContain('제조업');
  });

  it('水 용신 → 무역/유통 추천', () => {
    const info = INDUSTRY_BY_ELEMENT['水'];
    expect(info.recommended).toContain('무역');
    expect(info.recommended).toContain('유통');
  });

  // ── 관성+재성 조합 4가지 ──

  it('1986-09-15 01:17 남 서울 → 사업운 전체 구조', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    expect(saju.businessReading).toBeDefined();
    const br = saju.businessReading!;

    // 壬일간 → 관성 土, 재성 火
    expect(br.gwanJaeAnalysis.gwanseongElement).toBe('土');
    expect(br.gwanJaeAnalysis.jaeseongElement).toBe('火');
    expect(['관강재강', '관강재약', '관약재강', '관약재약']).toContain(br.gwanJaeAnalysis.combination);
    expect(br.gwanJaeAnalysis.combinationLabel).toBeTruthy();
    expect(br.gwanJaeAnalysis.combinationDesc).toBeTruthy();

    // 사업적성 점수 0~100
    expect(br.gwanJaeAnalysis.businessScore.total).toBeGreaterThanOrEqual(0);
    expect(br.gwanJaeAnalysis.businessScore.total).toBeLessThanOrEqual(100);

    // 업종
    expect(br.industryFit.yongsinElement).toBe('木');
    expect(br.industryFit.recommended.length).toBeGreaterThanOrEqual(3);
    expect(br.industryFit.notRecommended.length).toBeGreaterThanOrEqual(2);

    // 시기
    expect(Array.isArray(br.timing.bestDaeun)).toBe(true);
    expect(Array.isArray(br.timing.cautionPeriods)).toBe(true);
  });

  it('1983-08-19 04:00 여 → 사업운 (신약)', () => {
    const saju = analyzeSaju({
      birthDate: '1983-08-19',
      birthTime: '04:00',
      calendar: 'solar',
      gender: 'F',
    });
    expect(saju.strength.level).toBe('신약');
    const br = saju.businessReading!;

    // 己일간 → 관성 木, 재성 水
    expect(br.gwanJaeAnalysis.gwanseongElement).toBe('木');
    expect(br.gwanJaeAnalysis.jaeseongElement).toBe('水');

    // 신약이므로 singang 점수 0
    expect(br.gwanJaeAnalysis.businessScore.singang).toBe(0);
  });

  it('성별 없이도 사업운 분석 가능', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
    });
    expect(saju.businessReading).toBeDefined();
    // 대운 없어도 분석은 됨
    expect(saju.businessReading!.gwanJaeAnalysis.businessScore.total).toBeGreaterThanOrEqual(0);
  });

  it('주의 시기에 비겁대운 또는 편관무제화가 포함될 수 있음', () => {
    const saju = analyzeSaju({
      birthDate: '1986-09-15',
      birthTime: '01:17',
      calendar: 'solar',
      birthCity: '서울',
      gender: 'M',
    });
    const br = saju.businessReading!;
    // 주의 시기가 있으면 타입과 이유가 있어야 함
    for (const cp of br.timing.cautionPeriods) {
      expect(['비겁대운', '편관무제화']).toContain(cp.type);
      expect(cp.reason).toBeTruthy();
      expect(cp.startAge).toBeDefined();
    }
  });
});
