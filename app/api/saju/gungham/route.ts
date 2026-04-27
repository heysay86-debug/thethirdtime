/**
 * POST /api/saju/gungham -- 궁합 분석 API
 *
 * 입력: { persons: [...], relationType }
 * 출력: GunghamResult JSON
 * LLM 미사용, 엔진만으로 처리.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { analyzeGungham } from '@/src/engine/gungham';
import { corsHeaders, handleOptions } from '../../cors';
import { checkRateLimit } from '@/src/middleware/rate-limit';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

const PersonSchema = z.object({
  name: z.string().min(1).max(20),
  birthDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  birthTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  gender: z.enum(['M', 'F']),
  calendar: z.enum(['solar', 'lunar']).optional(),
  birthCity: z.string().optional(),
});

const InputSchema = z.object({
  persons: z.array(PersonSchema).min(2).max(3),
  relationType: z.enum([
    'couple', 'parent_child', 'friend', 'business', 'boss_sub',
    'team', 'family', 'friends',
  ]),
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
      { status: 429, headers: { ...cors, 'Retry-After': String(Math.ceil(rateLimit.resetMs / 1000)) } },
    );
  }

  try {
    const body = await request.json();
    const input = InputSchema.parse(body);

    const result = analyzeGungham(input);

    // 개인정보 sanitize: 결과에 생년월일시가 포함되지 않음 (사주 기둥만 반환)
    return NextResponse.json(result, {
      headers: {
        ...cors,
        'X-RateLimit-Remaining': String(rateLimit.remaining),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: '입력 검증 실패', details: error.issues },
        { status: 400, headers: cors },
      );
    }
    const message = error instanceof Error ? error.message : 'Unknown error';
    // 개인정보 마스킹
    const safeMessage = message.replace(/\d{4}-\d{2}-\d{2}/g, '[날짜]');
    return NextResponse.json(
      { error: '분석 실패', message: safeMessage },
      { status: 500, headers: cors },
    );
  }
}
