/**
 * POST /api/admin/auth — 어드민 로그인 (쿠키 발급)
 * DELETE /api/admin/auth — 어드민 로그아웃 (쿠키 삭제)
 */

import { NextRequest, NextResponse } from 'next/server';

const COOKIE_NAME = 'admin_session';
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8시간

export async function POST(request: NextRequest) {
  const { token } = await request.json();
  const adminToken = process.env.ADMIN_TOKEN;

  if (!adminToken || token !== adminToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, adminToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
