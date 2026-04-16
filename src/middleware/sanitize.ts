/**
 * 개인정보 보호 — LLM 응답 내 생년월일시 마스킹
 *
 * LLM이 시스템 프롬프트 지침을 무시하고 개인정보를 포함할 수 있으므로,
 * 서버 측에서 최종 방어선으로 마스킹 처리.
 */

// 날짜 패턴: YYYY-MM-DD, YYYY년 M월 D일, YYYY.MM.DD
const DATE_PATTERNS = [
  /\d{4}[-./]\d{1,2}[-./]\d{1,2}/g,
  /\d{4}년\s*\d{1,2}월\s*\d{1,2}일/g,
];

// 시각 패턴: HH:MM, H시 M분
const TIME_PATTERNS = [
  /\d{1,2}:\d{2}(?::\d{2})?/g,
  /\d{1,2}시\s*\d{1,2}분/g,
];

/**
 * 텍스트 내 생년월일시 패턴을 마스킹한다.
 * 해석문에서 간지·오행 표현은 유지하되, 양력 날짜/시각은 제거.
 */
export function sanitizePersonalInfo(text: string): string {
  let result = text;
  for (const pattern of DATE_PATTERNS) {
    result = result.replace(pattern, '[날짜]');
  }
  for (const pattern of TIME_PATTERNS) {
    result = result.replace(pattern, '[시각]');
  }
  return result;
}

/**
 * Phase 2 섹션 객체의 모든 문자열 필드를 재귀적으로 마스킹한다.
 */
export function sanitizeSections<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizePersonalInfo(obj) as T;
  if (Array.isArray(obj)) return obj.map(item => sanitizeSections(item)) as T;
  if (typeof obj === 'object') {
    const result: any = {};
    for (const [key, value] of Object.entries(obj as any)) {
      result[key] = sanitizeSections(value);
    }
    return result as T;
  }
  return obj;
}
