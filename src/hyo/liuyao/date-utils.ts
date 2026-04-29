/**
 * 육효 해석 엔진 — 날짜 유틸리티
 *
 * 점을 친 날짜에서 월건(月建)과 일진(日辰)을 추출한다.
 */

import { getIljinByDate } from '@engine/data/iljin_adapter';
import { getMonthPillar } from '@engine/pillar_month';
import { DIZHI_WUXING } from '../gua-palace';
import type { DateContext, Dizhi, Tiangan, Wuxing } from './types';

// ─── 한자→타입 변환 테이블 ──────────────────────────────────

const TIANGAN_LIST: Tiangan[] = ['甲', '乙', '丙', '丁', '戊', '己', '庚', '辛', '壬', '癸'];
const DIZHI_LIST: Dizhi[] = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/**
 * 점을 친 날짜에서 월건과 일진 컨텍스트를 추출한다.
 *
 * @param castingDate 점을 친 시점의 Date 객체
 * @returns DateContext — 월건·일진·오행 정보
 * @throws 일진 데이터가 없는 날짜일 경우 (범위 밖)
 */
export function getDateContext(castingDate: Date): DateContext {
  // 일진 조회
  const iljin = getIljinByDate(castingDate);
  if (!iljin) {
    throw new Error(`일진 데이터를 찾을 수 없습니다: ${castingDate.toISOString()}`);
  }

  // 한자에서 천간·지지 추출 (예: "甲戌" → 甲, 戌)
  const ilgan = iljin.hanja[0] as Tiangan;
  const ilji = iljin.hanja[1] as Dizhi;

  if (!TIANGAN_LIST.includes(ilgan) || !DIZHI_LIST.includes(ilji)) {
    throw new Error(`일진 파싱 실패: ${iljin.hanja}`);
  }

  // 월건(월지) 조회 — 절기 기준
  const monthPillar = getMonthPillar(castingDate);
  const wolgeon = monthPillar.ji as Dizhi;

  // 날짜 키
  const y = castingDate.getFullYear();
  const m = String(castingDate.getMonth() + 1).padStart(2, '0');
  const d = String(castingDate.getDate()).padStart(2, '0');

  return {
    date: castingDate,
    dateKey: `${y}-${m}-${d}`,
    ilgan,
    ilji,
    iljiWuxing: DIZHI_WUXING[ilji],
    wolgeon,
    wolWuxing: DIZHI_WUXING[wolgeon],
  };
}
