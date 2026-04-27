/**
 * POST /api/saju/card
 *
 * SajuResult JSON을 받아 1080×1350 PNG 캐릭터 카드를 반환한다.
 *
 * Body: { sajuResult: SajuResult }
 * Response: image/png
 *
 * 에셋 경로 설정:
 *  환경변수 CARD_ASSET_DIR을 제3의시간_SNS/asset 경로로 지정하면 캐릭터/배경을 사용한다.
 *  예: CARD_ASSET_DIR=/Users/dan/제3의시간_SNS/asset
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { SajuResultSchema } from '@/src/engine/schema';
import { mapSajuToCard } from '@/src/card/stat-mapper';
import { renderCard } from '@/src/card/card-renderer';

const BodySchema = z.object({
  sajuResult: SajuResultSchema,
});

export async function POST(request: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: '요청 본문 파싱 실패' }, { status: 400 });
  }

  const parsed = BodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: '입력 검증 실패', details: parsed.error.issues },
      { status: 400 },
    );
  }

  try {
    const cardData = mapSajuToCard(parsed.data.sajuResult);
    const pngBuf = await renderCard(cardData);

    return new NextResponse(new Uint8Array(pngBuf), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': 'inline; filename="character-card.png"',
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[card] 카드 생성 실패:', message);
    return NextResponse.json({ error: '카드 생성 실패', message }, { status: 500 });
  }
}
