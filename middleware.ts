/**
 * Next.js Edge Middleware — 악의적 AI 크롤러 차단
 *
 * robots.txt는 권고 사항이므로 무시하는 봇이 있다.
 * 여기서 User-Agent를 검사해 알려진 AI 학습용 봇을 서버 레벨에서 차단한다.
 *
 * 검색 추천(ChatGPT Browse, Perplexity)은 허용하기 위해
 * ChatGPT-User, PerplexityBot은 차단 목록에서 제외.
 */

import { NextRequest, NextResponse } from 'next/server';

const BLOCKED_BOTS = [
  'GPTBot',
  'CCBot',
  'Google-Extended',
  'anthropic-ai',
  'Claude-Web',
  'Bytespider',
  'cohere-ai',
  'Meta-ExternalAgent',
  'FacebookBot',
  'Applebot-Extended',
  'Diffbot',
  'Omgilibot',
  'Amazonbot',
];

const BLOCKED_RE = new RegExp(BLOCKED_BOTS.join('|'), 'i');

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') || '';

  if (BLOCKED_RE.test(ua)) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  return NextResponse.next();
}

export const config = {
  // 정적 파일, _next, favicon은 제외
  matcher: ['/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|mp3|ico)).*)'],
};
