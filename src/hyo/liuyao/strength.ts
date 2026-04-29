/**
 * 육효 해석 엔진 — 종합 강약 평가
 *
 * 용신의 왕쇠, 일진 관계, 동효 영향, 원신/기신 강약을
 * 종합하여 카테고리별 verdict를 산출한다.
 */

import { DIZHI_WUXING } from '../gua-palace';
import type { GuaPalaceInfo } from '../gua-palace';
import { getYongsinWangSang, wangSangToWeight } from './wangsoe';
import { getYongsinInfo, getWonGiGu } from './yongsin-map';
import type {
  DateContext, YongsinInfo, WonGiGuInfo,
  StrengthFactor, CategoryAssessment, RelationType, Verdict,
  Wuxing, Dizhi,
} from './types';

// ─── 오행 생극 테이블 ───────────────────────────────────────

const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const KE: Record<Wuxing, Wuxing> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

// ─── 지지 육합·육충 테이블 ──────────────────────────────────

const YUKCHUNG: [Dizhi, Dizhi][] = [
  ['子', '午'], ['丑', '未'], ['寅', '申'],
  ['卯', '酉'], ['辰', '戌'], ['巳', '亥'],
];

const YUKHAP: [Dizhi, Dizhi][] = [
  ['子', '丑'], ['寅', '亥'], ['卯', '戌'],
  ['辰', '酉'], ['巳', '申'], ['午', '未'],
];

function isChung(a: Dizhi, b: Dizhi): boolean {
  return YUKCHUNG.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

function isHap(a: Dizhi, b: Dizhi): boolean {
  return YUKHAP.some(([x, y]) => (a === x && b === y) || (a === y && b === x));
}

// ─── 일진↔용신 관계 판정 ────────────────────────────────────

/**
 * 일진의 지지가 용신의 지지에 대해 어떤 관계인지 판정.
 * 용신이 여러 효에 있을 경우, 가장 유의미한 관계를 반환.
 */
export function getIljinRelation(
  ilji: Dizhi,
  iljiWuxing: Wuxing,
  yongsinDizhi: Dizhi[],
  yongsinWuxing: Wuxing,
): { relation: RelationType; detail: string } {
  // 합·충 먼저 (지지 직접 관계)
  for (const dz of yongsinDizhi) {
    if (isChung(ilji, dz)) {
      return { relation: '충', detail: `일진 ${ilji}이(가) 용신 ${dz}과(와) 충(冲)` };
    }
  }
  for (const dz of yongsinDizhi) {
    if (isHap(ilji, dz)) {
      return { relation: '합', detail: `일진 ${ilji}이(가) 용신 ${dz}과(와) 합(合)` };
    }
  }

  // 오행 생극
  if (SHENG[iljiWuxing] === yongsinWuxing) {
    return { relation: '생', detail: `일진(${iljiWuxing})이 용신(${yongsinWuxing})을 생(生)` };
  }
  if (KE[iljiWuxing] === yongsinWuxing) {
    return { relation: '극', detail: `일진(${iljiWuxing})이 용신(${yongsinWuxing})을 극(剋)` };
  }

  return { relation: '무관', detail: '일진과 용신 사이 직접적 관계 없음' };
}

/** 일진 관계를 가중치로 변환 */
function iljinRelationWeight(rel: RelationType): number {
  switch (rel) {
    case '생': return 1;
    case '합': return 1;   // 합은 상황에 따라 다르나 기본적으로 긍정
    case '극': return -1;
    case '충': return -1;  // 왕하면 暗動(중립~긍정)이나 기본 부정으로
    case '무관': return 0;
  }
}

// ─── 동효 영향 ──────────────────────────────────────────────

/**
 * 동효(변하는 효)가 용신에 미치는 영향을 평가.
 * 동효의 오행이 용신을 생하면 강화, 극하면 약화.
 */
export function getDonghyoEffects(
  changingIndices: number[],
  palace: GuaPalaceInfo,
  yongsinWuxing: Wuxing,
  yongsinYaoIndices: number[],
): StrengthFactor[] {
  const factors: StrengthFactor[] = [];
  const yongsinSet = new Set(yongsinYaoIndices);

  for (const idx of changingIndices) {
    if (yongsinSet.has(idx)) {
      // 용신 자체가 동효 → 활성화 (기본 강화)
      factors.push({
        source: '동효',
        effect: '강화',
        detail: `용신이 동효(${idx + 1}효)로 활성화됨`,
        weight: 1,
      });
      continue;
    }

    const dongWuxing = DIZHI_WUXING[palace.yaoDizhi[idx]];

    if (SHENG[dongWuxing] === yongsinWuxing) {
      factors.push({
        source: '동효',
        effect: '강화',
        detail: `${idx + 1}효(${dongWuxing}) 동효가 용신(${yongsinWuxing})을 생`,
        weight: 1,
      });
    } else if (KE[dongWuxing] === yongsinWuxing) {
      factors.push({
        source: '동효',
        effect: '약화',
        detail: `${idx + 1}효(${dongWuxing}) 동효가 용신(${yongsinWuxing})을 극`,
        weight: -1,
      });
    }
  }

  return factors;
}

// ─── 원신·기신 강약 ─────────────────────────────────────────

/**
 * 원신·기신·구신의 월건 대비 왕쇠와 동효 여부를 평가.
 */
export function getWonGiGuStrength(
  wonGiGu: WonGiGuInfo,
  wolWuxing: Wuxing,
  changingIndices: number[],
): StrengthFactor[] {
  const factors: StrengthFactor[] = [];
  const changingSet = new Set(changingIndices);

  // 원신 강약
  if (wonGiGu.wonsin.present) {
    const ws = getYongsinWangSang(wolWuxing, wonGiGu.wonsin.wuxing);
    const w = wangSangToWeight(ws);
    if (w >= 1) {
      factors.push({
        source: '원신',
        effect: '강화',
        detail: `원신(${wonGiGu.wonsin.liuqin})이 월건에서 ${ws} — 용신을 돕는 힘이 강함`,
        weight: 1,
      });
    }
    if (wonGiGu.wonsin.isChanging) {
      factors.push({
        source: '원신',
        effect: '강화',
        detail: `원신(${wonGiGu.wonsin.liuqin})이 동효로 활성화됨`,
        weight: 1,
      });
    }
  }

  // 기신 강약
  if (wonGiGu.gisin.present) {
    const ws = getYongsinWangSang(wolWuxing, wonGiGu.gisin.wuxing);
    const w = wangSangToWeight(ws);
    if (w >= 1) {
      factors.push({
        source: '기신',
        effect: '약화',
        detail: `기신(${wonGiGu.gisin.liuqin})이 월건에서 ${ws} — 용신을 해치는 힘이 강함`,
        weight: -1,
      });
    }
    if (wonGiGu.gisin.isChanging) {
      factors.push({
        source: '기신',
        effect: '약화',
        detail: `기신(${wonGiGu.gisin.liuqin})이 동효로 활성화됨`,
        weight: -1,
      });
    }
  }

  return factors;
}

// ─── 종합 평가 ──────────────────────────────────────────────

/** 총점 → verdict 변환 */
function scoreToVerdict(score: number): Verdict {
  if (score >= 4) return '대길';
  if (score >= 2) return '길';
  if (score >= -1) return '평';
  if (score >= -3) return '흉';
  return '대흉';
}

/**
 * 하나의 카테고리에 대한 종합 강약 평가.
 */
export function assessCategory(
  category: string,
  dateContext: DateContext,
  palace: GuaPalaceInfo,
  changingIndices: number[],
): CategoryAssessment {
  // 1. 용신 정보
  const yongsin = getYongsinInfo(category, palace);

  // 2. 원신·기신·구신
  const wonGiGu = getWonGiGu(yongsin.yongsinLiuqin, yongsin.yongsinWuxing, palace, changingIndices);

  // 3. 용신 왕쇠
  const wangSang = getYongsinWangSang(dateContext.wolWuxing, yongsin.yongsinWuxing);
  const wangSangFactor: StrengthFactor = {
    source: '월건',
    effect: wangSangToWeight(wangSang) >= 1 ? '강화' : wangSangToWeight(wangSang) <= -1 ? '약화' : '중립',
    detail: `용신(${yongsin.yongsinWuxing})이 월건(${dateContext.wolWuxing})에서 ${wangSang}`,
    weight: wangSangToWeight(wangSang),
  };

  // 4. 일진 관계
  const { relation: ilJinRelation, detail: iljinDetail } = getIljinRelation(
    dateContext.ilji, dateContext.iljiWuxing,
    yongsin.yongsinDizhi, yongsin.yongsinWuxing,
  );
  const iljinFactor: StrengthFactor = {
    source: '일진',
    effect: iljinRelationWeight(ilJinRelation) >= 1 ? '강화' : iljinRelationWeight(ilJinRelation) <= -1 ? '약화' : '중립',
    detail: iljinDetail,
    weight: iljinRelationWeight(ilJinRelation),
  };

  // 5. 동효 영향
  const donghyoFactors = getDonghyoEffects(changingIndices, palace, yongsin.yongsinWuxing, yongsin.yongsinYaoIndices);

  // 6. 원신·기신 강약
  const wonGiGuFactors = getWonGiGuStrength(wonGiGu, dateContext.wolWuxing, changingIndices);

  // 종합
  const factors = [wangSangFactor, iljinFactor, ...donghyoFactors, ...wonGiGuFactors];
  const totalScore = factors.reduce((sum, f) => sum + f.weight, 0);
  const verdict = scoreToVerdict(totalScore);

  return {
    category,
    yongsin,
    wonGiGu,
    wangSang,
    ilJinRelation,
    factors,
    totalScore,
    verdict,
    interpretation: '', // interpret.ts에서 채움
  };
}
