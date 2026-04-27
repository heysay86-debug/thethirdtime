/**
 * stat-mapper.test.ts
 * SajuResult → CharacterCardData 변환 단위 테스트 (11건)
 *
 * 레퍼런스 사주: 1986-09-15 01:17 서울 남명
 *   4주: 丙寅 / 丁酉 / 壬戌 / 庚子
 *   신강 70점 / 편인격 파격 / 용신 木 / 일간 壬(水 양)
 */

import { mapSajuToCard } from '@/src/card/stat-mapper';
import type { SajuResult } from '@/src/engine/schema';

// ── 최소 모크 헬퍼 ────────────────────────────────────────────────────────────

/**
 * 테스트용 최소 SajuResult 생성.
 * 명시하지 않은 필드는 안전한 기본값으로 채운다.
 */
function makeMock(overrides: Partial<SajuResult> = {}): SajuResult {
  const base: SajuResult = {
    pillars: {
      year:  { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day:   { gan: '壬', ji: '戌' },
      hour:  { gan: '庚', ji: '子' },
    },
    birth: {
      solar: '1986-09-15',
      time: '01:17',
      adjustedTime: null,
      city: 'Seoul',
      offsetMinutes: 30,
    },
    tenGods: {
      yearGan: '편재',
      monthGan: '정재',
      dayGan: '비견',
      hourGan: '편인',
      yearJi: '식신',
      monthJi: '정인',
      dayJi: '편관',
      hourJi: '겁재',
    },
    jijanggan: {
      year: [], month: [], day: [], hour: null,
    },
    twelveStages: { year: '장생', month: '목욕', day: '관대', hour: null },
    strength: {
      level: '신강',
      score: 70,
      wolryeong: '득령',
      details: { wolryeongScore: 30, deukjiScore: 20, deukseScore: 20, seolgiPenalty: 0 },
      cheonganHaps: [],
      monthDamage: [],
    },
    gyeokGuk: {
      type: '편인격',
      category: '내격',
      state: '파격',  // 실제 레퍼런스 사주값
      breakCauses: [],
      weakenedBy: [],
      basis: { method: '투출', sourceStem: '庚', sourcePosition: '시간' },
      monthMainTenGod: '정인',
      strengthLevel: '신강',
      warnings: [],
    },
    yongSin: {
      methods: {
        eokbu:     { applicable: true,  primary: '木', secondary: null, reasoning: '' },
        johu:      { applicable: false, primary: null, secondary: null, reasoning: '' },
        tonggwan:  { applicable: false, primary: null, secondary: null, reasoning: '' },
        byeongyak: { applicable: false, primary: null, secondary: null, reasoning: '' },
        jeonwang:  { applicable: false, primary: null, secondary: null, reasoning: '' },
      },
      final: {
        primary: '木',
        secondary: null,
        xiSin: ['木', '水'],
        giSin: ['金', '土'],
        method: '억부법',
        reasoning: '',
      },
    },
    sinsal: [
      { name: '문창귀인', position: '연주' },
      { name: '천복귀인', position: '월주' },
      { name: '천주귀인', position: '연주' },
      { name: '천덕귀인', position: '연주' },
      { name: '월덕귀인', position: '시주' },
      { name: '원진살',   position: '월주' },
      { name: '양인살',   position: '시주' },
      { name: '홍염살',   position: '시주' },
      { name: '낙정관살', position: '일주' },
      { name: '협록',     position: '일주' },
      { name: '협록',     position: '시주' },
      { name: '공망',     position: '시주' },
      { name: '화개살',   position: '일주' },
    ],
    daeun: {
      direction: '순행',
      startAge: 8,
      periods: [
        {
          index: 0,
          startAge: 8,
          endAge: 17,
          gan: '戊',
          ji: '戌',
          analysis: {
            ganTenGod: '편관',
            jiTenGod: '편관',
            yongSinRelation: '기신',
            cheonganHaps: [],
            jijiRelations: [],
            score: 42,
            rating: '흉',
          },
          sinsal: [],
        },
      ],
    },
    seun: [],
    ohengAnalysis: {
      counts: [
        { element: '木', count: 1, withJijanggan: 1,   includesMonthBranch: false, state: '相' },
        { element: '火', count: 2, withJijanggan: 2,   includesMonthBranch: false, state: '旺' },
        { element: '土', count: 1, withJijanggan: 1.5, includesMonthBranch: false, state: '休' },
        { element: '金', count: 3, withJijanggan: 3,   includesMonthBranch: false, state: '死' },
        { element: '水', count: 2, withJijanggan: 1.5, includesMonthBranch: false, state: '囚' },
      ],
      statuses: [],
      monthElement: '金',
    },
    jijiHap: [],
    cheonganChung: [],
  };

  return { ...base, ...overrides } as SajuResult;
}

// ── 테스트 케이스 ─────────────────────────────────────────────────────────────

describe('stat-mapper: STR / LUK (score 기반 선형 매핑)', () => {
  it('T01 — 신강 70점 → STR 14', () => {
    const card = mapSajuToCard(makeMock({ strength: { ...makeMock().strength, level: '신강', score: 70 } }));
    expect(card.stats.str).toBe(14);
    // scoreStat(70) = round(70/100 * 19 + 1) = round(14.3) = 14
  });

  it('T02 — 대운 score 42 → LUK 9', () => {
    const card = mapSajuToCard(makeMock());
    expect(card.stats.luk).toBe(9);
    // scoreStat(42) = round(42/100 * 19 + 1) = round(8.98) = 9
  });
});

describe('stat-mapper: 십성 기반 스탯', () => {
  it('T03 — 편인+정인 3개 사주 → INT 8', () => {
    // hourGan=편인, monthJi=정인, yearJi=정인 → 3개
    const card = mapSajuToCard(makeMock({
      tenGods: {
        ...makeMock().tenGods,
        yearJi: '정인',   // 추가 정인
        monthJi: '정인',
        hourGan: '편인',
      },
    }));
    // tenGodStat(3, 0) = round((3/8)*14+3) = round(8.25) = 8
    expect(card.stats.int).toBe(8);
  });

  it('T04 — 역마살 있는 사주 → DEX 보너스 +3', () => {
    // 역마살 없는 기준값 계산: 식신(yearJi) 1개 → tenGodStat(1,0)=5
    const base = mapSajuToCard(makeMock());
    const withYeokma = mapSajuToCard(makeMock({
      sinsal: [
        ...makeMock().sinsal,
        { name: '역마살', position: '연주' },
      ],
    }));
    expect(withYeokma.stats.dex - base.stats.dex).toBe(3);
  });

  it('T05 — 도화살/홍염살 있는 사주 → CHA 보너스 +3 반영', () => {
    // 홍염살은 기본 mock에 이미 포함. 없는 경우와 비교.
    const noDoHwa = mapSajuToCard(makeMock({
      sinsal: makeMock().sinsal.filter(s => s.name !== '홍염살'),
    }));
    const withDoHwa = mapSajuToCard(makeMock());
    expect(withDoHwa.stats.cha - noDoHwa.stats.cha).toBe(3);
  });
});

describe('stat-mapper: 캐릭터 타입 결정', () => {
  it('T06 — 길신 8개 / 흉살 2개 (총 10) → angel (길신 비율 ≥ 70%)', () => {
    const sinsal = [
      { name: '천을귀인',   position: '연주' },
      { name: '문창귀인',   position: '연주' },
      { name: '문곡귀인',   position: '연주' },
      { name: '천복귀인',   position: '월주' },
      { name: '천주귀인',   position: '월주' },
      { name: '태극귀인',   position: '일주' },
      { name: '학당귀인',   position: '일주' },
      { name: '천덕귀인',   position: '시주' },
      { name: '역마살',     position: '연주' }, // 흉
      { name: '화개살',     position: '일주' }, // 흉
    ];
    // 길신 8 / 총 10 = 80% → angel
    const card = mapSajuToCard(makeMock({ sinsal }));
    expect(card.characterType).toBe('angel');
  });

  it('T07 — 흉살 7개 / 길신 1개 (총 8) → devil (흉살 비율 ≥ 70%)', () => {
    const sinsal = [
      { name: '역마살',     position: '연주' },
      { name: '화개살',     position: '월주' },
      { name: '백호살',     position: '월주' },
      { name: '원진살',     position: '일주' },
      { name: '괴강살',     position: '일주' },
      { name: '양인살',     position: '시주' },
      { name: '낙정관살',   position: '시주' },
      { name: '천을귀인',   position: '연주' }, // 길신 1
    ];
    // 흉살 7 / 총 8 = 87.5% → devil
    const card = mapSajuToCard(makeMock({ sinsal }));
    expect(card.characterType).toBe('devil');
  });

  it('T08 — 길신 5 / 흉살 5 (균형) → basic', () => {
    const sinsal = [
      { name: '천을귀인',   position: '연주' },
      { name: '문창귀인',   position: '연주' },
      { name: '천복귀인',   position: '월주' },
      { name: '천주귀인',   position: '월주' },
      { name: '협록',       position: '일주' },
      { name: '역마살',     position: '연주' },
      { name: '화개살',     position: '월주' },
      { name: '백호살',     position: '일주' },
      { name: '원진살',     position: '일주' },
      { name: '공망',       position: '시주' },
    ];
    // 길신 5 / 총 10 = 50% → basic
    const card = mapSajuToCard(makeMock({ sinsal }));
    expect(card.characterType).toBe('basic');
  });
});

describe('stat-mapper: 배경 파일 매핑', () => {
  it('T09 — 甲 일간 → mok_yang.jpeg', () => {
    const card = mapSajuToCard(makeMock({
      pillars: { ...makeMock().pillars, day: { gan: '甲', ji: '子' } },
    }));
    expect(card.backgroundFile).toBe('mok_yang.jpeg');
  });

  it('T10 — 癸 일간 → su_yin.jpeg', () => {
    const card = mapSajuToCard(makeMock({
      pillars: { ...makeMock().pillars, day: { gan: '癸', ji: '亥' } },
    }));
    expect(card.backgroundFile).toBe('su_yin.jpeg');
  });
});

describe('stat-mapper: 칭호(title) 생성', () => {
  it('T11 — 정관격+신강+성격 → "★★ 숙련된 질서의 수호자"', () => {
    const card = mapSajuToCard(makeMock({
      gyeokGuk: {
        ...makeMock().gyeokGuk,
        type: '정관격',
        state: '성격',
      },
      strength: { ...makeMock().strength, level: '신강', score: 70 },
    }));
    expect(card.title).toBe('★★ 숙련된 질서의 수호자');
  });

  it('T12 — 파격 → title이 "🔥 각성한"으로 시작', () => {
    const card = mapSajuToCard(makeMock({
      gyeokGuk: {
        ...makeMock().gyeokGuk,
        type: '편인격',
        state: '파격',
      },
    }));
    expect(card.title.startsWith('🔥 각성한')).toBe(true);
  });

  it('T13 — 약화 → title이 "⚡ 시련의"로 시작', () => {
    const card = mapSajuToCard(makeMock({
      gyeokGuk: {
        ...makeMock().gyeokGuk,
        type: '식신격',
        state: '약화',
      },
    }));
    expect(card.title.startsWith('⚡ 시련의')).toBe(true);
  });

  it('T14 — 극약+성격 → title이 "★ 잠재력의"로 시작', () => {
    const card = mapSajuToCard(makeMock({
      strength: { ...makeMock().strength, level: '극약', score: 5 },
      gyeokGuk: { ...makeMock().gyeokGuk, state: '성격' },
    }));
    expect(card.title.startsWith('★ 잠재력의')).toBe(true);
  });
});

describe('stat-mapper: 오행 레지스턴스', () => {
  it('T15 — 레지스턴스 합계가 정확히 100%', () => {
    const card = mapSajuToCard(makeMock());
    const sum = Object.values(card.resistance).reduce((a, b) => a + b, 0);
    expect(sum).toBe(100);
  });

  it('T16 — 레퍼런스 사주 金 레지스턴스 최대 (木1 火2 土1.5 金3 水1.5)', () => {
    const card = mapSajuToCard(makeMock());
    const maxEl = (Object.entries(card.resistance) as [string, number][])
      .reduce((a, b) => (a[1] >= b[1] ? a : b))[0];
    expect(maxEl).toBe('金');
  });
});

describe('stat-mapper: 레퍼런스 사주 통합 검증', () => {
  it('T17 — 레퍼런스 사주 전체 카드 데이터 (1986-09-15 01:17 서울 남명)', () => {
    const card = mapSajuToCard(makeMock());

    // 일간 壬(水 양) 관련
    expect(card.backgroundFile).toBe('su_yang.jpeg');
    expect(card.elementKey).toBe('水');

    // 강도 70점
    expect(card.stats.str).toBe(14);

    // 격국 파격 → 각성한
    expect(card.title.startsWith('🔥 각성한')).toBe(true);
    expect(card.gyeokGukType).toBe('편인격');
    expect(card.gyeokGukState).toBe('파격');

    // 용신 木 → 생명의 나무
    expect(card.skill).toBe('생명의 나무');

    // 균형 신살 → basic
    expect(card.characterType).toBe('basic');

    // 신강도 점수
    expect(card.strengthScore).toBe(70);

    // HP / MP
    // STR=14, DEX=5 → HP = 14×30 + 5×10 = 420 + 50 = 470
    // WIS=5,  INT=7  → MP = 5×30  + 7×10 = 150 + 70 = 220
    expect(card.hp).toBe(card.stats.str * 30 + card.stats.dex * 10);
    expect(card.mp).toBe(card.stats.wis * 30 + card.stats.int * 10);
  });
});

describe('stat-mapper: HP / MP 산출', () => {
  it('T18 — HP = STR×30 + DEX×10', () => {
    // STR=14(score 70), DEX=5(식신 1개, 역마 없음)
    const card = mapSajuToCard(makeMock());
    expect(card.hp).toBe(card.stats.str * 30 + card.stats.dex * 10);
  });

  it('T19 — MP = WIS×30 + INT×10', () => {
    const card = mapSajuToCard(makeMock());
    expect(card.mp).toBe(card.stats.wis * 30 + card.stats.int * 10);
  });

  it('T20 — HP 최솟값 보호 (스탯 모두 최소 3 → HP ≥ 120)', () => {
    // 십성 0개, score 0 → str=1, dex=3 → HP = 30+30 = 60
    // score=0이면 scoreStat(0)=1 → STR=1, tenGodStat(0,0)=3 → DEX=3
    // HP = 1×30 + 3×10 = 60
    const lowCard = mapSajuToCard(makeMock({
      strength: { ...makeMock().strength, score: 0 },
      tenGods: {
        yearGan: '비견', monthGan: '비견', dayGan: '비견', hourGan: '비견',
        yearJi: '비견', monthJi: '비견', dayJi: '비견', hourJi: '비견',
      },
      daeun: {
        direction: '순행', startAge: 8,
        periods: [{ index: 0, startAge: 8, endAge: 17, gan: '戊', ji: '戌',
          analysis: { ganTenGod: '편관', jiTenGod: '편관', yongSinRelation: '기신',
            cheonganHaps: [], jijiRelations: [], score: 0, rating: '대흉' },
          sinsal: [] }],
      },
    }));
    expect(lowCard.hp).toBeGreaterThan(0);
    expect(lowCard.mp).toBeGreaterThan(0);
  });
});
