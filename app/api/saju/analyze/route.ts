/**
 * POST /api/saju/analyze — Phase 1 핵심 판단
 *
 * 입력: { birthDate, birthTime?, calendar, isLeapMonth?, birthCity?, gender? }
 * 출력: { engine, core, sessionId, cached }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeSaju } from '@/src/engine/analyze';
import { SajuGateway } from '@/src/gateway/gateway';
import { saveReport } from '@/src/db';
import { corsHeaders, handleOptions } from '../../cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}
import { checkRateLimit } from '@/src/middleware/rate-limit';
import { sanitizeSections } from '@/src/middleware/sanitize';
import { getOrCreateSession, updateSession, hashInput, SESSION_COOKIE_NAME } from '@/src/middleware/session';
import { tryAcquire, release } from '@/src/middleware/concurrency';

const InputSchema = z.object({
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  calendar: z.enum(['solar', 'lunar']),
  isLeapMonth: z.boolean().optional(),
  birthCity: z.string().optional(),
  gender: z.enum(['M', 'F']).optional(),
  name: z.string().optional(),
  channel: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: '요청 한도 초과. 잠시 후 다시 시도하세요.', resetMs: rateLimit.resetMs },
      { status: 429, headers: { 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } },
    );
  }

  // 동시 분석 제한
  if (!tryAcquire()) {
    return NextResponse.json(
      { error: '현재 다른 분석이 진행 중입니다. 잠시 후 다시 시도해주세요.', retryAfter: 30 },
      { status: 503, headers: { ...cors, 'Retry-After': '30' } },
    );
  }

  try {
    const body = await request.json();
    const input = InputSchema.parse(body);

    // 세션
    const existingSessionId = request.cookies.get(SESSION_COOKIE_NAME)?.value ?? null;
    const session = getOrCreateSession(existingSessionId);
    const inputHash = hashInput(input);

    // 캐시 히트: 동일 입력이면 재계산 스킵 (슬롯 즉시 반환)
    if (session.lastInputHash === inputHash && session.engine && session.core) {
      release();
      const response = NextResponse.json({
        engine: session.engine,
        core: session.core,
        sessionId: session.id,
        cached: true,
      }, {
        headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) },
      });
      response.cookies.set(SESSION_COOKIE_NAME, session.id, { httpOnly: true, maxAge: 86400, sameSite: 'lax' });
      return response;
    }

    // 엔진 분석
    const engine = analyzeSaju(input);

    // 익명화된 리포트 저장
    let reportInfo;
    try {
      reportInfo = saveReport(input.name || '여행자', engine, input.channel);
    } catch (e) {
      console.warn('[DB] 리포트 저장 실패 (서비스 영향 없음):', e);
    }

    // Phase 1 LLM 호출
    const gw = new SajuGateway();
    const phase1 = await gw.analyzePhase1(engine);
    const sanitizedCore = sanitizeSections(phase1.core);

    // 세션 저장
    updateSession(session.id, {
      lastInputHash: inputHash,
      engine,
      core: sanitizedCore,
      sections: null, // Phase 2 결과 초기화
    });

    const response = NextResponse.json({
      engine,
      core: sanitizedCore,
      sessionId: session.id,
      reportNo: reportInfo?.reportNo || null,
      cached: false,
      usage: phase1.usage,
      elapsedMs: phase1.elapsedMs,
    }, {
      headers: { 'X-RateLimit-Remaining': String(rateLimit.remaining) },
    });
    response.cookies.set(SESSION_COOKIE_NAME, session.id, { httpOnly: true, maxAge: 86400, sameSite: 'lax' });
    return response;
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 검증 실패', details: error.issues },
        { status: 400 },
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    const safeMessage = message.replace(/\d{4}-\d{2}-\d{2}/g, '[날짜]');
    return NextResponse.json(
      { error: '분석 실패', message: safeMessage },
      { status: 500 },
    );
  } finally {
    release();
  }
}
