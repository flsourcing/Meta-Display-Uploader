import { getSecondsRemaining } from "./code.js";
export function rowToSession(row, now = Date.now()) {
    const media = row.media_type && row.media_url
        ? {
            type: row.media_type,
            url: row.media_url,
            originalName: row.media_name ?? undefined,
            uploadedAt: row.media_uploaded_at
                ? row.media_uploaded_at.getTime()
                : now,
        }
        : null;
    return {
        id: row.session_id,
        code: row.code,
        bucket: Number(row.code_bucket),
        secondsRemaining: getSecondsRemaining(now),
        media,
        createdAt: row.created_at.getTime(),
        lastSeenAt: row.updated_at.getTime(),
    };
}
