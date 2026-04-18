/**
 * POST /api/saju/interpret — Phase 2 전체 해석 (SSE 스트리밍)
 *
 * 입력: { engine: SajuResult, core: CoreJudgment }
 * 출력: SSE 스트림
 *   - event: chunk → data: { text: "..." }
 *   - event: done  → data: { sections: Phase2Sections }
 *   - event: error → data: { error: "..." }
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SajuResultSchema } from '@/src/engine/schema';
import { SajuGateway } from '@/src/gateway/gateway';
import { checkRateLimit } from '@/src/middleware/rate-limit';
import { sanitizePersonalInfo, sanitizeSections } from '@/src/middleware/sanitize';
import { corsHeaders, handleOptions } from '../../cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

const InputSchema = z.object({
  engine: SajuResultSchema,
  core: z.object({
    summary: z.string(),
    strengthReading: z.string(),
    gyeokGukReading: z.string(),
    yongSinReading: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  // Rate Limiting
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? request.headers.get('x-real-ip')
    ?? 'unknown';
  const rateLimit = checkRateLimit(ip);

  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({ error: '요청 한도 초과', resetMs: rateLimit.resetMs }),
      { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } },
    );
  }

  let input: z.infer<typeof InputSchema>;
  try {
    const body = await request.json();
    input = InputSchema.parse(body);
  } catch {
    return new Response(
      JSON.stringify({ error: '입력 검증 실패' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const gw = new SajuGateway();

        const result = await gw.analyzePhase2(
          input.engine,
          input.core,
          (text) => {
            // SSE chunk: 개인정보 마스킹 후 전송
            const safeText = sanitizePersonalInfo(text);
            const data = JSON.stringify({ text: safeText });
            controller.enqueue(encoder.encode(`event: chunk\ndata: ${data}\n\n`));
          },
        );

        // 완료: 섹션 전체 마스킹 후 전송
        const safeSections = sanitizeSections(result.sections);
        const doneData = JSON.stringify({ sections: safeSections });
        controller.enqueue(encoder.encode(`event: done\ndata: ${doneData}\n\n`));
        controller.close();
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        const safeMessage = message.replace(/\d{4}-\d{2}-\d{2}/g, '[날짜]');
        const errorData = JSON.stringify({ error: safeMessage });
        controller.enqueue(encoder.encode(`event: error\ndata: ${errorData}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-RateLimit-Remaining': String(rateLimit.remaining),
    },
  });
}
