/**
 * 시초법 엔진 출력 → 괘 해석 데이터 룩업
 *
 * 책(결정의 서 886)의 X.Y 번호 체계:
 *   X = 상괘 (1건 2택 3화 4뇌 5풍 6수 7산 8지)
 *   Y = 하괘 (동일)
 *
 * sicho.ts의 trigram index:
 *   0곤 1진 2감 3태 4간 5리 6손 7건
 */

import guaDataRaw from './gua-data.json';
import { trigramIndex, type YaoResult } from './sicho';

// --- 타입 ---

export interface YaoInterpretation {
  yao: number;           // 1~6 (초효~상효)
  byeonGua: string;      // 변괘 book ID (e.g., "1.5")
  byeonGuaName: string;  // 변괘 이름 (e.g., "천풍구")
  general: string;       // 효 총론
  categories: Record<string, string>; // 18개 카테고리
}

export interface GuaInterpretation {
  id: string;            // book ID (e.g., "1.1")
  name: string;          // 괘 이름 (e.g., "중천건")
  chongron: string;      // 괘 총론
  yao: YaoInterpretation[];
}

// --- 매핑 테이블 ---

// 책 번호 → sicho trigram index
const BOOK_TO_TRIGRAM: Record<number, number> = {
  1: 7, // 건(天)
  2: 3, // 태(澤)
  3: 5, // 리(火)
  4: 1, // 진(雷)
  5: 6, // 손(風)
  6: 2, // 감(水)
  7: 4, // 간(山)
  8: 0, // 곤(地)
};

// sicho trigram index → 책 번호
const TRIGRAM_TO_BOOK: Record<number, number> = {};
for (const [book, tri] of Object.entries(BOOK_TO_TRIGRAM)) {
  TRIGRAM_TO_BOOK[tri] = Number(book);
}

// --- 변환 함수 ---

/**
 * 괘 배열 (0/1, 아래→위 6개) → 책 X.Y ID
 */
export function guaToBookId(gua: number[]): string {
  const lower = trigramIndex(gua.slice(0, 3));
  const upper = trigramIndex(gua.slice(3, 6));
  const bookUpper = TRIGRAM_TO_BOOK[upper];
  const bookLower = TRIGRAM_TO_BOOK[lower];
  return `${bookUpper}.${bookLower}`;
}

/**
 * 괘 해석 데이터 조회
 */
export function getGuaInterpretation(gua: number[]): GuaInterpretation | null {
  const bookId = guaToBookId(gua);
  const data = (guaDataRaw as Record<string, GuaInterpretation>)[bookId];
  return data || null;
}

/**
 * 특정 효가 변했을 때의 해석 조회
 * @param gua 본괘 배열
 * @param yaoIndex 변효 위치 (0=초효 ~ 5=상효)
 */
export function getYaoInterpretation(
  gua: number[],
  yaoIndex: number
): YaoInterpretation | null {
  const interp = getGuaInterpretation(gua);
  if (!interp) return null;
  // yao 배열에서 해당 효 찾기 (yaoIndex 0-based → yao number 1-based)
  return interp.yao.find(y => y.yao === yaoIndex + 1) || null;
}

/**
 * 시초법 결과로부터 전체 해석 생성
 */
export function interpretCast(yaos: YaoResult[]): {
  originalGua: number[];
  bonGua: GuaInterpretation | null;
  changingYao: YaoInterpretation[];
  changedGua: GuaInterpretation | null;
} {
  const originalGua = yaos.map(y => y.isYang ? 1 : 0);
  const changedGuaBits = yaos.map(y => {
    if (y.isChanging) return y.isYang ? 0 : 1;
    return y.isYang ? 1 : 0;
  });

  const bonGua = getGuaInterpretation(originalGua);

  // 변효별 해석 수집
  const changingYao: YaoInterpretation[] = [];
  for (let i = 0; i < 6; i++) {
    if (yaos[i].isChanging) {
      const yaoInterp = getYaoInterpretation(originalGua, i);
      if (yaoInterp) changingYao.push(yaoInterp);
    }
  }

  // 변괘 (변효가 있는 경우만)
  const hasChange = yaos.some(y => y.isChanging);
  const changedGua = hasChange ? getGuaInterpretation(changedGuaBits) : null;

  return { originalGua, bonGua, changingYao, changedGua };
}
