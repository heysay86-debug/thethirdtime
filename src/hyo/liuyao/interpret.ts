/**
 * 육효 해석 엔진 — 해석문 생성
 *
 * CategoryAssessment를 받아 사람이 읽을 수 있는 보충 해석문을 생성한다.
 * 템플릿 기반, LLM 없이 일관된 텍스트 산출.
 */

import type { CategoryAssessment, LiuYaoAnalysis, Verdict, WangSangState } from './types';

// ─── 한글 레이블 ────────────────────────────────────────────

const LIUQIN_NAME: Record<string, string> = {
  '父': '부모(父母)',
  '兄': '형제(兄弟)',
  '官': '관귀(官鬼)',
  '財': '처재(妻財)',
  '孫': '자손(子孫)',
};

const WANGSANG_SHORT: Record<WangSangState, string> = {
  '旺': '왕(旺)',
  '相': '상(相)',
  '休': '휴(休)',
  '囚': '수(囚)',
  '死': '사(死)',
};

const VERDICT_DESC: Record<Verdict, string> = {
  '대길': '매우 좋은 기운이 함께하는 시기',
  '길': '기운이 순조롭게 따르는 시기',
  '평': '특별히 강하거나 약하지 않은 시기',
  '흉': '기운이 다소 역행하는 시기',
  '대흉': '기운이 크게 역행하는 시기',
};

// ─── 카테고리별 해석문 생성 ─────────────────────────────────

/**
 * 하나의 카테고리에 대한 보충 해석문을 생성한다.
 * 책 텍스트를 대체하지 않고, 시기적 맥락을 더한다.
 */
export function generateCategoryText(a: CategoryAssessment): string {
  const liuqinName = LIUQIN_NAME[a.yongsin.yongsinLiuqin] || a.yongsin.yongsinLiuqin;
  const parts: string[] = [];

  // 1. 용신 왕쇠
  const wsLabel = WANGSANG_SHORT[a.wangSang];
  if (a.wangSang === '旺' || a.wangSang === '相') {
    parts.push(`용신(${liuqinName})이 이달의 기운에서 ${wsLabel}하여 힘이 있다.`);
  } else if (a.wangSang === '休') {
    parts.push(`용신(${liuqinName})이 이달의 기운에서 ${wsLabel}하여 쉬는 상태이다.`);
  } else {
    parts.push(`용신(${liuqinName})이 이달의 기운에서 ${wsLabel}하여 힘이 약하다.`);
  }

  // 2. 일진 관계
  if (a.ilJinRelation === '생') {
    parts.push('오늘의 일진이 용신을 생(生)해주어 힘을 보탠다.');
  } else if (a.ilJinRelation === '합') {
    parts.push('오늘의 일진이 용신과 합(合)하여 기운이 묶인다.');
  } else if (a.ilJinRelation === '극') {
    parts.push('오늘의 일진이 용신을 극(剋)하여 기운을 억제한다.');
  } else if (a.ilJinRelation === '충') {
    parts.push('오늘의 일진이 용신과 충(冲)하여 기운이 흔들린다.');
  }

  // 3. 동효·원신·기신 요약 (주요 요인만)
  const keyFactors = a.factors.filter(f =>
    f.source !== '월건' && f.source !== '일진' && f.weight !== 0
  );

  for (const f of keyFactors) {
    parts.push(f.detail + '.');
  }

  // 4. 종합 판정
  parts.push(VERDICT_DESC[a.verdict] + '.');

  return parts.join('\n');
}

// ─── 전체 요약문 생성 ───────────────────────────────────────

const DIZHI_HANGUL: Record<string, string> = {
  '子': '자', '丑': '축', '寅': '인', '卯': '묘', '辰': '진', '巳': '사',
  '午': '오', '未': '미', '申': '신', '酉': '유', '戌': '술', '亥': '해',
};

const TIANGAN_HANGUL: Record<string, string> = {
  '甲': '갑', '乙': '을', '丙': '병', '丁': '정', '戊': '무',
  '己': '기', '庚': '경', '辛': '신', '壬': '임', '癸': '계',
};

/**
 * 전체 분석의 요약 헤더를 생성한다.
 * 월건·일진 정보를 간결하게 표시.
 */
export function generateAnalysisSummary(analysis: LiuYaoAnalysis): string {
  const { dateContext } = analysis;
  const ilganH = TIANGAN_HANGUL[dateContext.ilgan] || dateContext.ilgan;
  const iljiH = DIZHI_HANGUL[dateContext.ilji] || dateContext.ilji;
  const wolH = DIZHI_HANGUL[dateContext.wolgeon] || dateContext.wolgeon;

  return `점일: ${dateContext.dateKey}\n월건: ${wolH}(${dateContext.wolgeon})월 · 일진: ${ilganH}${iljiH}(${dateContext.ilgan}${dateContext.ilji})일`;
}
