import { randomUUID } from "crypto";
import {
  CODE_INTERVAL_MS,
  generateRandomCode,
  getCodeExpiryFromNow,
} from "./code.js";
import { getPool } from "./db.js";
import { rowToSession, type MediaItem, type RoomRow, type SessionState } from "./types.js";

async function generateUniqueCode(now = Date.now()): Promise<string> {
  const pool = getPool();

  for (let attempt = 0; attempt < 30; attempt++) {
    const code = generateRandomCode();
    const existing = await pool.query(
      `select 1 from display_sessions
       where code = $1
         and code_expires_at > $2
       limit 1`,
      [code, new Date(now)]
    );

    if (existing.rowCount === 0) {
      return code;
    }
  }

  throw new Error("Could not generate a unique pairing code.");
}

async function insertSession(now = Date.now()): Promise<SessionState> {
  const pool = getPool();
  const sessionId = randomUUID();
  const code = await generateUniqueCode(now);
  const codeExpiresAt = getCodeExpiryFromNow(now);

  const result = await pool.query<RoomRow>(
    `insert into display_sessions (
      session_id, code, code_bucket, code_expires_at, updated_at
    ) values ($1, $2, $3, $4, $5)
    returning *`,
    [sessionId, code, 0, codeExpiresAt, new Date(now)]
  );

  return rowToSession(result.rows[0], now);
}

async function rotateSessionCode(
  sessionId: string,
  currentBucket: number,
  now = Date.now()
): Promise<SessionState> {
  const pool = getPool();
  const code = await generateUniqueCode(now);
  const codeExpiresAt = getCodeExpiryFromNow(now);

  const result = await pool.query<RoomRow>(
    `update display_sessions
     set code = $2,
         code_bucket = $3,
         code_expires_at = $4,
         updated_at = $5
     where session_id = $1
     returning *`,
    [sessionId, code, currentBucket + 1, codeExpiresAt, new Date(now)]
  );

  return rowToSession(result.rows[0], now);
}

export async function createSession(): Promise<SessionState> {
  return insertSession();
}

export async function refreshSession(sessionId: string): Promise<SessionState | null> {
  const pool = getPool();
  const now = Date.now();

  const existing = await pool.query<RoomRow>(
    "select * from display_sessions where session_id = $1",
    [sessionId]
  );

  if (existing.rowCount === 0) {
    return null;
  }

  const row = existing.rows[0];
  if (row.code_expires_at.getTime() <= now) {
    return rotateSessionCode(sessionId, Number(row.code_bucket), now);
  }

  const result = await pool.query<RoomRow>(
    `update display_sessions
     set updated_at = $2
     where session_id = $1
     returning *`,
    [sessionId, new Date(now)]
  );

  return rowToSession(result.rows[0], now);
}

export async function getSessionByCode(code: string): Promise<SessionState | null> {
  const pool = getPool();
  const normalized = code.trim();
  const now = Date.now();

  const result = await pool.query<RoomRow>(
    `select * from display_sessions
     where code = $1
       and code_expires_at > $2
     order by updated_at desc
     limit 1`,
    [normalized, new Date(now)]
  );

  if (result.rowCount === 0) return null;

  return rowToSession(result.rows[0], now);
}

export async function setSessionMedia(
  code: string,
  media: MediaItem
): Promise<SessionState | null> {
  const session = await getSessionByCode(code);
  if (!session) return null;

  const pool = getPool();
  const result = await pool.query<RoomRow>(
    `update display_sessions
     set media_type = $2,
         media_url = $3,
         media_name = $4,
         media_uploaded_at = $5,
         updated_at = $6
     where session_id = $1
     returning *`,
    [
      session.id,
      media.type,
      media.url,
      media.originalName ?? null,
      new Date(media.uploadedAt),
      new Date(),
    ]
  );

  return rowToSession(result.rows[0]);
}

export async function pruneStaleSessions(
  maxAgeMs = CODE_INTERVAL_MS * 20
): Promise<void> {
  const pool = getPool();
  const cutoff = new Date(Date.now() - maxAgeMs);
  await pool.query("delete from display_sessions where updated_at < $1", [cutoff]);
}
