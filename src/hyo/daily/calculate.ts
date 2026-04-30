/**
 * 데일리 운세 — 점수 산출
 *
 * 룰렛 결과(괘+동효) + 오늘 날짜(월건/일진) → 4대 운세 점수
 * liuyao 엔진의 왕쇠·일진 관계를 재사용.
 */

import { getGuaPalace, DIZHI_WUXING } from '../gua-palace';
import type { GuaPalaceInfo } from '../gua-palace';
import { getGuaInterpretation } from '../gua-lookup';
import { getDateContext } from '../liuyao/date-utils';
import { getYongsinWangSang, wangSangToWeight } from '../liuyao/wangsoe';
import { getIljinRelation } from '../liuyao/strength';
import type { DateContext, Wuxing, Liuqin } from '../liuyao/types';
import type { DailyScore } from './types';

// ─── 4대 운세 → 용신 매핑 ───────────────────────────────────

interface FortuneCategory {
  label: string;
  yongsinLiuqin: Liuqin;
}

const FORTUNE_CATEGORIES: FortuneCategory[] = [
  { label: '문서운', yongsinLiuqin: '官' },
  { label: '재물운', yongsinLiuqin: '財' },
  { label: '연애운', yongsinLiuqin: '財' }, // 연애도 재성 기반이나, 應효 참고
  { label: '건강운', yongsinLiuqin: '孫' },
];

// ─── 용신 오행 역산 ─────────────────────────────────────────

const SHENG: Record<Wuxing, Wuxing> = { '木': '火', '火': '土', '土': '金', '金': '水', '水': '木' };
const KE: Record<Wuxing, Wuxing> = { '木': '土', '火': '金', '土': '水', '金': '木', '水': '火' };

function liuqinToWuxing(palaceWuxing: Wuxing, liuqin: Liuqin): Wuxing {
  switch (liuqin) {
    case '兄': return palaceWuxing;
    case '孫': return SHENG[palaceWuxing];
    case '財': return KE[palaceWuxing];
    case '父': {
      for (const [k, v] of Object.entries(SHENG)) if (v === palaceWuxing) return k as Wuxing;
      return palaceWuxing;
    }
    case '官': {
      for (const [k, v] of Object.entries(KE)) if (v === palaceWuxing) return k as Wuxing;
      return palaceWuxing;
    }
  }
}

// ─── 점수 변환 ──────────────────────────────────────────────

function factorsToScore(wangSangWeight: number, iljinWeight: number, dongEffect: number): number {
  // wangSang: -2~+2, iljin: -1~+1, dong: -1~+1 → 총합 -4~+4
  const raw = wangSangWeight + iljinWeight + dongEffect;
  // -4~+4 → 0~100 선형 매핑
  const score = Math.round(((raw + 4) / 8) * 100);
  return Math.max(0, Math.min(100, score));
}

function scoreToVerdict(score: number): string {
  if (score >= 80) return '대길';
  if (score >= 60) return '길';
  if (score >= 40) return '평';
  if (score >= 20) return '흉';
  return '대흉';
}

// ─── 한줄 해석 생성 ─────────────────────────────────────────

const DETAIL_TEMPLATES: Record<string, Record<string, string>> = {
  '문서운': {
    '대길': '시험·승진에 좋은 기운이 함께합니다.',
    '길': '서류·계약 관련 일이 순조롭습니다.',
    '평': '특별한 변화 없이 평이합니다.',
    '흉': '중요한 결정은 미루는 것이 좋겠습니다.',
    '대흉': '문서 관련 실수에 주의하세요.',
  },
  '재물운': {
    '대길': '재물이 들어오는 기운이 강합니다.',
    '길': '소소한 이득이 기대됩니다.',
    '평': '큰 변동 없이 유지됩니다.',
    '흉': '불필요한 지출을 줄이세요.',
    '대흉': '투자·대출은 삼가세요.',
  },
  '연애운': {
    '대길': '인연의 기운이 강하게 감돌고 있습니다.',
    '길': '좋은 만남이나 관계 개선이 기대됩니다.',
    '평': '평온한 하루입니다.',
    '흉': '오해가 생기기 쉬우니 말을 아끼세요.',
    '대흉': '감정적 충돌에 주의하세요.',
  },
  '건강운': {
    '대길': '활력이 넘치는 하루입니다.',
    '길': '가벼운 운동이 좋겠습니다.',
    '평': '무난한 컨디션입니다.',
    '흉': '과로에 주의하세요.',
    '대흉': '몸에 무리가 가지 않도록 쉬세요.',
  },
};

// ─── 메인 계산 ──────────────────────────────────────────────

/**
 * 괘와 동효 위치로부터 4대 운세 점수를 산출한다.
 *
 * @param gua 6비트 배열 (본괘)
 * @param changingIdx 동효 인덱스 (0~5)
 * @param dateContext 오늘의 월건·일진
 * @param palace 괘의 팔궁 정보
 */
export function calculateDailyScores(
  gua: number[],
  changingIdx: number,
  dateContext: DateContext,
  palace: GuaPalaceInfo,
): DailyScore[] {
  const palaceWuxing = palace.palace.wuxing;
  const dongWuxing = DIZHI_WUXING[palace.yaoDizhi[changingIdx]];

  return FORTUNE_CATEGORIES.map(cat => {
    const ysWuxing = liuqinToWuxing(palaceWuxing, cat.yongsinLiuqin);

    // 1. 왕쇠
    const ws = getYongsinWangSang(dateContext.wolWuxing, ysWuxing);
    const wsWeight = wangSangToWeight(ws);

    // 2. 일진 관계
    // 용신 지지 찾기
    const ysDizhis = palace.yaoDizhi.filter((_, i) => {
      const lq = palace.yaoLiuqin[i];
      return lq === cat.yongsinLiuqin;
    });
    const { relation } = getIljinRelation(
      dateContext.ilji, dateContext.iljiWuxing,
      ysDizhis.length > 0 ? ysDizhis : [palace.yaoDizhi[0]],
      ysWuxing,
    );
    const iljinWeight = relation === '생' || relation === '합' ? 1 : relation === '극' || relation === '충' ? -1 : 0;

    // 3. 동효 영향
    let dongEffect = 0;
    if (SHENG[dongWuxing] === ysWuxing) dongEffect = 1;
    else if (KE[dongWuxing] === ysWuxing) dongEffect = -1;

    // 연애운 특수: 應효 상태 참고
    if (cat.label === '연애운') {
      const yingIdx = palace.ying - 1;
      const yingWuxing = DIZHI_WUXING[palace.yaoDizhi[yingIdx]];
      const yingWs = getYongsinWangSang(dateContext.wolWuxing, yingWuxing);
      if (wangSangToWeight(yingWs) >= 1) dongEffect = Math.max(dongEffect, 0.5);
    }

    const score = factorsToScore(wsWeight, iljinWeight, dongEffect);
    const verdict = scoreToVerdict(score);
    const detail = DETAIL_TEMPLATES[cat.label]?.[verdict] || '';

    return { label: cat.label, score, verdict, detail };
  });
}
