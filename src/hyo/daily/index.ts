/**
 * 데일리 운세 — 오케스트레이터
 *
 * 룰렛 결과(상괘idx, 하괘idx, 동효위치) + 오늘 날짜 → DailyFortune
 */

import { getGuaPalace } from '../gua-palace';
import { getGuaInterpretation } from '../gua-lookup';
import { getGuaName } from '../sicho';
import { getDateContext } from '../liuyao/date-utils';
import { calculateDailyScores } from './calculate';
import type { DailyFortune } from './types';

// d8 값(0~7) → trigramIndex 매핑 (건태리진손감간곤 순)
const TRIGRAM_INDEX_MAP = [7, 3, 5, 1, 6, 2, 4, 0];

function toBits(idx: number): number[] {
  return [idx & 1, (idx >> 1) & 1, (idx >> 2) & 1];
}

/**
 * 데일리 운세 메인 진입점
 *
 * @param upperD8 상괘 룰렛 결과 (0~7)
 * @param lowerD8 하괘 룰렛 결과 (0~7)
 * @param d6 동효 위치 (1~6)
 * @param today 오늘 날짜 (Date)
 */
export function getDailyFortune(
  upperD8: number,
  lowerD8: number,
  d6: number,
  today: Date,
): DailyFortune {
  const upperIdx = TRIGRAM_INDEX_MAP[upperD8];
  const lowerIdx = TRIGRAM_INDEX_MAP[lowerD8];
  const lowerBits = toBits(lowerIdx);
  const upperBits = toBits(upperIdx);
  const gua = [...lowerBits, ...upperBits];
  const changingIdx = d6 - 1;

  // 지괘 생성
  const changedGua = gua.map((bit, i) => i === changingIdx ? (bit === 1 ? 0 : 1) : bit);

  const guaInfo = getGuaName(gua);
  const jiGuaInfo = getGuaName(changedGua);
  const palace = getGuaPalace(gua);
  const jiInterp = getGuaInterpretation(changedGua);
  const dateContext = getDateContext(today);

  // 날짜 표시
  const d = today;
  const dateStr = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  const dateGanji = `${dateContext.ilgan}${dateContext.ilji}일 ${dateContext.wolgeon}월`;

  // 점수 계산
  const scores = palace
    ? calculateDailyScores(gua, changingIdx, dateContext, palace)
    : [];

  const totalScore = scores.length > 0
    ? Math.round(scores.reduce((sum, s) => sum + s.score, 0) / scores.length)
    : 50;

  const totalVerdict =
    totalScore >= 80 ? '대길' :
    totalScore >= 60 ? '길' :
    totalScore >= 40 ? '평' :
    totalScore >= 20 ? '흉' : '대흉';

  // 지괘 총론 전문
  const jiGuaSummary = jiInterp?.chongron || '';

  return {
    date: dateStr,
    dateGanji,
    guaName: guaInfo.korean,
    jiGuaName: jiGuaInfo.korean,
    changingYaoPos: d6,
    guaBits: gua,
    scores,
    totalScore,
    totalVerdict,
    jiGuaSummary,
  };
}

export type { DailyFortune, DailyScore } from './types';
