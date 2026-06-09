import { randomInt } from "crypto";

export const CODE_INTERVAL_MS = 30_000;

export function getSecondsRemainingFromExpiry(
  expiresAt: Date,
  now = Date.now()
): number {
  return Math.max(0, Math.ceil((expiresAt.getTime() - now) / 1000));
}

export function getCodeExpiryFromNow(now = Date.now()): Date {
  return new Date(now + CODE_INTERVAL_MS);
}

export function generateRandomCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
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
