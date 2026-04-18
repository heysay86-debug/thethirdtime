/**
 * 비식별 데이터 데이터베이스
 *
 * 개인정보보호법 준수: 비식별 데이터만 저장
 * - report_no: T3-XX-YYMMDD-A001XXXX (XX=결제카운트, XXXX=요청순번)
 * - order_id: 토스페이먼츠 연동 키
 * - channel: 유입채널 코드
 * - char_name: 유저 캐릭터 닉네임
 * - keyword1~3: 사주 분석 결과 요약
 * - created_at: 생성 시각
 */

import Database from 'better-sqlite3';
import path from 'path';
import { DEFAULT_CHANNEL, isValidChannel } from './channels';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'reports.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        report_no VARCHAR PRIMARY KEY,
        order_id VARCHAR,
        channel VARCHAR NOT NULL DEFAULT 'A001',
        char_name VARCHAR NOT NULL DEFAULT '',
        keyword1 VARCHAR NOT NULL DEFAULT '',
        keyword2 VARCHAR NOT NULL DEFAULT '',
        keyword3 VARCHAR NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT (datetime('now', '+9 hours'))
      )
    `);
    // 결제 유저 카운트 관리
    db.exec(`
      CREATE TABLE IF NOT EXISTS counter (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        paid_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    // 초기값 삽입 (이미 있으면 무시)
    db.exec(`INSERT OR IGNORE INTO counter (id, paid_count) VALUES (1, 0)`);
  }
  return db;
}

/**
 * 현재 결제 카운트 조회
 */
function getPaidCount(): number {
  const d = getDb();
  const row = d.prepare(`SELECT paid_count FROM counter WHERE id = 1`).get() as { paid_count: number };
  return row?.paid_count || 0;
}

/**
 * 결제 카운트 증가 → 새 카운트 반환
 */
function incrementPaidCount(): number {
  const d = getDb();
  d.prepare(`UPDATE counter SET paid_count = paid_count + 1 WHERE id = 1`).run();
  return getPaidCount();
}

/**
 * 리포트번호 생성
 * 무료: T3-00-YYMMDD-A001XXXX
 * 유료: T3-XX-YYMMDD-A001XXXX (XX = 결제 카운트)
 */
function generateReportNo(channel: string, isPaid: boolean): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yy = String(kst.getFullYear()).slice(2);
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  // 결제 카운트: 무료=00, 유료=현재 카운트
  const count = isPaid ? String(incrementPaidCount()).padStart(2, '0') : '00';

  // 요청 순번: 같은 카운트 내 순번
  const d = getDb();
  const prefix = `T3-${count}-${dateStr}-${channel}`;
  const row = d.prepare(
    `SELECT COUNT(*) as cnt FROM reports WHERE report_no LIKE ?`
  ).get(`${prefix}%`) as { cnt: number };

  const seq = String(row?.cnt || 0).padStart(4, '0');
  return `${prefix}${seq}`;
}

/**
 * 엔진 결과에서 핵심키워드 3개 추출
 */
export function extractKeywords(engine: any): [string, string, string] {
  const k1 = engine?.gyeokGuk?.name
    ? `${engine.gyeokGuk.name}${engine.gyeokGuk.isBreak ? '(파격)' : ''}`
    : '미상';
  const k2 = engine?.strength?.level || '미상';
  const k3 = engine?.yongSin?.final?.yongSin
    ? `${engine.yongSin.final.yongSin}용신`
    : '미상';
  return [k1, k2, k3];
}

/**
 * 리포트 저장 (무료 분석 시)
 */
export function saveReport(charName: string, engine: any, channel?: string): { reportNo: string; keywords: [string, string, string] } {
  const d = getDb();
  const ch = channel && isValidChannel(channel) ? channel : DEFAULT_CHANNEL;
  const reportNo = generateReportNo(ch, false);
  const [k1, k2, k3] = extractKeywords(engine);

  d.prepare(
    `INSERT INTO reports (report_no, channel, char_name, keyword1, keyword2, keyword3) VALUES (?, ?, ?, ?, ?, ?)`
  ).run(reportNo, ch, charName, k1, k2, k3);

  return { reportNo, keywords: [k1, k2, k3] };
}

/**
 * 유료 리포트 저장 (결제 완료 시)
 */
export function savePaidReport(charName: string, engine: any, orderId: string, channel?: string): { reportNo: string; keywords: [string, string, string] } {
  const d = getDb();
  const ch = channel && isValidChannel(channel) ? channel : DEFAULT_CHANNEL;
  const reportNo = generateReportNo(ch, true);
  const [k1, k2, k3] = extractKeywords(engine);

  d.prepare(
    `INSERT INTO reports (report_no, order_id, channel, char_name, keyword1, keyword2, keyword3) VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).run(reportNo, orderId, ch, charName, k1, k2, k3);

  return { reportNo, keywords: [k1, k2, k3] };
}

/**
 * 결제 완료 시 기존 무료 리포트에 order_id 연결 + 유료 번호 재발급
 */
export function upgradeToPaid(freeReportNo: string, orderId: string): string | null {
  const d = getDb();
  const existing = d.prepare(`SELECT * FROM reports WHERE report_no = ?`).get(freeReportNo) as any;
  if (!existing) return null;

  const ch = existing.channel || DEFAULT_CHANNEL;
  const paidReportNo = generateReportNo(ch, true);

  d.prepare(
    `UPDATE reports SET report_no = ?, order_id = ? WHERE report_no = ?`
  ).run(paidReportNo, orderId, freeReportNo);

  return paidReportNo;
}

/**
 * 리포트번호로 조회
 */
export function getReport(reportNo: string) {
  const d = getDb();
  return d.prepare(`SELECT * FROM reports WHERE report_no = ?`).get(reportNo) as any | undefined;
}

/**
 * order_id로 조회
 */
export function getReportByOrderId(orderId: string) {
  const d = getDb();
  return d.prepare(`SELECT * FROM reports WHERE order_id = ?`).get(orderId) as any | undefined;
}

/**
 * 전체 리포트 목록 (관리용)
 */
export function listReports(limit = 100) {
  const d = getDb();
  return d.prepare(`SELECT * FROM reports ORDER BY created_at DESC LIMIT ?`).all(limit);
}
