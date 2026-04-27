/**
 * POST /api/auth/logout — 로그아웃
 *
 * 인증 쿠키를 삭제한다.
 */

import { NextResponse } from 'next/server';
import { clearAuthCookie } from '@/src/middleware/auth';

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookie(response);
  return response;
}
