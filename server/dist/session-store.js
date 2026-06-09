import { randomUUID } from "crypto";
import { CODE_INTERVAL_MS, generateRandomCode, getTimeBucket, } from "./code.js";
import { getPool } from "./db.js";
import { rowToSession } from "./types.js";
function getCodeExpiry(now = Date.now()) {
    const bucket = getTimeBucket(now);
    return new Date((bucket + 1) * CODE_INTERVAL_MS);
}
async function generateUniqueCode(bucket, now = Date.now()) {
    const pool = getPool();
    for (let attempt = 0; attempt < 30; attempt++) {
        const code = generateRandomCode();
        const existing = await pool.query(`select 1 from display_sessions
       where code = $1
         and code_bucket = $2
         and code_expires_at > $3
       limit 1`, [code, bucket, new Date(now)]);
        if (existing.rowCount === 0) {
            return code;
        }
    }
    throw new Error("Could not generate a unique pairing code.");
}
async function upsertRoom(sessionId, now = Date.now()) {
    const pool = getPool();
    const bucket = getTimeBucket(now);
    const code = await generateUniqueCode(bucket, now);
    const codeExpiresAt = getCodeExpiry(now);
    const result = await pool.query(`insert into display_sessions (
      session_id, code, code_bucket, code_expires_at, updated_at
    ) values ($1, $2, $3, $4, $5)
    on conflict (session_id) do update set
      code = excluded.code,
      code_bucket = excluded.code_bucket,
      code_expires_at = excluded.code_expires_at,
      updated_at = excluded.updated_at
    returning *`, [sessionId, code, bucket, codeExpiresAt, new Date(now)]);
    return rowToSession(result.rows[0], now);
}
export async function createSession(sessionId) {
    const id = sessionId ?? randomUUID();
    return upsertRoom(id);
}
export async function refreshSession(sessionId) {
    const pool = getPool();
    const now = Date.now();
    const bucket = getTimeBucket(now);
    const existing = await pool.query("select * from display_sessions where session_id = $1", [sessionId]);
    if (existing.rowCount === 0) {
        return upsertRoom(sessionId, now);
    }
    const row = existing.rows[0];
    if (Number(row.code_bucket) !== bucket) {
        return upsertRoom(sessionId, now);
    }
    const result = await pool.query(`update display_sessions
     set updated_at = $2
     where session_id = $1
     returning *`, [sessionId, new Date(now)]);
    return rowToSession(result.rows[0], now);
}
export async function getSessionByCode(code) {
    const pool = getPool();
    const normalized = code.trim();
    const now = Date.now();
    const bucket = getTimeBucket(now);
    const result = await pool.query(`select * from display_sessions
     where code = $1
       and code_expires_at > $2
     order by updated_at desc
     limit 1`, [normalized, new Date(now)]);
    if (result.rowCount === 0)
        return null;
    const row = result.rows[0];
    if (row.code !== normalized || Number(row.code_bucket) !== bucket) {
        return null;
    }
    return rowToSession(row, now);
}
export async function setSessionMedia(code, media) {
    const session = await getSessionByCode(code);
    if (!session)
        return null;
    const pool = getPool();
    const result = await pool.query(`update display_sessions
     set media_type = $2,
         media_url = $3,
         media_name = $4,
         media_uploaded_at = $5,
         updated_at = $6
     where session_id = $1
     returning *`, [
        session.id,
        media.type,
        media.url,
        media.originalName ?? null,
        new Date(media.uploadedAt),
        new Date(),
    ]);
    return rowToSession(result.rows[0]);
}
export async function pruneStaleSessions(maxAgeMs = CODE_INTERVAL_MS * 20) {
    const pool = getPool();
    const cutoff = new Date(Date.now() - maxAgeMs);
    await pool.query("delete from display_sessions where updated_at < $1", [cutoff]);
}
