export const CODE_INTERVAL_MS = 30_000;
export const WARNING_AT_SECONDS = 20;
export const CRITICAL_AT_SECONDS = 10;

export function getTimeBucket(now = Date.now()): number {
  return Math.floor(now / CODE_INTERVAL_MS);
}

export function getSecondsRemaining(now = Date.now()): number {
  const elapsed = now % CODE_INTERVAL_MS;
  return Math.ceil((CODE_INTERVAL_MS - elapsed) / 1000);
}

export function parseYouTubeId(url: string): string | null {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }

    if (host === "youtube.com" || host === "m.youtube.com") {
      if (parsed.pathname === "/watch") {
        return parsed.searchParams.get("v");
      }
      if (parsed.pathname.startsWith("/embed/")) {
        return parsed.pathname.split("/")[2] || null;
      }
      if (parsed.pathname.startsWith("/shorts/")) {
        return parsed.pathname.split("/")[2] || null;
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function getYouTubeEmbedUrl(url: string): string | null {
  const id = parseYouTubeId(url);
  if (!id) return null;
  return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1`;
}

export type CodePhase = "fresh" | "warning" | "critical";

export function getCodePhase(secondsRemaining: number): CodePhase {
  if (secondsRemaining <= CRITICAL_AT_SECONDS) return "critical";
  if (secondsRemaining <= WARNING_AT_SECONDS) return "warning";
  return "fresh";
}
