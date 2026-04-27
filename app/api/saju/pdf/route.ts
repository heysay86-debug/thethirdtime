/**
 * POST /api/saju/pdf — PDF 리포트 생성 및 다운로드
 *
 * 입력: { engine, core, sections, userName? }
 * 출력: application/pdf 바이너리
 */

import { NextRequest, NextResponse } from 'next/server';
import React from 'react';
import { renderToBuffer } from '@react-pdf/renderer';
import SajuReport from '@/src/pdf/SajuReport';
import { savePdfCopy } from '@/src/db/pdf-storage';
import { sanitizeSections } from '@/src/middleware/sanitize';
import { corsHeaders, handleOptions } from '../../cors';

export async function OPTIONS(request: NextRequest) {
  return handleOptions(request);
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get('origin');
  const cors = corsHeaders(origin);

  try {
    const body = await request.json();
    const { engine, core, sections, easyReadings = null, userName = '분석 대상자', reportNo = null } = body;

    if (!engine || !core) {
      return NextResponse.json(
        { error: '엔진 데이터가 필요합니다' },
        { status: 400, headers: cors },
      );
    }

    // 분석일
    const now = new Date();
    const analysisDate = `${now.getFullYear()}. ${now.getMonth() + 1}. ${now.getDate()}`;

    // 출생일 UTC 변환
    const birth = engine.birth;
    const [y, m, d] = (birth?.solar || '1990-01-01').split('-').map(Number);
    const [hh, mm] = (birth?.time || '12:00').split(':').map(Number);
    const birthDateUtc = new Date(Date.UTC(y, m - 1, d, hh - 9, mm)); // KST → UTC

    // 방어적 마스킹: 클라이언트에서 이미 마스킹된 데이터가 오지만, 한 번 더 확인
    const safeCore = sanitizeSections(core);
    const safeSections = sections ? sanitizeSections(sections) : null;
    const safeEasyReadings = easyReadings ? sanitizeSections(easyReadings) : null;

    // LLM 해석 결과를 InterpretationResult 형태로 합성
    const interpretation = safeSections ? {
      summary: safeCore.summary || '',
      sections: {
        basics: { description: safeSections.basics?.description || '' },
        coreJudgment: {
          strengthReading: safeCore.strengthReading || '',
          gyeokGukReading: safeCore.gyeokGukReading || '',
          yongSinReading: safeCore.yongSinReading || '',
        },
        pillarAnalysis: safeSections.pillarAnalysis || { year: '', month: '', day: '', hour: null },
        ohengAnalysis: safeSections.ohengAnalysis || { distribution: '', johu: '' },
        sipseongAnalysis: safeSections.sipseongAnalysis || { reading: '' },
        relations: safeSections.relations || { reading: '' },
        daeunReading: safeSections.daeunReading || null,
        overallReading: safeSections.overallReading || { primary: '', modernApplication: '' },
      },
    } : null;

    // PDF 렌더링
    const buffer = await renderToBuffer(
      React.createElement(SajuReport, {
        userName,
        analysisDate,
        birthDateUtc,
        birthTimeKnown: !!birth?.time,
        gender: engine.gender === 'F' ? '여' : '남',
        sajuResult: engine,
        interpretation,
        easyReadings: safeEasyReadings,
        reportNo,
      }) as any
    );

    // 서버에 사본 저장
    const pdfFileName = reportNo || 'saju-report';
    try { await savePdfCopy(pdfFileName, Buffer.from(buffer)); } catch {}

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        ...cors,
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName}.pdf"; filename*=UTF-8''${encodeURIComponent(reportNo ? `${reportNo}.pdf` : `사주리포트-${userName}.pdf`)}`,
      },
    });
  } catch (error) {
    console.error('[PDF] 생성 실패:', error);
    return NextResponse.json(
      { error: 'PDF 생성 실패' },
      { status: 500, headers: cors },
    );
  }
}
