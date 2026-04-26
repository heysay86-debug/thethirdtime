/**
 * 어드민 인증 — 쿠키 또는 쿼리 파라미터 토큰
 * 쿠키 우선, 폴백으로 쿼리 파라미터 지원 (하위 호환)
 */

import { NextRequest } from 'next/server';

const COOKIE_NAME = 'admin_session';

export function adminAuth(request: NextRequest): boolean {
  const adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) return false;

  // 1. 쿠키 확인
  const cookieToken = request.cookies.get(COOKIE_NAME)?.value;
  if (cookieToken === adminToken) return true;

  // 2. 쿼리 파라미터 폴백
  const queryToken = request.nextUrl.searchParams.get('token');
  if (queryToken === adminToken) return true;

  return false;
}
