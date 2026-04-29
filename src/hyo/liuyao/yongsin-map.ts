/**
 * 육효 해석 엔진 — 카테고리→용신 매핑
 *
 * 각 카테고리(재물, 시험 등)에 대해 어떤 육친이 용신인지 결정하고,
 * 괘 내에서 용신의 위치·오행을 찾는다.
 * 원신·기신·구신도 여기서 산출한다.
 */

import { DIZHI_WUXING } from '../gua-palace';
import type { GuaPalaceInfo } from '../gua-palace';
import type { Liuqin, YongsinInfo, WonGiGuInfo, SpiritInfo, Wuxing, Dizhi } from './types';

// ─── 카테고리 → 용신 매핑 테이블 ────────────────────────────
// 유지보수: 카테고리 추가/변경 시 이 테이블만 수정하면 된다.

export const CATEGORY_YONGSIN: Record<string, Liuqin | '世' | '應'> = {
  '희망':                 '世',
  '재물':                 '財',
  '궁합(동료,우정)':       '應',
  '결혼':                 '財',
  '연애':                 '財',
  '취직':                 '官',
  '시험(승진,입학,자격)':   '官',
  '현재 사업':             '財',
  '신규개업':              '財',
  '업종전환·이직':         '官',
  '매매':                 '財',
  '투자':                 '財',
  '소송(다툼,분쟁)':       '官',
  '여행':                 '孫',
  '분실(물건,반려동물)':    '財',
  '건강':                 '孫',
  '각종 출마':             '官',
};

// ─── 육친 간 오행 관계 ──────────────────────────────────────
// 궁 오행 기준:
//   兄=同, 孫=내가생, 財=내가극, 父=나를생, 官=나를극

const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const KE: Record<Wuxing, Wuxing> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

/** 육친의 오행을 궁 오행으로부터 역산 */
function liuqinToWuxing(palaceWuxing: Wuxing, liuqin: Liuqin): Wuxing {
  switch (liuqin) {
    case '兄': return palaceWuxing;         // 같은 오행
    case '孫': return SHENG[palaceWuxing];  // 내가 생하는 것
    case '財': return KE[palaceWuxing];     // 내가 극하는 것
    case '父': {                            // 나를 생하는 것
      for (const [k, v] of Object.entries(SHENG)) {
        if (v === palaceWuxing) return k as Wuxing;
      }
      return palaceWuxing;
    }
    case '官': {                            // 나를 극하는 것
      for (const [k, v] of Object.entries(KE)) {
        if (v === palaceWuxing) return k as Wuxing;
      }
      return palaceWuxing;
    }
  }
}

/** 오행으로부터 육친 역산 (궁 오행 기준) */
function wuxingToLiuqin(palaceWuxing: Wuxing, targetWuxing: Wuxing): Liuqin {
  if (palaceWuxing === targetWuxing) return '兄';
  if (SHENG[palaceWuxing] === targetWuxing) return '孫';
  if (KE[palaceWuxing] === targetWuxing) return '財';
  if (SHENG[targetWuxing] === palaceWuxing) return '父';
  if (KE[targetWuxing] === palaceWuxing) return '官';
  return '兄'; // fallback
}

// ─── 용신 정보 조회 ─────────────────────────────────────────

/**
 * 카테고리에 해당하는 용신의 위치·오행·지지를 찾는다.
 *
 * 世/應 특수 케이스: 세효/응효의 육친·오행을 직접 사용.
 * 일반 육친: 괘 내에서 해당 육친을 가진 모든 효를 찾는다.
 */
export function getYongsinInfo(
  category: string,
  palace: GuaPalaceInfo,
): YongsinInfo {
  const yongsinType = CATEGORY_YONGSIN[category] || '世';
  const palaceWuxing = palace.palace.wuxing;

  if (yongsinType === '世' || yongsinType === '應') {
    const yaoIdx = yongsinType === '世' ? palace.shi - 1 : palace.ying - 1;
    const dz = palace.yaoDizhi[yaoIdx];
    const lq = palace.yaoLiuqin[yaoIdx] as Liuqin;
    return {
      category,
      yongsinType,
      yongsinLiuqin: lq,
      yongsinYaoIndices: [yaoIdx],
      yongsinDizhi: [dz],
      yongsinWuxing: DIZHI_WUXING[dz],
    };
  }

  // 일반 육친: 괘 내에서 해당 육친을 가진 효들 수집
  const liuqinHanja = { '父': '父', '兄': '兄', '官': '官', '財': '財', '孫': '孫' };
  const targetHanja = liuqinHanja[yongsinType];
  const indices: number[] = [];
  const dizhis: Dizhi[] = [];

  palace.yaoLiuqin.forEach((lq, i) => {
    if (lq === targetHanja) {
      indices.push(i);
      dizhis.push(palace.yaoDizhi[i]);
    }
  });

  const ysWuxing = liuqinToWuxing(palaceWuxing, yongsinType);

  return {
    category,
    yongsinType,
    yongsinLiuqin: yongsinType,
    yongsinYaoIndices: indices,
    yongsinDizhi: dizhis,
    yongsinWuxing: ysWuxing,
  };
}

// ─── 원신·기신·구신 산출 ────────────────────────────────────

/**
 * 용신 기준으로 원신·기신·구신을 결정한다.
 *
 * - 원신(原神): 용신을 생(生)하는 육친
 * - 기신(忌神): 용신을 극(剋)하는 육친
 * - 구신(仇神): 기신을 생(生)하는 육친
 */
export function getWonGiGu(
  yongsinLiuqin: Liuqin,
  yongsinWuxing: Wuxing,
  palace: GuaPalaceInfo,
  changingIndices: number[],
): WonGiGuInfo {
  const palaceWuxing = palace.palace.wuxing;
  const changingSet = new Set(changingIndices);

  // 원신 오행: 용신을 생하는 오행
  // A생B면, A는 GENERATED_BY[B] 또는 동치로 SHENG에서 A→B
  // 용신을 생하는 오행 = SHENG 역방향에서 yongsinWuxing을 value로 가지는 key
  let wonsinWuxing: Wuxing = palaceWuxing;
  for (const [k, v] of Object.entries(SHENG)) {
    if (v === yongsinWuxing) { wonsinWuxing = k as Wuxing; break; }
  }

  // 기신 오행: 용신을 극하는 오행
  // A극B면, KE에서 A→B
  let gisinWuxing: Wuxing = palaceWuxing;
  for (const [k, v] of Object.entries(KE)) {
    if (v === yongsinWuxing) { gisinWuxing = k as Wuxing; break; }
  }

  // 구신 오행: 기신을 생하는 오행
  let gusinWuxing: Wuxing = palaceWuxing;
  for (const [k, v] of Object.entries(SHENG)) {
    if (v === gisinWuxing) { gusinWuxing = k as Wuxing; break; }
  }

  const makeSpiritInfo = (wuxing: Wuxing): SpiritInfo => {
    const lq = wuxingToLiuqin(palaceWuxing, wuxing);
    const indices: number[] = [];
    palace.yaoLiuqin.forEach((l, i) => {
      if (l === lq.replace('兄', '兄').replace('孫', '孫')) {
        // 한자 매칭
        if (l === lq) indices.push(i);
      }
    });
    // 좀 더 정확하게: 해당 오행의 지지를 가진 효
    const idxByWuxing: number[] = [];
    palace.yaoDizhi.forEach((dz, i) => {
      if (DIZHI_WUXING[dz] === wuxing) idxByWuxing.push(i);
    });
    // 육친 매칭을 우선, 없으면 오행 매칭 사용
    const finalIndices = indices.length > 0 ? indices : idxByWuxing;

    return {
      liuqin: lq,
      wuxing,
      present: finalIndices.length > 0,
      yaoIndices: finalIndices,
      isChanging: finalIndices.some(i => changingSet.has(i)),
    };
  };

  return {
    wonsin: makeSpiritInfo(wonsinWuxing),
    gisin: makeSpiritInfo(gisinWuxing),
    gusin: makeSpiritInfo(gusinWuxing),
  };
}
