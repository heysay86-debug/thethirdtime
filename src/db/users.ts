/**
 * 유저 테이블 (카카오 로그인)
 *
 * SQLite에 저장. kakao_id를 PK로 사용.
 * 개인정보 최소 수집: 카카오 고유 ID + 닉네임 + 프로필 이미지만 저장.
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'reports.db');

let db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
  }

  // users 테이블 생성 (없으면)
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      kakao_id TEXT PRIMARY KEY,
      nickname TEXT NOT NULL DEFAULT '',
      profile_image TEXT NOT NULL DEFAULT '',
      golgol_balance INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME NOT NULL DEFAULT (datetime('now', '+9 hours')),
      last_login_at DATETIME NOT NULL DEFAULT (datetime('now', '+9 hours'))
    )
  `);

  return db;
}

export interface User {
  kakao_id: string;
  nickname: string;
  profile_image: string;
  golgol_balance: number;
  created_at: string;
  last_login_at: string;
}

/**
 * 카카오 로그인 시 유저를 upsert한다.
 * - 신규: INSERT
 * - 기존: last_login_at + 닉네임/프로필 업데이트
 */
export function upsertKakaoUser(
  kakaoId: string,
  nickname: string,
  profileImage: string,
): User {
  const d = getDb();

  const existing = d.prepare(
    `SELECT * FROM users WHERE kakao_id = ?`
  ).get(kakaoId) as User | undefined;

  if (existing) {
    d.prepare(
      `UPDATE users SET nickname = ?, profile_image = ?, last_login_at = datetime('now', '+9 hours') WHERE kakao_id = ?`
    ).run(nickname, profileImage, kakaoId);
  } else {
    d.prepare(
      `INSERT INTO users (kakao_id, nickname, profile_image) VALUES (?, ?, ?)`
    ).run(kakaoId, nickname, profileImage);
  }

  return d.prepare(`SELECT * FROM users WHERE kakao_id = ?`).get(kakaoId) as User;
}

/**
 * kakao_id로 유저 조회
 */
export function getUserByKakaoId(kakaoId: string): User | undefined {
  const d = getDb();
  return d.prepare(`SELECT * FROM users WHERE kakao_id = ?`).get(kakaoId) as User | undefined;
}
