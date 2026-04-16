/**
 * 신강/신약 판단
 *
 * 판단 요소:
 *   1. 월령 득실 (40%) — 월지 정기 vs 일간 오행 관계
 *   2. 득지 (25%) — 월지 제외 지지 지장간 중 일간을 돕는 세력
 *   3. 득세 (20%) — 합거되지 않은 천간 중 비겁·인성 수
 *   4. 설기 (15%) — 합거되지 않은 재관식상이 일간을 빼는 정도
 *
 * 월령과 득지의 이중 계상 방지: 월지 지장간은 득지에서 제외.
 * 천간합(5합): 합거된 천간은 득세·설기 카운트에서 제외.
 * 지지 형충파해: 월지 손상 시 월령 점수 감점.
 */

import { getTenGod, TenGodName } from './ten_gods';
import { getJijanggan } from './jijanggan';
import {
  detectCheonganHap, isHapgeo, CheonganHapInfo,
  detectJijiRelations, getMonthBranchDamage, JijiRelation,
} from './relations';

const STEM_ELEMENT: Record<string, string> = {
  '甲': '木', '乙': '木', '丙': '火', '丁': '火', '戊': '土',
  '己': '土', '庚': '金', '辛': '金', '壬': '水', '癸': '水',
};

const GENERATES: Record<string, string> = {
  '木': '火', '火': '土', '土': '金', '金': '水', '水': '木',
};

const DESTROYS: Record<string, string> = {
  '木': '土', '土': '水', '水': '火', '火': '金', '金': '木',
};

export type StrengthLevel = '극강' | '신강' | '중화' | '신약' | '극약';

export interface DayMasterStrengthResult {
  level: StrengthLevel;
  score: number;
  wolryeong: '득령' | '실령' | '중립';
  details: {
    wolryeongScore: number;
    deukjiScore: number;
    deukseScore: number;
    seolgiPenalty: number;
  };
  /** 검출된 천간합 목록 */
  cheonganHaps: CheonganHapInfo[];
  /** 월지 관련 형충파해 목록 */
  monthDamage: JijiRelation[];
}

type Pillars = {
  year: { gan: string; ji: string };
  month: { gan: string; ji: string };
  day: { gan: string; ji: string };
  hour: { gan: string; ji: string } | null;
};

export function analyzeDayMasterStrength(dayStem: string, pillars: Pillars): DayMasterStrengthResult {
  let score = 45; // 중립 기준선
  const dayElement = STEM_ELEMENT[dayStem];

  // 천간합 · 지지 형충파해 검출
  const cheonganHaps = detectCheonganHap(pillars);
  const jijiRelations = detectJijiRelations(pillars);
  const monthDamage = getMonthBranchDamage(jijiRelations);

  // ── 1. 월령 득실 (40점 만점) ──
  const monthMainStem = getJijanggan(pillars.month.ji).slice(-1)[0].stem;
  const monthElement = STEM_ELEMENT[monthMainStem];

  let wolryeong: '득령' | '실령' | '중립';
  let wolryeongScore: number;

  if (monthElement === dayElement) {
    wolryeong = '득령';
    wolryeongScore = 40;
  } else if (GENERATES[monthElement] === dayElement) {
    wolryeong = '득령';
    wolryeongScore = 30;
  } else if (GENERATES[dayElement] === monthElement) {
    wolryeong = '실령';
    wolryeongScore = -15;
  } else if (DESTROYS[monthElement] === dayElement) {
    wolryeong = '실령';
    wolryeongScore = -20;
  } else if (DESTROYS[dayElement] === monthElement) {
    wolryeong = '중립';
    wolryeongScore = -5;
  } else {
    wolryeong = '중립';
    wolryeongScore = 0;
  }

  // 월지 손상 시 월령 점수 감점
  // 충: 월령 기능 대폭 약화, 형/해/파: 부분 약화
  if (monthDamage.length > 0) {
    let damageRatio = 0;
    for (const d of monthDamage) {
      if (d.type === '충') damageRatio += 0.5;       // 충 = 50% 약화
      else if (d.type === '형') damageRatio += 0.3;   // 형 = 30%
      else if (d.type === '해') damageRatio += 0.25;  // 해 = 25%
      else if (d.type === '파') damageRatio += 0.15;  // 파 = 15%
    }
    damageRatio = Math.min(1, damageRatio); // 최대 100% 약화
    // 월령 점수의 절대값을 비율만큼 감소 (방향 유지)
    wolryeongScore = Math.round(wolryeongScore * (1 - damageRatio));
  }
  score += wolryeongScore;

  // ── 2. 득지 (25점 만점) — 월지 제외 지지 지장간 ──
  let deukjiScore = 0;
  const deukjiBranches = [pillars.year.ji, pillars.day.ji]; // 월지 제외!
  if (pillars.hour) deukjiBranches.push(pillars.hour.ji);

  // 월지 제외 지지 수에 맞게 비례 계산 (3지지 × 100% = 300%)
  const maxBranches = pillars.hour ? 3 : 2;
  const perBranchMax = 25 / (maxBranches > 0 ? maxBranches : 1);

  // 지지별 형충파해 손상 계수 계산
  const branchDamageRatio = (ji: string): number => {
    const damages = jijiRelations.filter(r =>
      (r.ji1 === ji || r.ji2 === ji)
    );
    if (damages.length === 0) return 1;
    let ratio = 0;
    for (const d of damages) {
      if (d.type === '충') ratio += 0.5;
      else if (d.type === '형') ratio += 0.3;
      else if (d.type === '해') ratio += 0.25;
      else if (d.type === '파') ratio += 0.15;
    }
    return Math.max(0, 1 - Math.min(1, ratio));
  };

  for (const branch of deukjiBranches) {
    const entries = getJijanggan(branch);
    const damageCoeff = branchDamageRatio(branch);
    let branchHelp = 0;
    for (const entry of entries) {
      const entryElement = STEM_ELEMENT[entry.stem];
      if (entryElement === dayElement || GENERATES[entryElement] === dayElement) {
        branchHelp += entry.strength;
      }
    }
    deukjiScore += (branchHelp / 100) * perBranchMax * damageCoeff;
  }

  // clamp 25점 상한
  deukjiScore = Math.min(25, Math.round(deukjiScore * 10) / 10);
  score += deukjiScore;

  // ── 3. 득세 (20점 만점) — 합거 제외 천간 ──
  const otherGans: { stem: string; pos: string }[] = [
    { stem: pillars.year.gan, pos: '연간' },
    { stem: pillars.month.gan, pos: '월간' },
  ];
  if (pillars.hour) otherGans.push({ stem: pillars.hour.gan, pos: '시간' });

  let helpCount = 0;
  let drainCount = 0;
  let hapgeoCount = 0;

  for (const g of otherGans) {
    if (isHapgeo(g.stem, g.pos, cheonganHaps)) {
      hapgeoCount++;
      continue; // 합거된 천간은 카운트에서 제외
    }
    const tenGod = getTenGod(dayStem, g.stem);
    if (isHelping(tenGod)) {
      helpCount++;
    } else {
      drainCount++;
    }
  }

  const activeStems = otherGans.length - hapgeoCount;
  // 일간이 합에 참여하면 일간 자체의 힘도 분산됨 → 득세 감점
  const dayInHap = cheonganHaps.some(h =>
    (h.stem1 === dayStem && h.position1 === '일간') ||
    (h.stem2 === dayStem && h.position2 === '일간')
  );

  let deukseScore: number;
  if (activeStems === 0) {
    deukseScore = 0;
  } else if (helpCount >= 2) {
    deukseScore = 20;
  } else if (helpCount === 1) {
    deukseScore = activeStems <= 2 ? 10 : 7;
  } else {
    deukseScore = -5;
  }

  // 일간 합거 시 득세 추가 감점 (일간 기력 분산)
  if (dayInHap && deukseScore > 0) {
    deukseScore = Math.round(deukseScore * 0.6);
  }

  score += deukseScore;

  // ── 4. 설기 감점 (15점 만점) — 합거 제외 ──
  let seolgiCount = drainCount; // 합거 안 된 천간 설기만

  // 월지 제외 지지 정기에서 설기 카운트
  for (const branch of deukjiBranches) {
    const mainStem = getJijanggan(branch).slice(-1)[0].stem;
    if (mainStem !== dayStem) {
      const tenGod = getTenGod(dayStem, mainStem);
      if (!isHelping(tenGod)) {
        seolgiCount++;
      }
    }
  }

  let seolgiPenalty = 0;
  if (seolgiCount >= 5) {
    seolgiPenalty = -15;
  } else if (seolgiCount >= 3) {
    seolgiPenalty = -8;
  } else if (seolgiCount >= 2) {
    seolgiPenalty = -3;
  }
  score += seolgiPenalty;

  // 점수 범위 제한
  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: StrengthLevel;
  if (score >= 80) level = '극강';
  else if (score >= 60) level = '신강';
  else if (score >= 40) level = '중화';
  else if (score >= 20) level = '신약';
  else level = '극약';

  return {
    level, score, wolryeong,
    details: { wolryeongScore, deukjiScore, deukseScore, seolgiPenalty },
    cheonganHaps,
    monthDamage,
  };
}

function isHelping(tenGod: TenGodName): boolean {
  return tenGod === '비견' || tenGod === '겁재' || tenGod === '편인' || tenGod === '정인';
}
