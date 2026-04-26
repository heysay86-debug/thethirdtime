/**
 * POST /api/auth/save-result
 *
 * 이메일 + 리포트 번호를 연결 저장 (stub)
 * 추후 Supabase Auth magic link + DB 연동으로 교체
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const SAVE_FILE = path.join(process.env.DB_PATH ? path.dirname(process.env.DB_PATH) : '/data', 'saved-results.json');

export async function POST(request: NextRequest) {
  try {
    const { email, reportNo } = await request.json();

    if (!email || !reportNo) {
      return NextResponse.json({ success: false, message: '필수 정보가 누락되었습니다.' }, { status: 400 });
    }

    // 이메일 형식 검증
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, message: '올바른 이메일을 입력해주세요.' }, { status: 400 });
    }

    // 파일에 append (stub — 추후 Supabase DB로 교체)
    let records: any[] = [];
    try {
      if (fs.existsSync(SAVE_FILE)) {
        records = JSON.parse(fs.readFileSync(SAVE_FILE, 'utf-8'));
      }
    } catch {}

    // 중복 방지
    if (records.some((r: any) => r.email === email && r.reportNo === reportNo)) {
      return NextResponse.json({ success: true, message: '이미 저장되어 있습니다.' });
    }

    records.push({
      email,
      reportNo,
      savedAt: new Date().toISOString(),
    });

    fs.writeFileSync(SAVE_FILE, JSON.stringify(records, null, 2));

    return NextResponse.json({ success: true, message: '저장되었습니다.' });
  } catch {
    return NextResponse.json({ success: false, message: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
