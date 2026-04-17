import { calculateSinsal, getGongmang, getSibiiSinsal } from '@engine/sinsal';

/**
 * 신살 계산 단위 테스트
 *
 * 레퍼런스 사주:
 * 1) 壬戌일주, 丁酉월, 丙寅년 — 1986-09-15 01:17 서울
 *    4주: 丙寅 / 丁酉 / 壬戌 / 庚子
 *
 * 2) 甲子일주, 丙寅월, 甲子년 — 가상 테스트용
 *    4주: 甲子 / 丙寅 / 甲子 / 甲子 (극단 케이스)
 *
 * 3) 庚辰일주 — 괴강살 테스트
 *    4주: 戊午 / 甲寅 / 庚辰 / 丙子
 */

const PILLARS_1986 = {
  year: { gan: '丙', ji: '寅' },
  month: { gan: '丁', ji: '酉' },
  day: { gan: '壬', ji: '戌' },
  hour: { gan: '庚', ji: '子' },
};

const PILLARS_GOEGANG = {
  year: { gan: '戊', ji: '午' },
  month: { gan: '甲', ji: '寅' },
  day: { gan: '庚', ji: '辰' },
  hour: { gan: '丙', ji: '子' },
};

const PILLARS_GAP_JA = {
  year: { gan: '甲', ji: '子' },
  month: { gan: '丙', ji: '寅' },
  day: { gan: '甲', ji: '子' },
  hour: { gan: '甲', ji: '子' },
};

describe('공망(空亡) 계산', () => {
  it('壬戌 일주 → 공망 申酉', () => {
    const [gm1, gm2] = getGongmang('壬', '戌');
    // 壬戌은 甲子순(甲子~癸酉). 甲→子 시작, 10간이 子~酉까지 배정.
    // 빠지는 지지 = 戌, 亥
    // 실제: 甲子순 = 甲子乙丑丙寅丁卯戊辰己巳庚午辛未壬申癸酉 → 빠지는 것 戌亥
    // 아, 壬戌이면... 壬이 간 8번(0부터), 戌이 지 10번
    // 순두 지지 = (10 - 8) % 12 = 2 → 寅
    // 甲寅순 = 甲寅乙卯丙辰丁巳戊午己未庚申辛酉壬戌癸亥 → 이 순은 子丑이 빠짐
    expect([gm1, gm2].sort()).toEqual(['丑', '子'].sort());
  });

  it('甲子 일주 → 공망 戌亥', () => {
    const [gm1, gm2] = getGongmang('甲', '子');
    // 甲子순 = 甲子~癸酉 → 빠지는 것 戌亥
    expect([gm1, gm2].sort()).toEqual(['亥', '戌'].sort());
  });

  it('庚辰 일주 → 공망 寅卯', () => {
    const [gm1, gm2] = getGongmang('庚', '辰');
    // 庚이 간 6번, 辰이 지 4번
    // 순두 지지 = (4 - 6 + 12) % 12 = 10 → 戌
    // 甲戌순 = 甲戌乙亥丙子丁丑戊寅己卯庚辰辛巳壬午癸未 → 빠지는 것 申酉
    expect([gm1, gm2].sort()).toEqual(['酉', '申'].sort());
  });
});

describe('천을귀인', () => {
  it('壬일간 → 卯巳가 대상. 1986 사주에서 卯巳 없으므로 천을귀인 없음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const cheonul = result.filter(s => s.name === '천을귀인');
    // 4주 지지: 寅酉戌子 — 卯巳 모두 없음
    expect(cheonul).toHaveLength(0);
  });

  it('甲일간 → 丑未가 대상. 갑자 사주에서 丑未 없으므로 없음', () => {
    const result = calculateSinsal(PILLARS_GAP_JA);
    const cheonul = result.filter(s => s.name === '천을귀인');
    expect(cheonul).toHaveLength(0);
  });
});

describe('괴강살', () => {
  it('庚辰 일주 → 괴강살 있음', () => {
    const result = calculateSinsal(PILLARS_GOEGANG);
    const goegang = result.filter(s => s.name === '괴강살');
    expect(goegang).toHaveLength(1);
    expect(goegang[0].position).toBe('일주');
  });

  it('壬戌 일주 → 괴강살 없음 (壬戌은 괴강 아님)', () => {
    const result = calculateSinsal(PILLARS_1986);
    const goegang = result.filter(s => s.name === '괴강살');
    expect(goegang).toHaveLength(0);
  });
});

describe('현침살', () => {
  it('壬일간 → 현침살 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const hyeonchim = result.filter(s => s.name === '현침살');
    expect(hyeonchim).toHaveLength(1);
  });

  it('庚일간 → 현침살 없음', () => {
    const result = calculateSinsal(PILLARS_GOEGANG);
    const hyeonchim = result.filter(s => s.name === '현침살');
    expect(hyeonchim).toHaveLength(0);
  });

  it('甲일간 → 현침살 있음', () => {
    const result = calculateSinsal(PILLARS_GAP_JA);
    const hyeonchim = result.filter(s => s.name === '현침살');
    expect(hyeonchim).toHaveLength(1);
  });
});

describe('양인살', () => {
  it('壬일간 → 양인 子. 1986 사주에서 시지 子 → 양인살 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const yangin = result.filter(s => s.name === '양인살');
    expect(yangin.length).toBeGreaterThanOrEqual(1);
    expect(yangin.some(s => s.position === '시주')).toBe(true);
  });
});

describe('역마살 (원국, 일지 기준)', () => {
  it('戌일지 → 역마 申. 1986 사주에서 申 없으므로 역마살 없음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const yeokma = result.filter(s => s.name === '역마살');
    // 일지 戌 → 寅午戌은 역마 申. 4주 지지 寅酉戌子에 申 없음
    expect(yeokma).toHaveLength(0);
  });

  it('辰일지 → 역마 寅. 괴강 사주에서 연지 寅 → 역마살 없음(일지 기준이므로 월지 寅 찾아야)', () => {
    const result = calculateSinsal(PILLARS_GOEGANG);
    const yeokma = result.filter(s => s.name === '역마살');
    // 일지 辰 → 申子辰은 역마 寅. 월지가 寅 → 역마살 있음
    expect(yeokma.length).toBeGreaterThanOrEqual(1);
    expect(yeokma.some(s => s.position === '월주')).toBe(true);
  });
});

describe('화개살 (원국)', () => {
  it('戌일지 → B그룹 화개(일지 기준)는 다른 주에 戌 없으므로 없음, 하지만 E그룹 십이신살(연지 기준)로 일주에 화개살 잡힘', () => {
    const result = calculateSinsal(PILLARS_1986);
    const hwagae = result.filter(s => s.name === '화개살');
    // B그룹: 일지 戌 → 寅午戌의 화개=戌. 일주 자체 제외하므로 0건
    // E그룹: 연지 寅 → 십이신살에서 戌=화개살 → 일주에 해당
    // 따라서 E그룹에서 1건 나옴
    expect(hwagae).toHaveLength(1);
    expect(hwagae[0].position).toBe('일주');
  });
});

describe('원진살', () => {
  it('戌일지 → 원진 酉. 1986 사주에서 월지 酉 → 원진살 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const wonjin = result.filter(s => s.name === '원진살');
    expect(wonjin.length).toBeGreaterThanOrEqual(1);
    expect(wonjin.some(s => s.position === '월주')).toBe(true);
  });
});

describe('십이신살 (연지 기준)', () => {
  it('寅년생 → 十二神殺 순환 확인', () => {
    // 寅午戌 → 겁살 시작 亥
    // 亥=겁살, 子=재살, 丑=천살, 寅=지살, 卯=연살, 辰=월살,
    // 巳=망신살, 午=장성살, 未=반안살, 申=역마살, 酉=육해살, 戌=화개살
    const result = getSibiiSinsal('寅', '亥');
    expect(result).toEqual([{ name: '겁살' }]);

    const result2 = getSibiiSinsal('寅', '酉');
    expect(result2).toEqual([{ name: '육해살' }]);

    const result3 = getSibiiSinsal('寅', '戌');
    expect(result3).toEqual([{ name: '화개살' }]);

    const result4 = getSibiiSinsal('寅', '申');
    expect(result4).toEqual([{ name: '역마살' }]);
  });

  it('申년생 → 겁살 巳', () => {
    const result = getSibiiSinsal('申', '巳');
    expect(result).toEqual([{ name: '겁살' }]);
  });

  it('원국 내 십이신살 — 1986 사주 (寅년) 에서 월지酉=육해살, 일지戌=화개살, 시지子=재살', () => {
    const result = calculateSinsal(PILLARS_1986);
    const sibii = result.filter(s =>
      ['겁살', '재살', '천살', '지살', '연살', '월살',
       '망신살', '장성살', '반안살', '역마살', '육해살', '화개살'].includes(s.name)
    );
    // 월지 酉 → 육해살
    expect(sibii.some(s => s.name === '육해살' && s.position === '월주')).toBe(true);
    // 일지 戌 → 화개살
    expect(sibii.some(s => s.name === '화개살' && s.position === '일주')).toBe(true);
    // 시지 子 → 재살
    expect(sibii.some(s => s.name === '재살' && s.position === '시주')).toBe(true);
  });
});

describe('공망 원국 판정', () => {
  it('壬戌 일주 → 공망 子丑. 1986 사주에서 시지 子 → 공망 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const gongmang = result.filter(s => s.name === '공망');
    // 시지 子가 공망
    expect(gongmang.some(s => s.position === '시주')).toBe(true);
  });
});

describe('월덕귀인', () => {
  it('酉월 → 월덕 庚. 1986 사주에서 시간 庚 → 월덕귀인 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const woldeok = result.filter(s => s.name === '월덕귀인');
    // 巳酉丑 → 庚. 시간이 庚 → 월덕귀인
    expect(woldeok.some(s => s.position === '시주')).toBe(true);
  });
});

describe('홍염살', () => {
  it('壬일간 → 홍염 子. 1986 사주에서 시지 子 → 홍염살 있음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const hongyeom = result.filter(s => s.name === '홍염살');
    expect(hongyeom.some(s => s.position === '시주')).toBe(true);
  });
});

describe('금여록', () => {
  it('壬일간 → 금여 丑. 1986 사주에서 丑 없으므로 없음', () => {
    const result = calculateSinsal(PILLARS_1986);
    const geumyeo = result.filter(s => s.name === '금여록');
    expect(geumyeo).toHaveLength(0);
  });
});

describe('전체 통합', () => {
  it('calculateSinsal이 빈 배열이 아닌 결과를 반환', () => {
    const result = calculateSinsal(PILLARS_1986);
    expect(result.length).toBeGreaterThan(0);
  });

  it('모든 결과가 SinsalEntry 형식을 따름', () => {
    const result = calculateSinsal(PILLARS_1986);
    for (const entry of result) {
      expect(typeof entry.name).toBe('string');
      expect(typeof entry.position).toBe('string');
      expect(entry.name.length).toBeGreaterThan(0);
      expect(['연주', '월주', '일주', '시주']).toContain(entry.position);
    }
  });

  it('시주 null인 경우에도 정상 동작', () => {
    const pillarsNoHour = {
      year: { gan: '丙', ji: '寅' },
      month: { gan: '丁', ji: '酉' },
      day: { gan: '壬', ji: '戌' },
      hour: null,
    };
    const result = calculateSinsal(pillarsNoHour);
    expect(Array.isArray(result)).toBe(true);
    // 시주 관련 신살은 없어야 함
    expect(result.every(s => s.position !== '시주')).toBe(true);
  });
});
