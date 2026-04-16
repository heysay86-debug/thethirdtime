import { determineYongSin } from '@engine/yong_sin';

describe('yong_sin — 5법 병렬 출력', () => {
  // 1986-09-15 01:17: 丙寅 丁酉 壬戌 庚子
  // 壬水 일간, 신강, 편인격, 酉월(중가을)
  describe('1986-09-15 壬 신강 酉월', () => {
    const r = determineYongSin('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: { gan: '庚', ji: '子' },
    }, '신강', '편인격');

    it('억부: 木(식상) + 火(재성)', () => {
      expect(r.methods.eokbu.applicable).toBe(true);
      expect(r.methods.eokbu.primary).toBe('木');
      expect(r.methods.eokbu.secondary).toBe('火');
    });

    it('조후: 궁통보감 壬일간 유월 → 甲木 설기', () => {
      expect(r.methods.johu.applicable).toBe(true);
      expect(r.methods.johu.primary).toBe('木');  // 甲 = 木
      expect(r.methods.johu.reasoning).toContain('궁통보감');
      expect(r.methods.johu.reasoning).toContain('甲');
    });

    it('통관: 해당 없음', () => {
      expect(r.methods.tonggwan.applicable).toBe(false);
    });

    it('병약: 해당 없음', () => {
      expect(r.methods.byeongyak.applicable).toBe(false);
    });

    it('전왕: 해당 없음 (내격)', () => {
      expect(r.methods.jeonwang.applicable).toBe(false);
    });

    it('최종: 억부+조후 일치 → 木', () => {
      expect(r.final.primary).toBe('木');
      expect(r.final.method).toContain('일치');
    });
  });

  // 1983-08-19: 癸亥 庚申 己卯 丙寅
  // 己土 일간, 신약, 상관격, 申월
  it('1983-08-19 己 신약 → 억부 火(인성)', () => {
    const r = determineYongSin('己', {
      year: { gan: '癸', ji: '亥' },
      month: { gan: '庚', ji: '申' },
      day: { gan: '己', ji: '卯' },
      hour: { gan: '丙', ji: '寅' },
    }, '신약', '상관격');

    expect(r.methods.eokbu.primary).toBe('火');
    expect(r.methods.johu.applicable).toBe(true);
    expect(r.methods.johu.primary).toBe('火');   // 丙 = 火
    expect(r.final.primary).toBe('火');
  });

  // 겨울 사주: 壬일간 子월
  it('壬 子월 겨울 → 조후 丙火', () => {
    const r = determineYongSin('壬', {
      year: { gan: '壬', ji: '子' },
      month: { gan: '癸', ji: '子' },
      day: { gan: '壬', ji: '亥' },
      hour: { gan: '甲', ji: '寅' },
    }, '신강', '건록격');

    expect(r.methods.johu.primary).toBe('火');   // 궁통보감 壬일간 자월 = 丙火
    expect(r.methods.johu.reasoning).toContain('丙');
    // 억부는 신강→木, 조후는 火 → 불일치 → 조후 우선
    expect(r.final.method).toContain('조후');
  });

  // 여름 사주: 甲일간 午월
  it('甲 午월 여름 → 조후 癸水', () => {
    const r = determineYongSin('甲', {
      year: { gan: '丙', ji: '午' },
      month: { gan: '庚', ji: '午' },
      day: { gan: '甲', ji: '辰' },
      hour: { gan: '丙', ji: '午' },
    }, '신약', '편관격');

    expect(r.methods.johu.primary).toBe('水');   // 궁통보감 甲일간 오월 = 癸水
    expect(r.methods.johu.reasoning).toContain('癸');
  });

  // 종격: 전왕용신 우선
  it('종강격 → 전왕용신 우선', () => {
    const r = determineYongSin('甲', {
      year: { gan: '甲', ji: '寅' },
      month: { gan: '壬', ji: '寅' },
      day: { gan: '甲', ji: '子' },
      hour: { gan: '壬', ji: '寅' },
    }, '극강', '종강격');

    expect(r.methods.jeonwang.applicable).toBe(true);
    expect(r.methods.jeonwang.primary).toBe('木');
    expect(r.final.primary).toBe('木');
    expect(r.final.method).toBe('전왕');
  });

  it('종살격 → 전왕용신 관살', () => {
    const r = determineYongSin('甲', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '戊', ji: '申' },
    }, '극약', '종살격');

    expect(r.final.primary).toBe('金');
    expect(r.final.method).toBe('전왕');
  });

  // 5법 모두 출력되는지 구조 확인
  it('모든 method 필드가 존재한다', () => {
    const r = determineYongSin('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    }, '중화', '정인격');

    expect(r.methods).toHaveProperty('eokbu');
    expect(r.methods).toHaveProperty('johu');
    expect(r.methods).toHaveProperty('tonggwan');
    expect(r.methods).toHaveProperty('byeongyak');
    expect(r.methods).toHaveProperty('jeonwang');
    expect(r.final).toHaveProperty('primary');
    expect(r.final).toHaveProperty('method');
    expect(r.final).toHaveProperty('reasoning');
  });
});
