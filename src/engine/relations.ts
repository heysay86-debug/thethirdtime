/**
 * 천간 합(5합) · 지지 형충파해합 검출 유틸리티
 */

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
