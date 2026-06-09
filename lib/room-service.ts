import {
  CODE_INTERVAL_MS,
  generateCode,
  getSecondsRemaining,
  getTimeBucket,
  getYouTubeEmbedUrl,
} from "./code";
import { getSupabaseClient } from "./supabase";
import type { MediaItem, MediaType, SessionState } from "./types";

const STORAGE_BUCKET = "media";
const SESSION_STORAGE_KEY = "meta-display-session-id";

interface RoomRow {
  session_id: string;
  code: string;
  code_bucket: number;
  code_expires_at: string;
  media_type: MediaType | null;
  media_url: string | null;
  media_name: string | null;
  media_uploaded_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSession(row: RoomRow, now = Date.now()): SessionState {
  const media: MediaItem | null =
    row.media_type && row.media_url
      ? {
          type: row.media_type,
          url: row.media_url,
          originalName: row.media_name ?? undefined,
          uploadedAt: row.media_uploaded_at
            ? new Date(row.media_uploaded_at).getTime()
            : now,
        }
      : null;

  return {
    id: row.session_id,
    code: row.code,
    bucket: row.code_bucket,
    secondsRemaining: getSecondsRemaining(now),
    media,
    createdAt: new Date(row.created_at).getTime(),
    lastSeenAt: new Date(row.updated_at).getTime(),
  };
}

function getCodeExpiry(now = Date.now()): Date {
  const bucket = getTimeBucket(now);
  return new Date((bucket + 1) * CODE_INTERVAL_MS);
}

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

async function upsertRoom(sessionId: string, now = Date.now()): Promise<SessionState> {
  const supabase = getSupabaseClient();
  const bucket = getTimeBucket(now);
  const code = generateCode(sessionId, bucket);
  const codeExpiresAt = getCodeExpiry(now).toISOString();

  const { data, error } = await supabase
    .from("display_sessions")
    .upsert(
      {
        session_id: sessionId,
        code,
        code_bucket: bucket,
        code_expires_at: codeExpiresAt,
        updated_at: new Date(now).toISOString(),
      },
      { onConflict: "session_id" }
    )
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToSession(data as RoomRow, now);
}

export async function ensureDisplaySession(): Promise<SessionState> {
  const sessionId = getOrCreateSessionId();
  return upsertRoom(sessionId);
}

export async function refreshDisplaySession(sessionId: string): Promise<SessionState> {
  const supabase = getSupabaseClient();
  const now = Date.now();
  const bucket = getTimeBucket(now);

  const { data: existing, error: readError } = await supabase
    .from("display_sessions")
    .select("*")
    .eq("session_id", sessionId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }

  if (!existing || existing.code_bucket !== bucket) {
    return upsertRoom(sessionId, now);
  }

  const { data, error } = await supabase
    .from("display_sessions")
    .update({
      updated_at: new Date(now).toISOString(),
    })
    .eq("session_id", sessionId)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToSession(data as RoomRow, now);
}

export async function getSessionByCode(code: string): Promise<SessionState | null> {
  const supabase = getSupabaseClient();
  const normalized = code.trim();
  const now = Date.now();

  const { data, error } = await supabase
    .from("display_sessions")
    .select("*")
    .eq("code", normalized)
    .gt("code_expires_at", new Date(now).toISOString())
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const row = data as RoomRow;
  if (row.code !== normalized || row.code_bucket !== getTimeBucket(now)) {
    return null;
  }

  return rowToSession(row, now);
}

async function uploadFileToStorage(sessionId: string, file: File): Promise<string> {
  const supabase = getSupabaseClient();
  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : "";
  const objectPath = `${sessionId}/${Date.now()}${extension}`;

  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: file.type,
    });

  if (error) {
    throw new Error(error.message);
  }

  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(objectPath);
  return data.publicUrl;
}

export async function sendMediaToCode(
  code: string,
  input:
    | { kind: "file"; file: File }
    | { kind: "video-url"; url: string }
    | { kind: "youtube"; url: string }
): Promise<SessionState> {
  const session = await getSessionByCode(code);
  if (!session) {
    throw new Error("That code is not active. Check the glasses and try again.");
  }

  let media: MediaItem;

  if (input.kind === "file") {
    const mime = input.file.type;
    let type: MediaType;

    if (mime.startsWith("image/")) {
      type = "image";
    } else if (mime.startsWith("video/")) {
      type = "video";
    } else {
      throw new Error("Only photo and video files are supported.");
    }

    const url = await uploadFileToStorage(session.id, input.file);
    media = {
      type,
      url,
      originalName: input.file.name,
      uploadedAt: Date.now(),
    };
  } else if (input.kind === "video-url") {
    try {
      new URL(input.url);
    } catch {
      throw new Error("Enter a valid video URL.");
    }

    media = {
      type: "video-url",
      url: input.url,
      originalName: input.url,
      uploadedAt: Date.now(),
    };
  } else {
    const embedUrl = getYouTubeEmbedUrl(input.url);
    if (!embedUrl) {
      throw new Error("Could not read that YouTube link.");
    }

    media = {
      type: "youtube",
      url: embedUrl,
      originalName: input.url,
      uploadedAt: Date.now(),
    };
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("display_sessions")
    .update({
      media_type: media.type,
      media_url: media.url,
      media_name: media.originalName ?? null,
      media_uploaded_at: new Date(media.uploadedAt).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("session_id", session.id)
    .select("*")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  return rowToSession(data as RoomRow);
}
