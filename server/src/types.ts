import { getSecondsRemaining } from "./code.js";

export type MediaType = "image" | "video" | "video-url" | "youtube";

export interface MediaItem {
  type: MediaType;
  url: string;
  originalName?: string;
  uploadedAt: number;
}

export interface SessionState {
  id: string;
  code: string;
  bucket: number;
  secondsRemaining: number;
  media: MediaItem | null;
  createdAt: number;
  lastSeenAt: number;
}

export interface RoomRow {
  session_id: string;
  code: string;
  code_bucket: string | number;
  code_expires_at: Date;
  media_type: MediaType | null;
  media_url: string | null;
  media_name: string | null;
  media_uploaded_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

export function rowToSession(row: RoomRow, now = Date.now()): SessionState {
  const media: MediaItem | null =
    row.media_type && row.media_url
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
