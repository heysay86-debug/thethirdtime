/**
 * 동시 분석 제한기
 *
 * LLM 호출이 ~40초 걸리므로 동시 분석 수를 제한.
 * 초과 시 503 + 대기 안내.
 */

const MAX_CONCURRENT = 5;
let current = 0;

export function tryAcquire(): boolean {
  if (current >= MAX_CONCURRENT) return false;
  current++;
  return true;
}

export function release(): void {
  current = Math.max(0, current - 1);
}

export function getCurrent(): number {
  return current;
}

export function getMax(): number {
  return MAX_CONCURRENT;
}
