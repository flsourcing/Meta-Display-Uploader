import { compressImageIfNeeded } from "./compress-image";
import { apiFetch } from "./api";
import type { MediaItem, SessionState } from "./types";

export async function ensureDisplaySession(): Promise<SessionState> {
  return apiFetch<SessionState>("/api/session", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({}),
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
    | { kind: "webpage"; url: string }
    | { kind: "video-link"; url: string }
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

  if (input.kind === "webpage") {
    formData.append("pageUrl", input.url);
  } else {
    formData.append("videoUrl", input.url);
  }

  const payload = await apiFetch<{ session: SessionState }>("/api/upload", {
    method: "POST",
    body: formData,
  });

  return payload.session;
}

export type { MediaItem, SessionState };
