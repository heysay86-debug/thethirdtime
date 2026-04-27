/**
 * GET /api/auth/kakao — 카카오 로그인 시작
 *
 * 카카오 인가 코드 요청 URL로 리다이렉트한다.
 * REST API 키는 서버에서만 사용 (클라이언트 노출 금지).
 */

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) {
    return NextResponse.json(
      { error: 'Kakao API key not configured' },
      { status: 500 },
    );
  }

  const redirectUri = 'https://ttt.betterdan.net/api/auth/kakao/callback';

  const kakaoAuthUrl = new URL('https://kauth.kakao.com/oauth/authorize');
  kakaoAuthUrl.searchParams.set('client_id', kakaoKey);
  kakaoAuthUrl.searchParams.set('redirect_uri', redirectUri);
  kakaoAuthUrl.searchParams.set('response_type', 'code');

  return NextResponse.redirect(kakaoAuthUrl.toString());
}
