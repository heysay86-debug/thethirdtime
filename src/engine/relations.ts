/**
 * 천간 합(5합) · 지지 형충파해합 검출 유틸리티
 */

// ── 천간 충(天干沖) ──
// 양간끼리, 음간끼리 충. 戊己(토)는 중재 역할이므로 충 없음.

const CHEONGAN_CHUNG_PAIRS: [string, string][] = [
  ['甲', '庚'], // 갑경충
  ['乙', '辛'], // 을신충
  ['丙', '壬'], // 병임충
  ['丁', '癸'], // 정계충
];

export interface CheonganChungInfo {
  stem1: string;
  stem2: string;
  position1: string;
  position2: string;
}

export function detectCheonganChung(
  pillars: {
    year: { gan: string };
    month: { gan: string };
    day: { gan: string };
    hour: { gan: string } | null;
  },
): CheonganChungInfo[] {
  const gans: { stem: string; pos: string }[] = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
    { stem: pillars.day.gan, pos: '일간' },
  ];
  if (pillars.hour) gans.push({ stem: pillars.hour.gan, pos: '시간' });

  const results: CheonganChungInfo[] = [];
  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const match = CHEONGAN_CHUNG_PAIRS.find(
        ([a, b]) => (gans[i].stem === a && gans[j].stem === b) || (gans[i].stem === b && gans[j].stem === a)
      );
      if (match) {
        results.push({
          stem1: gans[i].stem, stem2: gans[j].stem,
          position1: gans[i].pos, position2: gans[j].pos,
        });
      }
    }
  }
  return results;
}

// ── 천간 5합 ──

/** 천간합 짝 */
const CHEONGAN_HAP_PAIRS: [string, string, string][] = [
  ['甲', '己', '土'],
  ['乙', '庚', '金'],
  ['丙', '辛', '水'],
  ['丁', '壬', '木'],
  ['戊', '癸', '火'],
];

export interface CheonganHapInfo {
  stem1: string;
  stem2: string;
  position1: string;
  position2: string;
  hwaElement: string;
}

/**
 * 4주 천간에서 천간합(5합)을 검출한다.
 * 인접한 천간뿐 아니라 모든 조합을 검사한다.
 */
export function detectCheonganHap(
  pillars: {
    year: { gan: string };
    month: { gan: string };
    day: { gan: string };
    hour: { gan: string } | null;
  },
): CheonganHapInfo[] {
  const gans: { stem: string; pos: string }[] = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
    { stem: pillars.day.gan, pos: '일간' },
  ];
  if (pillars.hour) gans.push({ stem: pillars.hour.gan, pos: '시간' });

  const results: CheonganHapInfo[] = [];

  for (let i = 0; i < gans.length; i++) {
    for (let j = i + 1; j < gans.length; j++) {
      const pair = CHEONGAN_HAP_PAIRS.find(
        ([a, b]) => (gans[i].stem === a && gans[j].stem === b) ||
                    (gans[i].stem === b && gans[j].stem === a)
      );
      if (pair) {
        results.push({
          stem1: gans[i].stem,
          stem2: gans[j].stem,
          position1: gans[i].pos,
          position2: gans[j].pos,
          hwaElement: pair[2],
        });
      }
    }
  }

  return results;
}

/**
 * 특정 천간이 합거(合去) 상태인지 확인한다.
 * 합거 = 다른 천간과 합하여 묶여 본래 기능이 약화/소실됨
 */
export function isHapgeo(stem: string, position: string, haps: CheonganHapInfo[]): boolean {
  return haps.some(h =>
    (h.stem1 === stem && h.position1 === position) ||
    (h.stem2 === stem && h.position2 === position)
  );
}

// ── 지지 충(冲) ──

const JIJI_CHUNG_PAIRS: [string, string][] = [
  ['子', '午'], ['丑', '未'], ['��', '申'], ['卯', '��'], ['辰', '戌'], ['巳', '亥'],
];

export interface JijiRelation {
  type: '충' | '형' | '해' | '파' | '합';
  ji1: string;
  ji2: string;
  position1: string;
  position2: string;
}

// ── 지지 형(刑) ──

const JIJI_HYEONG_PAIRS: [string, string][] = [
  // 삼형
  ['寅', '巳'], ['巳', '申'], ['寅', '申'],
  // 무례지형
  ['丑', '戌'], ['戌', '未'], ['丑', '未'],
  // 자형
  ['辰', '辰'], ['午', '午'], ['酉', '酉'], ['亥', '亥'],
  // 무은지형
  ['子', '��'], ['卯', '子'],
];

// ── 지지 해(害) ──

const JIJI_HAE_PAIRS: [string, string][] = [
  ['子', '未'], ['丑', '午'], ['���', '巳'], ['卯', '辰'], ['申', '亥'], ['酉', '戌'],
];

// ── 지지 파(破) ──

const JIJI_PA_PAIRS: [string, string][] = [
  ['子', '酉'], ['丑', '辰'], ['寅', '亥'], ['卯', '午'], ['巳', '申'], ['未', '戌'],
];

// ── 지지 육합(六合) ──

type Element = '木' | '火' | '土' | '金' | '水';

const JIJI_YUKHAP_PAIRS: [string, string, Element][] = [
  ['子', '丑', '水'],
  ['寅', '亥', '木'],
  ['卯', '戌', '火'],
  ['辰', '酉', '金'],
  ['巳', '申', '水'],
  ['午', '未', '火'],
];

// ── 지지 삼합(三合) ──

const JIJI_SAMHAP: [string, string, string, Element][] = [
  ['亥', '卯', '未', '木'],
  ['寅', '午', '戌', '火'],
  ['巳', '酉', '丑', '金'],
  ['申', '子', '辰', '水'],
];

// ── 지지 방합(方合) ──

const JIJI_BANGHAP: [string, string, string, Element][] = [
  ['寅', '卯', '辰', '木'],
  ['巳', '午', '未', '火'],
  ['申', '酉', '戌', '金'],
  ['亥', '子', '丑', '水'],
];

export interface JijiHapInfo {
  type: '육합' | '삼합' | '방합' | '반합';
  branches: string[];
  positions: string[];
  hwaElement: '木' | '火' | '土' | '金' | '水';
}

/**
 * 4주 지지에서 합(육합·삼합·방합·반합)을 검출한다.
 */
export function detectJijiHap(
  pillars: {
    year: { ji: string };
    month: { ji: string };
    day: { ji: string };
    hour: { ji: string } | null;
  },
): JijiHapInfo[] {
  const jis: { ji: string; pos: string }[] = [
    { ji: pillars.year.ji, pos: '연지' },
    { ji: pillars.month.ji, pos: '월지' },
    { ji: pillars.day.ji, pos: '일지' },
  ];
  if (pillars.hour) jis.push({ ji: pillars.hour.ji, pos: '시지' });

  const results: JijiHapInfo[] = [];
  const jiSet = jis.map(j => j.ji);

  // 육합 (2글자)
  for (let i = 0; i < jis.length; i++) {
    for (let j = i + 1; j < jis.length; j++) {
      for (const [a, b, hwa] of JIJI_YUKHAP_PAIRS) {
        if ((jis[i].ji === a && jis[j].ji === b) || (jis[i].ji === b && jis[j].ji === a)) {
          results.push({
            type: '육합',
            branches: [jis[i].ji, jis[j].ji],
            positions: [jis[i].pos, jis[j].pos],
            hwaElement: hwa,
          });
        }
      }
    }
  }

  // 삼합 (3글자)
  for (const [saeng, wang, go, hwa] of JIJI_SAMHAP) {
    const found = [saeng, wang, go].map(target => jis.find(j => j.ji === target));
    if (found.every(f => f)) {
      results.push({
        type: '삼합',
        branches: [saeng, wang, go],
        positions: found.map(f => f!.pos),
        hwaElement: hwa,
      });
    }
  }

  // 반합 (삼합에서 2글자, 왕지 포함)
  if (!results.some(r => r.type === '삼합')) {
    for (const [saeng, wang, go, hwa] of JIJI_SAMHAP) {
      const saengFound = jis.find(j => j.ji === saeng);
      const wangFound = jis.find(j => j.ji === wang);
      const goFound = jis.find(j => j.ji === go);

      if (wangFound && saengFound && !goFound) {
        results.push({
          type: '반합',
          branches: [saeng, wang],
          positions: [saengFound.pos, wangFound.pos],
          hwaElement: hwa,
        });
      }
      if (wangFound && goFound && !saengFound) {
        results.push({
          type: '반합',
          branches: [wang, go],
          positions: [wangFound.pos, goFound.pos],
          hwaElement: hwa,
        });
      }
    }
  }

  // 방합 (3글자)
  for (const [a, b, c, hwa] of JIJI_BANGHAP) {
    const found = [a, b, c].map(target => jis.find(j => j.ji === target));
    if (found.every(f => f)) {
      results.push({
        type: '방합',
        branches: [a, b, c],
        positions: found.map(f => f!.pos),
        hwaElement: hwa,
      });
    }
  }

  return results;
}

/**
 * 4주 지지에서 형충파해를 모두 검출한다.
 */
export function detectJijiRelations(
  pillars: {
    year: { ji: string };
    month: { ji: string };
    day: { ji: string };
    hour: { ji: string } | null;
  },
): JijiRelation[] {
  const jis: { ji: string; pos: string }[] = [
    { ji: pillars.year.ji, pos: '연지' },
    { ji: pillars.month.ji, pos: '월지' },
    { ji: pillars.day.ji, pos: '일지' },
  ];
  if (pillars.hour) jis.push({ ji: pillars.hour.ji, pos: '시지' });

  const results: JijiRelation[] = [];

  for (let i = 0; i < jis.length; i++) {
    for (let j = i + 1; j < jis.length; j++) {
      const a = jis[i], b = jis[j];

      if (matchPair(JIJI_CHUNG_PAIRS, a.ji, b.ji)) {
        results.push({ type: '충', ji1: a.ji, ji2: b.ji, position1: a.pos, position2: b.pos });
      }
      if (matchPair(JIJI_HYEONG_PAIRS, a.ji, b.ji)) {
        results.push({ type: '형', ji1: a.ji, ji2: b.ji, position1: a.pos, position2: b.pos });
      }
      if (matchPair(JIJI_HAE_PAIRS, a.ji, b.ji)) {
        results.push({ type: '해', ji1: a.ji, ji2: b.ji, position1: a.pos, position2: b.pos });
      }
      if (matchPair(JIJI_PA_PAIRS, a.ji, b.ji)) {
        results.push({ type: '파', ji1: a.ji, ji2: b.ji, position1: a.pos, position2: b.pos });
      }
    }
  }

  return results;
}

function matchPair(pairs: [string, string][], a: string, b: string): boolean {
  return pairs.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

/**
 * 월지가 충·형·해·파로 손상되었는지 확인한다.
 */
export function getMonthBranchDamage(relations: JijiRelation[]): JijiRelation[] {
  return relations.filter(r => r.position1 === '월지' || r.position2 === '월지');
}
