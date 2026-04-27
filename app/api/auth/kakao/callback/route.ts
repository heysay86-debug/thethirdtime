/**
 * GET /api/auth/kakao/callback — 카카오 OAuth 콜백
 *
 * 흐름: 인가 코드 → 액세스 토큰 → 유저 정보 → DB upsert → 세션 쿠키 발급 → 메인 리다이렉트
 */

import { NextRequest, NextResponse } from 'next/server';
import { upsertKakaoUser } from '@/src/db/users';
import { createAuthToken, setAuthCookie } from '@/src/middleware/auth';

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const error = request.nextUrl.searchParams.get('error');

  // 에러 또는 코드 없음
  if (error || !code) {
    console.error('[kakao-callback] error:', error || 'no code');
    return NextResponse.redirect('https://ttt.betterdan.net/?login=failed');
  }

  const kakaoKey = process.env.KAKAO_REST_API_KEY;
  if (!kakaoKey) {
    return NextResponse.redirect('https://ttt.betterdan.net/?login=failed');
  }

  const redirectUri = 'https://ttt.betterdan.net/api/auth/kakao/callback';

  try {
    // 1. 인가 코드 → 액세스 토큰
    const tokenRes = await fetch('https://kauth.kakao.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: kakaoKey,
        redirect_uri: redirectUri,
        code,
        ...(process.env.KAKAO_CLIENT_SECRET ? { client_secret: process.env.KAKAO_CLIENT_SECRET } : {}),
      }),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      console.error('[kakao-callback] token error:', tokenRes.status, text);
      return NextResponse.json({ step: 'token', status: tokenRes.status, detail: text }, { status: 502 });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    if (!accessToken) {
      console.error('[kakao-callback] no access_token in response');
      return NextResponse.json({ step: 'no_access_token', tokenData }, { status: 502 });
    }

    // 2. 액세스 토큰 → 유저 정보
    const userRes = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!userRes.ok) {
      const text = await userRes.text();
      console.error('[kakao-callback] user info error:', userRes.status, text);
      return NextResponse.json({ step: 'user_info', status: userRes.status, detail: text }, { status: 502 });
    }

    const userData = await userRes.json();
    const kakaoId = String(userData.id);
    const nickname = userData.kakao_account?.profile?.nickname || userData.properties?.nickname || '';
    const profileImage = userData.kakao_account?.profile?.thumbnail_image_url || userData.properties?.thumbnail_image || '';
    const email = userData.kakao_account?.email || '';

    // 3. DB upsert
    upsertKakaoUser(kakaoId, nickname, profileImage, email);

    // 4. 세션 쿠키 발급 + 메인 리다이렉트
    const token = createAuthToken(kakaoId);
    const baseUrl = 'https://ttt.betterdan.net';
    const response = NextResponse.redirect(`${baseUrl}/`);
    setAuthCookie(response, token);

    return response;
  } catch (err) {
    console.error('[kakao-callback] unexpected error:', err);
    return NextResponse.json({ step: 'unexpected', error: String(err) }, { status: 500 });
  }
}
