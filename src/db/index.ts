/**
 * 비식별 데이터 데이터베이스
 *
 * 개인정보보호법 준수:
 * - reports: 비식별 데이터만 영구 저장. char_name은 마스킹 처리.
 * - payments: 결제 검증용 임시 테이블. 24시간 후 자동 삭제.
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

    // 비식별 리포트 (영구)
    db.exec(`
      CREATE TABLE IF NOT EXISTS reports (
        report_no VARCHAR PRIMARY KEY,
        channel VARCHAR NOT NULL DEFAULT 'A001',
        char_name VARCHAR NOT NULL DEFAULT '',
        keyword1 VARCHAR NOT NULL DEFAULT '',
        keyword2 VARCHAR NOT NULL DEFAULT '',
        keyword3 VARCHAR NOT NULL DEFAULT '',
        is_paid INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT (datetime('now', '+9 hours'))
      )
    `);

    // age_group 컬럼 추가 (기존 DB 마이그레이션)
    try {
      db.exec(`ALTER TABLE reports ADD COLUMN age_group VARCHAR NOT NULL DEFAULT ''`);
    } catch {
      // 이미 존재하면 무시
    }

    // gender 컬럼 추가
    try {
      db.exec(`ALTER TABLE reports ADD COLUMN gender VARCHAR NOT NULL DEFAULT ''`);
    } catch {}

    // 결제 검증 (휘발성, 24시간 TTL)
    db.exec(`
      CREATE TABLE IF NOT EXISTS payments (
        order_id VARCHAR PRIMARY KEY,
        report_no VARCHAR NOT NULL,
        created_at DATETIME NOT NULL DEFAULT (datetime('now', '+9 hours'))
      )
    `);

    // 결제 카운트
    db.exec(`
      CREATE TABLE IF NOT EXISTS counter (
        id INTEGER PRIMARY KEY CHECK (id = 1),
        paid_count INTEGER NOT NULL DEFAULT 0
      )
    `);
    db.exec(`INSERT OR IGNORE INTO counter (id, paid_count) VALUES (1, 0)`);

    // 기존 reports 테이블에 order_id 컬럼이 있으면 데이터 마이그레이션
    migrateOrderId(db);

    // 만료된 결제 레코드 정리
    purgeExpiredPayments(db);
  }
  return db;
}

/**
 * 기존 reports.order_id → payments 테이블로 마이그레이션
 */
function migrateOrderId(d: Database.Database) {
  try {
    const cols = d.prepare(`PRAGMA table_info(reports)`).all() as Array<{ name: string }>;
    if (!cols.some(c => c.name === 'order_id')) return;

    // order_id가 있는 행을 payments로 이동
    const rows = d.prepare(`SELECT report_no, order_id FROM reports WHERE order_id IS NOT NULL AND order_id != ''`).all() as any[];
    for (const row of rows) {
      d.prepare(`INSERT OR IGNORE INTO payments (order_id, report_no) VALUES (?, ?)`).run(row.order_id, row.report_no);
    }

    // is_paid 컬럼이 없으면 추가
    if (!cols.some(c => c.name === 'is_paid')) {
      d.exec(`ALTER TABLE reports ADD COLUMN is_paid INTEGER NOT NULL DEFAULT 0`);
      d.prepare(`UPDATE reports SET is_paid = 1 WHERE order_id IS NOT NULL AND order_id != ''`).run();
    }

    // order_id 컬럼은 SQLite에서 DROP COLUMN 불가 → 그냥 null로 비움
    d.prepare(`UPDATE reports SET order_id = NULL WHERE order_id IS NOT NULL`).run();
  } catch {
    // 마이그레이션 실패해도 서비스 중단 없이 진행
  }
}

/**
 * 24시간 지난 결제 레코드 삭제
 */
function purgeExpiredPayments(d: Database.Database) {
  d.prepare(`DELETE FROM payments WHERE created_at < datetime('now', '+9 hours', '-48 hours')`).run();
}

// ─── 이름 마스킹 ────────────────────────────────────────────

function maskName(name: string): string {
  if (!name) return '';
  const chars = [...name]; // 유니코드 안전 분해
  if (chars.length <= 1) return chars[0] || '';
  if (chars.length === 2) return chars[0] + '*';
  // 3글자 이상: 첫 글자 + * × (중간) + 끝 글자
  return chars[0] + '*'.repeat(chars.length - 2) + chars[chars.length - 1];
}

// ─── 카운터 ─────────────────────────────────────────────────

function getPaidCount(): number {
  const d = getDb();
  const row = d.prepare(`SELECT paid_count FROM counter WHERE id = 1`).get() as { paid_count: number };
  return row?.paid_count || 0;
}

function incrementPaidCount(): number {
  const d = getDb();
  d.prepare(`UPDATE counter SET paid_count = paid_count + 1 WHERE id = 1`).run();
  return getPaidCount();
}

// ─── 리포트번호 생성 ────────────────────────────────────────

function generateReportNo(channel: string, isPaid: boolean): string {
  const now = new Date();
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const yy = String(kst.getFullYear()).slice(2);
  const mm = String(kst.getMonth() + 1).padStart(2, '0');
  const dd = String(kst.getDate()).padStart(2, '0');
  const dateStr = `${yy}${mm}${dd}`;

  const count = isPaid ? String(incrementPaidCount()).padStart(2, '0') : '00';

  const d = getDb();
  const prefix = `T3-${count}-${dateStr}-${channel}`;
  const row = d.prepare(
    `SELECT COUNT(*) as cnt FROM reports WHERE report_no LIKE ?`
  ).get(`${prefix}%`) as { cnt: number };

  const seq = String(row?.cnt || 0).padStart(4, '0');
  return `${prefix}${seq}`;
}

// ─── 키워드 추출 ────────────────────────────────────────────

export function extractKeywords(engine: any): [string, string, string] {
  const guk = engine?.gyeokGuk;
  const k1 = guk?.type
    ? `${guk.type}${guk.state === '파격' ? '(파격)' : guk.state === '약화' ? '(약화)' : ''}`
    : '미상';
  const k2 = engine?.strength?.level || '미상';
  const k3 = engine?.yongSin?.final?.primary
    ? `${engine.yongSin.final.primary}용신`
    : '미상';
  return [k1, k2, k3];
}

// ─── 연령대 추출 ────────────────────────────────────────────

function extractAgeGroup(engine: any): string {
  try {
    const birthDate = engine?.input?.birthDate;
    if (!birthDate) return '';
    const year = typeof birthDate === 'string' ? parseInt(birthDate.slice(0, 4)) : null;
    if (!year || isNaN(year)) return '';
    const now = new Date();
    const kstYear = now.getUTCFullYear() + (now.getUTCMonth() >= 3 ? 0 : 0); // 현재 연도
    const age = kstYear - year;
    if (age < 10) return '10대미만';
    if (age < 20) return '10대';
    if (age < 30) return '20대';
    if (age < 40) return '30대';
    if (age < 50) return '40대';
    if (age < 60) return '50대';
    if (age < 70) return '60대';
    return '70대이상';
  } catch { return ''; }
}

function extractGender(engine: any): string {
  try {
    return engine?.input?.gender === 'F' ? 'F' : engine?.input?.gender === 'M' ? 'M' : '';
  } catch { return ''; }
}

// ─── 리포트 저장 (무료) ─────────────────────────────────────

export function saveReport(charName: string, engine: any, channel?: string): { reportNo: string; keywords: [string, string, string] } {
  const d = getDb();
  const ch = channel && isValidChannel(channel) ? channel : DEFAULT_CHANNEL;
  const reportNo = generateReportNo(ch, false);
  const [k1, k2, k3] = extractKeywords(engine);
  const masked = maskName(charName);
  const ageGroup = extractAgeGroup(engine);
  const gender = extractGender(engine);

  d.prepare(
    `INSERT INTO reports (report_no, channel, char_name, keyword1, keyword2, keyword3, is_paid, age_group, gender) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`
  ).run(reportNo, ch, masked, k1, k2, k3, ageGroup, gender);

  return { reportNo, keywords: [k1, k2, k3] };
}

// ─── 리포트 저장 (유료) ─────────────────────────────────────

export function savePaidReport(charName: string, engine: any, orderId: string, channel?: string): { reportNo: string; keywords: [string, string, string] } {
  const d = getDb();
  const ch = channel && isValidChannel(channel) ? channel : DEFAULT_CHANNEL;
  const reportNo = generateReportNo(ch, true);
  const [k1, k2, k3] = extractKeywords(engine);
  const masked = maskName(charName);
  const ageGroup = extractAgeGroup(engine);
  const gender = extractGender(engine);

  d.prepare(
    `INSERT INTO reports (report_no, channel, char_name, keyword1, keyword2, keyword3, is_paid, age_group, gender) VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
  ).run(reportNo, ch, masked, k1, k2, k3, ageGroup, gender);

  // 결제 검증용 임시 저장 (24시간 TTL)
  d.prepare(
    `INSERT OR REPLACE INTO payments (order_id, report_no) VALUES (?, ?)`
  ).run(orderId, reportNo);

  return { reportNo, keywords: [k1, k2, k3] };
}

// ─── 결제 업그레이드 ────────────────────────────────────────

export function upgradeToPaid(freeReportNo: string, orderId: string): string | null {
  const d = getDb();
  const existing = d.prepare(`SELECT * FROM reports WHERE report_no = ?`).get(freeReportNo) as any;
  if (!existing) return null;

  const ch = existing.channel || DEFAULT_CHANNEL;
  const paidReportNo = generateReportNo(ch, true);

  d.prepare(`UPDATE reports SET report_no = ?, is_paid = 1 WHERE report_no = ?`).run(paidReportNo, freeReportNo);

  // 결제 검증용 임시 저장
  d.prepare(`INSERT OR REPLACE INTO payments (order_id, report_no) VALUES (?, ?)`).run(orderId, paidReportNo);

  return paidReportNo;
}

// ─── 조회 ───────────────────────────────────────────────────

export function getReport(reportNo: string) {
  const d = getDb();
  return d.prepare(`SELECT * FROM reports WHERE report_no = ?`).get(reportNo) as any | undefined;
}

export function getReportByOrderId(orderId: string) {
  const d = getDb();
  const payment = d.prepare(`SELECT report_no FROM payments WHERE order_id = ?`).get(orderId) as any;
  if (!payment) return undefined;
  return getReport(payment.report_no);
}

export function listReports(limit = 100) {
  const d = getDb();
  return d.prepare(`SELECT * FROM reports ORDER BY created_at DESC LIMIT ?`).all(limit);
}

// ─── 만료 결제 정리 (외부 호출용) ───────────────────────────

export function cleanupExpiredPayments(): number {
  const d = getDb();
  const result = d.prepare(`DELETE FROM payments WHERE created_at < datetime('now', '+9 hours', '-48 hours')`).run();
  return result.changes;
}
