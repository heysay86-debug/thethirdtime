/**
 * Rate Limiting — 인메모리 슬라이딩 윈도우
 *
 * MVP: 서버 메모리 기반. 서버 재시작 시 초기화.
 * IP 기준 분당 호출 횟수 제한.
 */

const DEFAULT_WINDOW_MS = 60 * 1000; // 1분
const DEFAULT_MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_CHAT_PER_MINUTE ?? '10', 10);

interface RequestRecord {
  timestamps: number[];
}

const store = new Map<string, RequestRecord>();

// 주기적 정리 (5분마다 만료 기록 삭제)
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of store) {
    record.timestamps = record.timestamps.filter(t => now - t < DEFAULT_WINDOW_MS);
    if (record.timestamps.length === 0) store.delete(key);
  }
}, 5 * 60 * 1000).unref();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export function checkRateLimit(
  ip: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS,
): RateLimitResult {
  const now = Date.now();
  let record = store.get(ip);

  if (!record) {
    record = { timestamps: [] };
    store.set(ip, record);
  }

  // 윈도우 밖 기록 제거
  record.timestamps = record.timestamps.filter(t => now - t < windowMs);

  if (record.timestamps.length >= maxRequests) {
    const oldest = record.timestamps[0];
    return {
      allowed: false,
      remaining: 0,
      resetMs: oldest + windowMs - now,
    };
  }

  record.timestamps.push(now);
  return {
    allowed: true,
    remaining: maxRequests - record.timestamps.length,
    resetMs: windowMs,
  };
}
