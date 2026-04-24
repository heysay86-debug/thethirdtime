/**
 * 동시 분석 제한기 — 대기열 방식
 *
 * 503 거절 대신, 대기열에 넣고 순번을 알려줌.
 * 프론트에서 폴링하여 자리가 나면 자동 진행.
 */

const MAX_CONCURRENT = parseInt(process.env.MAX_CONCURRENT || '5');
let current = 0;

// 대기열
type Waiter = { resolve: () => void; id: string };
const queue: Waiter[] = [];

export function tryAcquire(): boolean {
  if (current >= MAX_CONCURRENT) return false;
  current++;
  return true;
}

/**
 * 대기열에 등록하고 Promise 반환.
 * 자리가 나면 resolve됨. 타임아웃 시 reject.
 */
export function waitForSlot(timeoutMs = 120000): Promise<void> {
  if (current < MAX_CONCURRENT) {
    current++;
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    const id = Math.random().toString(36).slice(2);
    const waiter: Waiter = { resolve, id };
    queue.push(waiter);

    const timer = setTimeout(() => {
      const idx = queue.indexOf(waiter);
      if (idx >= 0) queue.splice(idx, 1);
      reject(new Error('queue_timeout'));
    }, timeoutMs);

    const origResolve = waiter.resolve;
    waiter.resolve = () => {
      clearTimeout(timer);
      origResolve();
    };
  });
}

export function release(): void {
  current = Math.max(0, current - 1);

  // 대기열에서 다음 요청 활성화
  if (queue.length > 0 && current < MAX_CONCURRENT) {
    current++;
    const next = queue.shift()!;
    next.resolve();
  }
}

export function getCurrent(): number {
  return current;
}

export function getMax(): number {
  return MAX_CONCURRENT;
}

export function getQueueLength(): number {
  return queue.length;
}
