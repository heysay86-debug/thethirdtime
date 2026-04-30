/**
 * 데일리 운세 — 타입 정의
 */

export interface DailyScore {
  label: string;       // '문서운' | '재물운' | '연애운' | '건강운'
  score: number;       // 0~100
  verdict: string;     // '대길' | '길' | '평' | '흉' | '대흉'
  detail: string;      // 한줄 해석
}

export interface DailyFortune {
  date: string;                // "2026.04.30"
  dateGanji: string;           // "丙午년 壬辰월 甲戌일"
  guaName: string;             // 본괘 이름
  jiGuaName: string;           // 지괘 이름
  changingYaoPos: number;      // 동효 위치 (1~6)
  scores: DailyScore[];        // 4대 운세
  totalScore: number;          // 총운 (0~100)
  totalVerdict: string;        // 총운 verdict
  jiGuaSummary: string;        // 지괘 총론 요약 (2~3줄)
}
