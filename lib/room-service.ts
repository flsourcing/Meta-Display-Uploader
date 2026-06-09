import { compressImageIfNeeded } from "./compress-image";
import { getYouTubeEmbedUrl } from "./code";
import { apiFetch } from "./api";
import type { MediaItem, SessionState } from "./types";

const SESSION_STORAGE_KEY = "meta-display-session-id";

function getOrCreateSessionId(): string {
  const existing = localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) return existing;

  const sessionId = crypto.randomUUID();
  localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}

export async function ensureDisplaySession(): Promise<SessionState> {
  const sessionId = getOrCreateSessionId();
  return apiFetch<SessionState>("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId }),
  });
}

export async function refreshDisplaySession(
  sessionId: string
): Promise<SessionState> {
  return apiFetch<SessionState>(`/api/session?id=${encodeURIComponent(sessionId)}`, {
    cache: "no-store",
  });
}

export async function sendMediaToCode(
  code: string,
  input:
    | { kind: "file"; file: File }
    | { kind: "video-url"; url: string }
    | { kind: "youtube"; url: string }
): Promise<SessionState> {
  if (input.kind === "file") {
    const preparedFile =
      input.file.type.startsWith("image/")
        ? await compressImageIfNeeded(input.file)
        : input.file;

    const formData = new FormData();
    formData.append("code", code.trim());
    formData.append("file", preparedFile);

    const payload = await apiFetch<{ session: SessionState }>("/api/upload", {
      method: "POST",
      body: formData,
    });

    return payload.session;
  }

  const formData = new FormData();
  formData.append("code", code.trim());

  if (input.kind === "video-url") {
    formData.append("videoUrl", input.url);
  } else {
    const embedUrl = getYouTubeEmbedUrl(input.url);
    if (!embedUrl) {
      throw new Error("Could not read that YouTube link.");
    }
    formData.append("youtubeUrl", input.url);
  }

  const payload = await apiFetch<{ session: SessionState }>("/api/upload", {
    method: "POST",
    body: formData,
  });

  return payload.session;
}

export type { MediaItem, SessionState };
