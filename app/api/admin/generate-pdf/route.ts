/**
 * POST /api/admin/generate-pdf?token=XXX
 *
 * 어드민 전용: 명식 입력 → 엔진+Phase1+Phase2+PDF 한 번에 처리
 * SSE 불필요, 동기 응답으로 PDF 바이너리 반환
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import fs from 'fs';
import path from 'path';
import { renderToBuffer } from '@react-pdf/renderer';
import { analyzeSaju } from '@/src/engine/analyze';
import { SajuGateway } from '@/src/gateway/gateway';
import { saveReport } from '@/src/db';
import SajuReport from '@/src/pdf/SajuReport';
import { savePdfCopy } from '@/src/db/pdf-storage';
import { adminAuth } from '@/src/middleware/admin-auth';

export async function POST(request: NextRequest) {
  if (!adminAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { name, birthDate, birthTime, gender = 'M', calendar = 'solar' } = body;

    if (!name || !birthDate) {
      return NextResponse.json({ error: '이름과 생년월일 필수' }, { status: 400 });
    }

    // 1) 엔진
    const input: any = { birthDate, calendar, gender };
    if (birthTime) input.birthTime = birthTime;
    input.birthCity = '서울';
    const engine = analyzeSaju(input);

    // DB 저장
    let reportNo: string | null = null;
    try {
      const info = saveReport(name, engine);
      reportNo = info.reportNo;
    } catch {}

    // 2) Phase 1
    const gw = new SajuGateway();
    const phase1 = await gw.analyzePhase1(engine);

    // 3) Phase 2
    const phase2 = await gw.analyzePhase2(engine, phase1.core);

    // 4) PDF
    const now = new Date();
    const analysisDate = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;
    const [y, m, d] = birthDate.split('-').map(Number);
    const [hh, mm] = birthTime ? birthTime.split(':').map(Number) : [12, 0];
    const birthDateUtc = new Date(Date.UTC(y, m - 1, d, hh - 9, mm));

    const interpretation = {
      summary: phase1.core.summary,
      sections: {
        basics: phase2.sections.basics,
        coreJudgment: {
          strengthReading: phase1.core.strengthReading,
          gyeokGukReading: phase1.core.gyeokGukReading,
          yongSinReading: phase1.core.yongSinReading,
        },
        ohengAnalysis: phase2.sections.ohengAnalysis,
        sipseongAnalysis: phase2.sections.sipseongAnalysis,
        relations: phase2.sections.relations,
        daeunReading: phase2.sections.daeunReading,
        overallReading: phase2.sections.overallReading,
      },
    };

    const buffer = await renderToBuffer(
      React.createElement(SajuReport, {
        userName: name,
        analysisDate,
        birthDateUtc,
        birthTimeKnown: !!birthTime,
        gender: gender === 'F' ? '여' : '남',
        sajuResult: engine,
        interpretation,
        reportNo,
      }) as any
    );

    const fileName = reportNo || 'admin-report';

    // 서버에 사본 저장
    try { await savePdfCopy(fileName, Buffer.from(buffer)); } catch {}

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}.pdf"; filename*=UTF-8''${encodeURIComponent(`${fileName}.pdf`)}`,
      },
    });
  } catch (error) {
    console.error('[Admin PDF] 실패:', error);
    const msg = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
