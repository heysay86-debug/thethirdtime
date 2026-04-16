import { determineGyeokGuk } from '@engine/gyeok_guk';

describe('gyeok_guk — 1단계: 외격', () => {
  // 종강격: 비겁+인성만, 재관식 없음
  it('비겁+인성 일색, 재관식 없음 → 종강격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '甲', ji: '寅' },
      month: { gan: '壬', ji: '寅' },
      day: { gan: '甲', ji: '子' },
      hour: { gan: '壬', ji: '寅' },
    });
    expect(r.type).toBe('종강격');
    expect(r.category).toBe('외격');
  });

  // 종왕격: 비겁만 가득, 인성도 없음
  it('비겁만 가득 → 종왕격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '甲', ji: '寅' },
      month: { gan: '乙', ji: '卯' },
      day: { gan: '甲', ji: '寅' },
      hour: { gan: '甲', ji: '卯' },
    });
    expect(r.type).toBe('종왕격');
    expect(r.category).toBe('외격');
  });

  // 극강이지만 재관식 있으면 종격 불성립 → 내격
  it('극강이나 재성 존재 → 종격 불성립, 내격', () => {
    // 1986-09-15 01:17: 丙寅 丁酉 壬戌 庚子
    const r = determineGyeokGuk('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: { gan: '庚', ji: '子' },
    });
    expect(r.category).toBe('내격');
    expect(r.type).not.toContain('종');
  });

  // 종살격: 극약 + 관살 지배 + 비겁인성 없음
  it('극약 + 관살 지배 → 종살격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '戊', ji: '申' },
    });
    expect(r.type).toBe('종살격');
    expect(r.category).toBe('외격');
  });

  // 종아격: 극약 + 식상 지배
  it('극약 + 식상 지배 → 종아격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '丙', ji: '巳' },
      month: { gan: '丁', ji: '巳' },
      day: { gan: '甲', ji: '午' },
      hour: { gan: '丙', ji: '午' },
    });
    expect(r.type).toBe('종아격');
  });

  // 극약이지만 인성 있으면 종격 불성립
  it('극약이나 인성 존재 → 종격 불성립', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '戌' },
      hour: { gan: '壬', ji: '申' },  // 壬 = 편인
    });
    expect(r.category).toBe('내격');
  });
});

describe('gyeok_guk — 2단계: 특수 내격', () => {
  // 건록격
  it('甲일간 인월 → 건록격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '辛', ji: '酉' },
      month: { gan: '己', ji: '寅' },
      day: { gan: '甲', ji: '申' },
      hour: { gan: '辛', ji: '酉' },
    });
    expect(r.type).toBe('건록격');
    expect(r.basis.method).toBe('건록');
  });

  // 양인격
  it('甲일간 묘월 → 양인격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '戊', ji: '戌' },
      month: { gan: '丁', ji: '卯' },
      day: { gan: '甲', ji: '申' },
      hour: { gan: '庚', ji: '申' },
    });
    expect(r.type).toBe('양인격');
    expect(r.basis.method).toBe('양인');
  });
});

describe('gyeok_guk — 3단계: 투출 우선순위', () => {
  // 월간 투출 우선
  it('월간 투출 > 시간 투출', () => {
    // 壬일간, 월지 寅(여기 戊, 중기 丙, 정기 甲)
    // 월간 丙(중기) + 시간 甲(정기) → 월간 우선 → 丙 투출 → 편재격
    const r = determineGyeokGuk('壬', {
      year: { gan: '辛', ji: '酉' },
      month: { gan: '丙', ji: '寅' },
      day: { gan: '壬', ji: '午' },
      hour: { gan: '甲', ji: '子' },
    });
    expect(r.type).toBe('편재격');
    expect(r.basis.sourcePosition).toBe('월간');
  });

  // 시간에만 투출
  it('월간 미투출, 시간 투출 → 시간 기준', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '辛', ji: '酉' },
      month: { gan: '丁', ji: '辰' },  // 辰 지장간(乙·癸·戊), 丁 없음
      day: { gan: '壬', ji: '午' },
      hour: { gan: '戊', ji: '戌' },    // 戊 = 辰 정기 → 투출
    });
    expect(r.type).toBe('편관격');
    expect(r.basis.sourcePosition).toBe('시간');
  });

  // 같은 위치에서 정기 > 중기
  it('연간에 정기 투출 vs 시간에 중기 투출 → 정기 우선', () => {
    // 壬일간, 월지 寅(여기 戊, 중기 丙, 정기 甲)
    // 연간 甲(정기), 시간 丙(중기) → 둘 다 비월간, 정기 우선
    // 극약 방지: 壬에게 도움되는 庚(편인) 배치
    const r = determineGyeokGuk('壬', {
      year: { gan: '甲', ji: '子' },   // 子(癸=겁재)
      month: { gan: '庚', ji: '寅' },  // 庚은 寅 지장간에 없음, 편인
      day: { gan: '壬', ji: '亥' },    // 亥(壬=비견)
      hour: { gan: '丙', ji: '午' },
    });
    expect(r.type).toBe('식신격');  // 壬 vs 甲 = 식신 (정기 투출)
    expect(r.basis.sourceStem).toBe('甲');
  });

  // 미투출 → 본기 기준
  it('투출 없음 → 본기 기준 격국', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '辛', ji: '酉' },
      month: { gan: '丁', ji: '辰' },
      day: { gan: '壬', ji: '午' },
      hour: { gan: '丁', ji: '巳' },
    });
    expect(r.type).toBe('편관격');  // 辰 본기 戊 → 편관
    expect(r.basis.method).toBe('본기');
  });
});

describe('gyeok_guk — 4단계: 파격·합거·충격', () => {
  // 상관견관 — 합거 없는 구성
  it('정관격 + 상관 → 상관견관 파격', () => {
    // 甲일간, 酉(정기 辛=정관), 연간 丁(상관)
    // 합 없음: 丁의 합 파트너=壬 없음, 辛의 합 파트너=丙 없음
    const r = determineGyeokGuk('甲', {
      year: { gan: '丁', ji: '卯' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '甲', ji: '寅' },
      hour: { gan: '甲', ji: '寅' },   // 비견 (합 없음)
    });
    expect(r.type).toBe('정관격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('상관견관');
  });

  // 편인도식
  it('식신격 + 편인 → 도식 파격', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '庚', ji: '申' },  // 편인
      month: { gan: '甲', ji: '寅' },
      day: { gan: '壬', ji: '午' },
      hour: null,
    });
    expect(r.type).toBe('식신격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('도식');
  });

  // 비겁쟁재 — 합거 없는 구성
  it('정재격 + 비견 → 비겁쟁재 파격', () => {
    // 庚일간, 월지 卯(정기 乙=정재), 비견 庚 가득
    // 합: 庚의 합파트너=乙, 乙은 천간에 없음 → 합 없음
    const r = determineGyeokGuk('庚', {
      year: { gan: '庚', ji: '申' },
      month: { gan: '辛', ji: '卯' },   // 卯 정기 乙, 辛 미투출 → 본기 乙 → 정재
      day: { gan: '庚', ji: '戌' },
      hour: { gan: '庚', ji: '申' },
    });
    expect(r.type).toBe('정재격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('비겁');
  });

  // 재극인
  it('편인격 + 재성 → 재극인 파격', () => {
    // 1986-09-15 01:17: 丙寅 丁酉 壬戌 庚子
    // 酉 여기 庚 시간에 투출 → 편인격
    // 丙(편재), 丁(정재) 존재 → 재극인
    const r = determineGyeokGuk('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: { gan: '庚', ji: '子' },
    });
    expect(r.type).toBe('편인격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('재극인');
  });

  // 편관무제
  it('편관격 + 제화 없음 → 편관무제 파격', () => {
    // 甲일간, 신월(申 정기 庚=편관), 식신·인성 없이 비겁·재성만
    const r = determineGyeokGuk('甲', {
      year: { gan: '戊', ji: '辰' },   // 편재
      month: { gan: '庚', ji: '申' },  // 庚 정기 투출 → 편관격
      day: { gan: '甲', ji: '寅' },    // 寅(甲=비견)
      hour: { gan: '甲', ji: '寅' },   // 비견 (제화 아님)
    });
    expect(r.type).toBe('편관격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('편관무제');
  });

  // 편관격 + 식신 제화 → 성격 (형해 없는 구성)
  it('편관격 + 식신 제화 → 성격', () => {
    const r = determineGyeokGuk('甲', {
      year: { gan: '丙', ji: '午' },   // 식신
      month: { gan: '庚', ji: '申' },   // 편관
      day: { gan: '甲', ji: '辰' },    // 辰과 申 = 무관
      hour: { gan: '壬', ji: '子' },    // 편인, 子와 申 = 무관
    });
    expect(r.type).toBe('편관격');
    expect(r.state).toBe('성격');
  });

  // 합거 경고
  it('격 글자가 합으로 묶이면 합거 경고', () => {
    // 壬일간, 월지 酉(여기 庚, 정기 辛)
    // 시간 庚 투출 → 편인격
    // 庚의 합 파트너 = 乙 → 연간에 乙 있으면 합거
    const r = determineGyeokGuk('壬', {
      year: { gan: '乙', ji: '卯' },  // 乙庚합
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '午' },
      hour: { gan: '庚', ji: '申' },   // 庚 투출 → 편인격
    });
    expect(r.warnings.some(w => w.includes('합거'))).toBe(true);
  });

  // 충격 경고
  it('월지 충 → 충격 경고', () => {
    // 월지 酉, 일지 卯 → 卯酉충
    const r = determineGyeokGuk('壬', {
      year: { gan: '辛', ji: '酉' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '卯' },   // 卯酉충!
      hour: null,
    });
    expect(r.warnings.some(w => w.includes('충격'))).toBe(true);
  });
});

describe('gyeok_guk — 레퍼런스 사주', () => {
  // 1986-09-15 시각미상: 丙寅 丁酉 壬戌
  // 시주 없음 → 壬丁합으로 丁 합거, 활성 천간 丙(편재) → 재극인 파격
  it('1986-09-15 시각미상 → 정인격 재극인 파격', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    });
    expect(r.type).toBe('정인격');
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('재극인');
  });

  // 1986-09-15 01:17: 丙寅 丁酉 壬戌 庚子
  // 壬丁합 → 丁(정재) 합거 → 활성 재성 = 丙(편재) 하나
  // 酉 여기 庚이 시간에 투출 → 편인격
  // 활성 재성 丙 → 재극인 파격 (합거 丁 제외했지만 丙이 남음)
  // 酉戌해 → 월지 해로 격 약화
  it('1986-09-15 01:17 → 편인격 파격(재극인) + 酉戌해 약화', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: { gan: '庚', ji: '子' },
    });
    expect(r.type).toBe('편인격');
    // 丙(편재)이 활성이므로 여전히 파격
    expect(r.state).toBe('파격');
    expect(r.breakCauses[0]).toContain('재극인');
    // 酉戌해로 약화 플래그도 기록됨
    expect(r.weakenedBy.some(w => w.includes('해'))).toBe(true);
    expect(r.warnings.some(w => w.includes('酉戌해'))).toBe(true);
  });

  // 합거로 재성이 모두 제거되면 파격 → 약화로 다운그레이드
  // 壬일간, 월지 酉(여기 庚, 정기 辛), 시간 庚 투출 → 편인격
  // 천간: 丁(정재, 壬丁합 합거), 다른 재성 없음 → 약화
  it('편인격 + 재성 전부 합거 → 약화 (파격 아님)', () => {
    const r = determineGyeokGuk('壬', {
      year: { gan: '壬', ji: '子' },   // 비견
      month: { gan: '丁', ji: '酉' },   // 丁 = 壬丁합 합거
      day: { gan: '壬', ji: '亥' },
      hour: { gan: '庚', ji: '申' },    // 庚 투출 → 편인격
    });
    expect(r.type).toBe('편인격');
    // 丁 합거로 활성 재성 0 → 파격 불성립, 약화
    expect(r.state).toBe('약화');
    expect(r.breakCauses).toHaveLength(0);
  });

  // 1983-08-19: 癸亥 庚申 己卯 丙寅
  it('1983-08-19 → 상관격', () => {
    const r = determineGyeokGuk('己', {
      year: { gan: '癸', ji: '亥' },
      month: { gan: '庚', ji: '申' },
      day: { gan: '己', ji: '卯' },
      hour: { gan: '丙', ji: '寅' },
    });
    // 申 정기 庚, 월간 庚 투출 → 己 vs 庚 = 상관
    expect(r.type).toBe('상관격');
    expect(r.basis.sourcePosition).toBe('월간');
  });

  // 1987-04-18: 丁卯 甲辰 丁酉 甲辰
  it('1987-04-18 → 상관격 (辰 여기 乙이 아닌 정기 戊 관점 재확인)', () => {
    const r = determineGyeokGuk('丁', {
      year: { gan: '丁', ji: '卯' },
      month: { gan: '甲', ji: '辰' },
      day: { gan: '丁', ji: '酉' },
      hour: { gan: '甲', ji: '辰' },
    });
    // 辰 지장간: 乙(여기), 癸(중기), 戊(정기)
    // 월간 甲 → 辰 지장간에 甲 없음
    // 연간 丁 = 일간 → skip
    // 시간 甲 → 辰 지장간에 甲 없음
    // 미투출 → 본기 戊 → 丁 vs 戊 = 상관 → 상관격
    expect(r.type).toBe('상관격');
    expect(r.basis.method).toBe('본기');
  });
});
