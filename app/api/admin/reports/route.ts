/**
 * GET  /api/admin/reports?token=XXX&limit=100
 * DELETE /api/admin/reports?token=XXX&reportNo=T3-...
 *
 * 어드민 전용 리포트 조회/삭제 API.
 * ADMIN_TOKEN 환경변수로 인증.
 */

import { NextRequest, NextResponse } from 'next/server';
import { listReports, cleanupExpiredPayments } from '@/src/db';
import { getCurrent, getMax } from '@/src/middleware/concurrency';
import Database from 'better-sqlite3';
import path from 'path';

function getDb() {
  const dbPath = process.env.DB_PATH || path.join(process.cwd(), 'data', 'reports.db');
  return new Database(dbPath);
}

function auth(request: NextRequest): boolean {
  const token = request.nextUrl.searchParams.get('token');
  const adminToken = process.env.ADMIN_TOKEN;
  return !!adminToken && token === adminToken;
}

export async function GET(request: NextRequest) {
  if (!auth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const table = request.nextUrl.searchParams.get('table') || 'reports';
  const limit = parseInt(request.nextUrl.searchParams.get('limit') || '200');

  if (table === 'payments') {
    const db = getDb();
    const payments = db.prepare('SELECT * FROM payments ORDER BY created_at DESC LIMIT ?').all(limit);
    db.close();
    return NextResponse.json({ count: payments.length, table: 'payments', rows: payments });
  }

  if (table === 'counter') {
    const db = getDb();
    const daily = db.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as total,
        SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) as paid,
        SUM(CASE WHEN is_paid = 0 THEN 1 ELSE 0 END) as free
      FROM reports
      GROUP BY date(created_at)
      ORDER BY date(created_at) DESC
    `).all();
    const summary = db.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN is_paid = 1 THEN 1 ELSE 0 END) as paid
      FROM reports
    `).get();
    db.close();
    return NextResponse.json({ table: 'counter', daily, summary });
  }

  // cleanup expired payments on each admin visit
  cleanupExpiredPayments();

  const reports = listReports(limit);
  return NextResponse.json({ count: reports.length, table: 'reports', rows: reports, concurrent: { current: getCurrent(), max: getMax() } });
}

export async function DELETE(request: NextRequest) {
  if (!auth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const reportNo = request.nextUrl.searchParams.get('reportNo');
  if (!reportNo) {
    return NextResponse.json({ error: 'reportNo 필수' }, { status: 400 });
  }

  const db = getDb();
  const result = db.prepare('DELETE FROM reports WHERE report_no = ?').run(reportNo);
  db.close();

  if (result.changes === 0) {
    return NextResponse.json({ error: '해당 리포트 없음' }, { status: 404 });
  }

  return NextResponse.json({ ok: true, deleted: reportNo });
}
