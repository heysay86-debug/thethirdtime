/**
 * 육효 해석 엔진 — 공유 타입 정의
 *
 * 월건·일진·용신 기반 강약 분석에 사용되는 모든 인터페이스.
 */

// ─── 기본 타입 ──────────────────────────────────────────────

export type Wuxing = '木' | '火' | '土' | '金' | '水';

export type Dizhi =
  | '子' | '丑' | '寅' | '卯' | '辰' | '巳'
  | '午' | '未' | '申' | '酉' | '戌' | '亥';

export type Tiangan =
  | '甲' | '乙' | '丙' | '丁' | '戊'
  | '己' | '庚' | '辛' | '壬' | '癸';

export type Liuqin = '父' | '兄' | '官' | '財' | '孫';

export type WangSangState = '旺' | '相' | '休' | '囚' | '死';

export type RelationType = '생' | '극' | '합' | '충' | '무관';

export type Verdict = '대길' | '길' | '평' | '흉' | '대흉';

// ─── 날짜 컨텍스트 ──────────────────────────────────────────

/** 점을 친 날의 월건·일진 정보 */
export interface DateContext {
  date: Date;
  dateKey: string;        // "YYYY-MM-DD"
  ilgan: Tiangan;         // 일간 (천간)
  ilji: Dizhi;            // 일지 (지지)
  iljiWuxing: Wuxing;     // 일지의 오행
  wolgeon: Dizhi;         // 월건 (월지, 절기 기준)
  wolWuxing: Wuxing;      // 월건의 오행
}

// ─── 용신 정보 ──────────────────────────────────────────────

/** 특정 카테고리의 용신 정보 */
export interface YongsinInfo {
  category: string;             // 카테고리명 (책 원문 키)
  yongsinType: Liuqin | '世' | '應';  // 용신의 육친 (또는 세/응 특수)
  yongsinLiuqin: Liuqin;       // 실제 육친 (世/應일 때 해당 효의 육친)
  yongsinYaoIndices: number[];  // 용신이 위치한 효 인덱스 (0-5)
  yongsinDizhi: Dizhi[];        // 용신 효의 지지
  yongsinWuxing: Wuxing;        // 용신의 오행
}

// ─── 원신·기신·구신 ─────────────────────────────────────────

/** 용신을 돕거나 해치는 세력 */
export interface SpiritInfo {
  liuqin: Liuqin;
  wuxing: Wuxing;
  present: boolean;         // 괘 내에 해당 육친이 존재하는지
  yaoIndices: number[];     // 해당 육친이 위치한 효 인덱스
  isChanging: boolean;      // 동효인지 여부 (하나라도)
}

export interface WonGiGuInfo {
  wonsin: SpiritInfo;   // 원신: 용신을 생하는 육친
  gisin: SpiritInfo;    // 기신: 용신을 극하는 육친
  gusin: SpiritInfo;    // 구신: 기신을 생하는 육친
}

// ─── 강약 요소 ──────────────────────────────────────────────

/** 개별 강약 요인 */
export interface StrengthFactor {
  source: string;       // "월건" | "일진" | "동효" | "원신" | "기신" 등
  effect: '강화' | '약화' | '중립';
  detail: string;       // 사람이 읽을 수 있는 설명
  weight: number;       // -2 ~ +2
}

// ─── 카테고리별 평가 결과 ───────────────────────────────────

/** 하나의 카테고리에 대한 종합 평가 */
export interface CategoryAssessment {
  category: string;
  yongsin: YongsinInfo;
  wonGiGu: WonGiGuInfo;
  wangSang: WangSangState;        // 용신의 월건 대비 왕쇠
  ilJinRelation: RelationType;    // 일진→용신 관계
  factors: StrengthFactor[];      // 모든 강약 요인
  totalScore: number;             // factors weight 합산
  verdict: Verdict;               // 종합 판정
  interpretation: string;         // 보충 해석문
}

// ─── 전체 분석 결과 ─────────────────────────────────────────

/** analyzeLiuYao()의 반환 타입 */
export interface LiuYaoAnalysis {
  dateContext: DateContext;
  assessments: CategoryAssessment[];
  summary: string;                // 전체 요약문
}
