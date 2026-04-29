/**
 * 육효 해석 엔진 — 메인 오케스트레이터
 *
 * 점일의 월건·일진을 기준으로 각 카테고리의 용신 강약을 분석하고,
 * 책 텍스트에 보충할 해석문을 생성한다.
 *
 * 사용법:
 *   const analysis = analyzeLiuYao(new Date(), palace, yaos, categoryKeys);
 *   // analysis.assessments — 카테고리별 평가
 *   // analysis.summary — 전체 요약문
 */

import type { GuaPalaceInfo } from '../gua-palace';
import type { YaoResult } from '../sicho';
import type { LiuYaoAnalysis } from './types';
import { getDateContext } from './date-utils';
import { assessCategory } from './strength';
import { generateCategoryText, generateAnalysisSummary } from './interpret';

/**
 * 육효 강약 분석 메인 진입점.
 *
 * @param castingDate 점을 친 시점의 Date 객체
 * @param palace getGuaPalace()의 반환값 — 세응·육친·지지 정보
 * @param yaos castHexagram()의 yaos — 6개 효 결과
 * @param categories 분석할 카테고리 키 목록 (책 텍스트의 카테고리명)
 * @returns LiuYaoAnalysis — 카테고리별 평가 + 요약문
 */
export function analyzeLiuYao(
  castingDate: Date,
  palace: GuaPalaceInfo,
  yaos: YaoResult[],
  categories: string[],
): LiuYaoAnalysis {
  // 1. 날짜 컨텍스트 (월건·일진)
  const dateContext = getDateContext(castingDate);

  // 2. 동효 인덱스 추출
  const changingIndices: number[] = [];
  yaos.forEach((y, i) => {
    if (y.isChanging) changingIndices.push(i);
  });

  // 3. 카테고리별 평가
  const assessments = categories.map(cat => {
    const assessment = assessCategory(cat, dateContext, palace, changingIndices);
    // 해석문 생성
    assessment.interpretation = generateCategoryText(assessment);
    return assessment;
  });

  // 4. 전체 요약
  const analysis: LiuYaoAnalysis = {
    dateContext,
    assessments,
    summary: '',
  };
  analysis.summary = generateAnalysisSummary(analysis);

  return analysis;
}

// Re-export for convenience
export type { LiuYaoAnalysis, CategoryAssessment, Verdict } from './types';
