/**
 * 육효 해석 엔진 — 왕쇠(旺相休囚死) 계산
 *
 * 월건의 오행을 기준으로 대상 오행의 강약 상태를 판정한다.
 */

import { getWangSang as _getWangSang } from '@engine/oheng_analysis';
import type { Wuxing, WangSangState } from './types';

/**
 * 월건 오행 대비 대상 오행의 왕쇠를 계산한다.
 *
 * - 旺(왕): 월건과 같은 오행 — 가장 강함
 * - 相(상): 월건이 생해주는 오행 — 강함
 * - 休(휴): 월건을 생해주는 오행 — 쉬는 상태
 * - 囚(수): 월건에 극당하는 오행 — 갇힘
 * - 死(사): 월건을 극하는 오행 — 가장 약함
 *
 * 주의: oheng_analysis의 getWangSang(base, target) 컨벤션과
 * 육효의 월건 기준 왕쇠 컨벤션이 동일함을 확인함.
 * base=월건오행, target=대상오행
 */
export function getYongsinWangSang(wolWuxing: Wuxing, targetWuxing: Wuxing): WangSangState {
  return _getWangSang(wolWuxing, targetWuxing);
}

/** 왕쇠 상태를 숫자 가중치로 변환 */
export function wangSangToWeight(state: WangSangState): number {
  switch (state) {
    case '旺': return 2;
    case '相': return 1;
    case '休': return 0;
    case '囚': return -1;
    case '死': return -2;
  }
}

/** 왕쇠 상태의 한글 레이블 */
export const WANGSANG_LABEL: Record<WangSangState, string> = {
  '旺': '왕(旺) — 가장 강함',
  '相': '상(相) — 강함',
  '休': '휴(休) — 쉬는 상태',
  '囚': '수(囚) — 약함',
  '死': '사(死) — 가장 약함',
};
