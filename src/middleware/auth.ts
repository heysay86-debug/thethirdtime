/**
 * 인증 세션 관리 — HMAC 서명 토큰 + httpOnly 쿠키
 *
 * JWT 라이브러리 없이 Node.js crypto로 구현.
 * 토큰 구조: base64url(payload).base64url(hmac-sha256)
 * payload: { kakaoId, exp }
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'auth_token';
const TOKEN_TTL_SECONDS = 30 * 24 * 60 * 60; // 30일

function getSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error('SESSION_SECRET 환경변수가 설정되지 않았습니다');
  return secret;
}

// ─── base64url 유틸 ────────────────────────────────────────

function toBase64Url(data: string): string {
  return Buffer.from(data, 'utf-8').toString('base64url');
}

function fromBase64Url(b64: string): string {
  return Buffer.from(b64, 'base64url').toString('utf-8');
}

// ─── 토큰 생성/검증 ───────────────────────────────────────

interface TokenPayload {
  kakaoId: string;
  exp: number;
}

function sign(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

export function createAuthToken(kakaoId: string): string {
  const payload: TokenPayload = {
    kakaoId,
    exp: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
  };
  const payloadStr = toBase64Url(JSON.stringify(payload));
  const signature = sign(payloadStr, getSecret());
  return `${payloadStr}.${signature}`;
}

export function verifyAuthToken(token: string): TokenPayload | null {
  try {
    const [payloadStr, signature] = token.split('.');
    if (!payloadStr || !signature) return null;

    const expectedSig = sign(payloadStr, getSecret());
    const sigBuf = Buffer.from(signature, 'base64url');
    const expectedBuf = Buffer.from(expectedSig, 'base64url');

    if (sigBuf.length !== expectedBuf.length) return null;
    if (!timingSafeEqual(sigBuf, expectedBuf)) return null;

    const payload: TokenPayload = JSON.parse(fromBase64Url(payloadStr));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

// ─── 쿠키 헬퍼 ────────────────────────────────────────────

/**
 * 인증 쿠키를 응답에 설정한다.
 */
export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_TTL_SECONDS,
  });
}

/**
 * 인증 쿠키를 삭제한다.
 */
export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(AUTH_COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

/**
 * 요청에서 인증된 kakaoId를 추출한다.
 * 미인증이면 null.
 */
export function getAuthUser(request: NextRequest): string | null {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = verifyAuthToken(token);
  return payload?.kakaoId ?? null;
}

export { AUTH_COOKIE_NAME };
