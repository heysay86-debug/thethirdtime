/**
 * GET /api/auth/me — 현재 로그인 유저 정보
 *
 * 응답: { user: { kakaoId, nickname, profileImage, golgolBalance } } 또는 { user: null }
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/src/middleware/auth';
import { getUserByKakaoId } from '@/src/db/users';

export async function GET(request: NextRequest) {
  const kakaoId = getAuthUser(request);

  if (!kakaoId) {
    return NextResponse.json({ user: null });
  }

  const user = getUserByKakaoId(kakaoId);
  if (!user) {
    return NextResponse.json({ user: null });
  }

  return NextResponse.json({
    user: {
      kakaoId: user.kakao_id,
      nickname: user.nickname,
      profileImage: user.profile_image,
      golgolBalance: user.golgol_balance,
    },
  });
}
