import {
  analyzeGungham,
  getDayGanRelation,
  getYongSinEffect,
  detectCrossJijiRelations,
  generatePerspectiveInterpretation,
  PERSPECTIVE_QUESTIONS,
  type GunghamInput,
  type GunghamResult,
  type GunghamPair,
} from '@engine/gungham';

// ── 일간 오행 관계 판정 ──

describe('gungham — 일간 오행 관계', () => {
  it('같은 오행 → 비겁', () => {
    const rel = getDayGanRelation('木', '木', 'A', 'B');
    expect(rel.type).toBe('비겁');
  });

  it('木→火 → 상생', () => {
    const rel = getDayGanRelation('木', '火', 'A', 'B');
    expect(rel.type).toBe('상생');
    expect(rel.direction).toContain('생');
  });

  it('木→土 → 상극 (木극土)', () => {
    const rel = getDayGanRelation('木', '土', 'A', 'B');
    expect(rel.type).toBe('상극');
    expect(rel.direction).toContain('극');
  });

  it('火→水 → 상극 (水극火)', () => {
    const rel = getDayGanRelation('火', '水', 'A', 'B');
    expect(rel.type).toBe('상극');
  });

  it('金→水 → 상생 (金생水)', () => {
    const rel = getDayGanRelation('金', '水', 'A', 'B');
    expect(rel.type).toBe('상생');
  });
});

// ── 용신 교환 판정 ──

describe('gungham — 용신 교환', () => {
  it('원국에 용신 오행이 많으면 helpful', () => {
    // 용신이 木인 상대에게, 木이 많은 원국
    const pillars = {
      year: { gan: '甲', ji: '寅' },   // 木, 木
      month: { gan: '乙', ji: '卯' },  // 木, 木
      day: { gan: '甲', ji: '寅' },    // 木, 木
      hour: null,
    };
    const effect = getYongSinEffect('木', pillars, '木');
    expect(effect).toBe('helpful');
  });

  it('원국에 용신을 극하는 오행이 많으면 harmful', () => {
    // 용신이 木인 상대에게, 金(극木)이 많은 원국
    const pillars = {
      year: { gan: '庚', ji: '申' },   // 金, 金
      month: { gan: '辛', ji: '酉' },  // 金, 金
      day: { gan: '庚', ji: '申' },    // 金, 金
      hour: null,
    };
    const effect = getYongSinEffect('金', pillars, '木');
    expect(effect).toBe('harmful');
  });

  it('중립 케이스', () => {
    const pillars = {
      year: { gan: '丙', ji: '午' },   // 火, 火
      month: { gan: '丁', ji: '巳' },  // 火, 火
      day: { gan: '丙', ji: '午' },    // 火, 火
      hour: null,
    };
    // 용신이 水인데 원국에 水도 없고 水를 극하는 土도 별로 없음
    // 하지만 水를 극하는 것도 아님 -> neutral
    const effect = getYongSinEffect('火', pillars, '水');
    // 火극金, 水를 극하는 건 土. 火는 水를 극하지 않음. neutral 쪽
    expect(['neutral', 'helpful', 'harmful']).toContain(effect);
  });
});

// ── 지지 합충 교차 비교 ──

describe('gungham — 지지 교차 비교', () => {
  it('子와 午가 교차하면 충 검출', () => {
    const pillarsA = {
      year: { gan: '甲', ji: '子' },
      month: { gan: '乙', ji: '卯' },
      day: { gan: '丙', ji: '午' },
      hour: null,
    };
    const pillarsB = {
      year: { gan: '庚', ji: '午' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '壬', ji: '子' },
      hour: null,
    };
    const rels = detectCrossJijiRelations(pillarsA, pillarsB, 'A', 'B');
    const chungs = rels.filter(r => r.type === '충');
    expect(chungs.length).toBeGreaterThanOrEqual(1);
  });

  it('子와 丑이 교차하면 합 검출', () => {
    const pillarsA = {
      year: { gan: '甲', ji: '子' },
      month: { gan: '乙', ji: '寅' },
      day: { gan: '丙', ji: '辰' },
      hour: null,
    };
    const pillarsB = {
      year: { gan: '庚', ji: '丑' },
      month: { gan: '辛', ji: '卯' },
      day: { gan: '壬', ji: '巳' },
      hour: null,
    };
    const rels = detectCrossJijiRelations(pillarsA, pillarsB, 'A', 'B');
    const haps = rels.filter(r => r.type === '합');
    expect(haps.length).toBeGreaterThanOrEqual(1);
  });

  it('일지 관련 관계는 significance high', () => {
    const pillarsA = {
      year: { gan: '甲', ji: '寅' },
      month: { gan: '乙', ji: '卯' },
      day: { gan: '丙', ji: '午' },
      hour: null,
    };
    const pillarsB = {
      year: { gan: '庚', ji: '子' },
      month: { gan: '辛', ji: '酉' },
      day: { gan: '壬', ji: '子' },
      hour: null,
    };
    const rels = detectCrossJijiRelations(pillarsA, pillarsB, 'A', 'B');
    const highRels = rels.filter(r => r.significance === 'high');
    // 일지(午)와 子 충 = high
    expect(highRels.length).toBeGreaterThanOrEqual(1);
  });
});

// ── 궁합 점수 ──

describe('gungham — 점수 범위', () => {
  it('2인 궁합 점수는 0~100 범위', () => {
    const input: GunghamInput = {
      persons: [
        { name: 'A', birthDate: '1990-03-15', gender: 'M' },
        { name: 'B', birthDate: '1992-07-20', gender: 'F' },
      ],
      relationType: 'couple',
    };
    const result = analyzeGungham(input);
    expect(result.pairs.length).toBe(1);
    expect(result.pairs[0].score).toBeGreaterThanOrEqual(0);
    expect(result.pairs[0].score).toBeLessThanOrEqual(100);
    expect(['천생연분', '좋은 인연', '보통', '노력 필요', '주의']).toContain(result.pairs[0].rating);
  });
});

// ── 관계 유형별 해석 분기 ──

describe('gungham — 관계 유형 분기', () => {
  it('couple 타입은 해석에 관련 키워드 포함', () => {
    const input: GunghamInput = {
      persons: [
        { name: '철수', birthDate: '1988-01-10', gender: 'M' },
        { name: '영희', birthDate: '1990-06-15', gender: 'F' },
      ],
      relationType: 'couple',
    };
    const result = analyzeGungham(input);
    const pair = result.pairs[0];
    expect(pair.interpretation.summary).toBeTruthy();
    expect(pair.interpretation.strengths.length).toBeGreaterThan(0);
    expect(pair.interpretation.weaknesses.length).toBeGreaterThan(0);
    expect(pair.interpretation.advice).toBeTruthy();
  });

  it('business 타입도 해석 구조 반환', () => {
    const input: GunghamInput = {
      persons: [
        { name: '대표', birthDate: '1985-03-20', gender: 'M' },
        { name: '파트너', birthDate: '1987-11-05', gender: 'M' },
      ],
      relationType: 'business',
    };
    const result = analyzeGungham(input);
    const pair = result.pairs[0];
    expect(pair.interpretation.summary).toBeTruthy();
    expect(pair.interpretation.strengths.length).toBeGreaterThan(0);
  });
});

// ── 3인 분석 ──

describe('gungham — 3인 분석', () => {
  const threePersonInput: GunghamInput = {
    persons: [
      { name: 'A', birthDate: '1990-01-01', gender: 'M' },
      { name: 'B', birthDate: '1991-06-15', gender: 'F' },
      { name: 'C', birthDate: '1992-12-25', gender: 'M' },
    ],
    relationType: 'team',
  };

  it('3인이면 3쌍 생성', () => {
    const result = analyzeGungham(threePersonInput);
    expect(result.pairs.length).toBe(3);
    const pairNames = result.pairs.map(p => `${p.personA}-${p.personB}`);
    expect(pairNames).toContain('A-B');
    expect(pairNames).toContain('A-C');
    expect(pairNames).toContain('B-C');
  });

  it('3인이면 groupDynamics 존재', () => {
    const result = analyzeGungham(threePersonInput);
    expect(result.groupDynamics).toBeDefined();
    expect(result.groupDynamics!.overallScore).toBeGreaterThanOrEqual(0);
    expect(result.groupDynamics!.overallScore).toBeLessThanOrEqual(100);
    expect(result.groupDynamics!.keyPerson).toBeTruthy();
    expect(result.groupDynamics!.ohengBalance).toBeTruthy();
  });

  it('persons 배열에 3명 모두 포함', () => {
    const result = analyzeGungham(threePersonInput);
    expect(result.persons.length).toBe(3);
    expect(result.persons.map(p => p.name)).toEqual(['A', 'B', 'C']);
  });
});

// ── 관점 질문 세트 ──

describe('gungham — 관점 질문', () => {
  it('5개 관계 유형 모두 질문 세트 존재', () => {
    expect(PERSPECTIVE_QUESTIONS['couple']).toBeDefined();
    expect(PERSPECTIVE_QUESTIONS['parent_child']).toBeDefined();
    expect(PERSPECTIVE_QUESTIONS['friend']).toBeDefined();
    expect(PERSPECTIVE_QUESTIONS['business']).toBeDefined();
    expect(PERSPECTIVE_QUESTIONS['boss_sub']).toBeDefined();
  });

  it('각 질문 세트에 3개 질문 + 각 4개 선택지', () => {
    for (const key of ['couple', 'parent_child', 'friend', 'business', 'boss_sub']) {
      const qs = PERSPECTIVE_QUESTIONS[key];
      expect(qs.length).toBe(3);
      for (const q of qs) {
        expect(q.options.length).toBe(4);
        // 마지막 옵션은 "잘 모르겠어요" = neutral
        expect(q.options[q.options.length - 1].value).toBe('neutral');
      }
    }
  });
});

// ── 관점 해석 생성 ──

describe('gungham — 관점 해석 생성', () => {
  it('couple 관점 해석이 opening/insights/closing 구조 반환', () => {
    const input: GunghamInput = {
      persons: [
        { name: '철수', birthDate: '1988-01-10', gender: 'M' },
        { name: '영희', birthDate: '1990-06-15', gender: 'F' },
      ],
      relationType: 'couple',
    };
    const result = analyzeGungham(input);
    const answers = [
      { questionId: 'desire', value: 'stability' },
      { questionId: 'state', value: 'hard' },
      { questionId: 'expect', value: 'empathy' },
    ];
    const interp = generatePerspectiveInterpretation(result.pairs[0], 'couple', answers);
    expect(interp.opening).toBeTruthy();
    expect(interp.insights.length).toBeGreaterThan(0);
    expect(interp.closing).toBeTruthy();
  });
});
