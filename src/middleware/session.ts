/**
 * 세션 관리 — 인메모리 (MVP)
 *
 * 쿠키 기반 세션 ID + 서버 메모리 저장.
 * 동일 입력 재요청 시 엔진 재계산 방지 (결과 캐싱).
 * TTL: 24시간 (.env SESSION_TTL_SECONDS)
 */

import { randomUUID } from 'crypto';
import type { SajuResult } from '../engine/schema';
import type { CoreJudgment, Phase2Sections } from '../gateway/gateway';

const SESSION_TTL = parseInt(process.env.SESSION_TTL_SECONDS ?? '86400', 10) * 1000;

export interface SessionData {
  id: string;
  createdAt: number;
  /** 마지막 분석 입력 해시 (재계산 방지용) */
  lastInputHash: string | null;
  /** 캐싱된 엔진 결과 */
  engine: SajuResult | null;
  /** 캐싱된 Phase 1 결과 */
  core: CoreJudgment | null;
  /** 캐싱된 Phase 2 결과 */
  sections: Phase2Sections | null;
}

const store = new Map<string, SessionData>();

// 주기적 만료 정리 (10분마다)
setInterval(() => {
  const now = Date.now();
  for (const [id, session] of store) {
    if (now - session.createdAt > SESSION_TTL) {
      store.delete(id);
    }
  }
}, 10 * 60 * 1000).unref();

/**
 * 세션을 가져오거나 생성한다.
 */
export function getOrCreateSession(sessionId: string | null): SessionData {
  if (sessionId && store.has(sessionId)) {
    const session = store.get(sessionId)!;
    // TTL 체크
    if (Date.now() - session.createdAt < SESSION_TTL) {
      return session;
    }
    store.delete(sessionId);
  }

  const newSession: SessionData = {
    id: randomUUID(),
    createdAt: Date.now(),
    lastInputHash: null,
    engine: null,
    core: null,
    sections: null,
  };
  store.set(newSession.id, newSession);
  return newSession;
}

/**
 * 세션 데이터를 업데이트한다.
 */
export function updateSession(id: string, data: Partial<SessionData>): void {
  const session = store.get(id);
  if (session) {
    Object.assign(session, data);
  }
}

/**
 * 입력 해시를 생성한다 (동일 입력 판별용).
 */
export function hashInput(input: { birthDate: string; birthTime?: string; calendar: string; gender?: string; birthCity?: string }): string {
  return `${input.birthDate}|${input.birthTime ?? ''}|${input.calendar}|${input.gender ?? ''}|${input.birthCity ?? ''}`;
}

export const SESSION_COOKIE_NAME = 'saju_session';
