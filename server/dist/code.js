export const CODE_INTERVAL_MS = 30_000;
export function getTimeBucket(now = Date.now()) {
    return Math.floor(now / CODE_INTERVAL_MS);
}
export function getSecondsRemaining(now = Date.now()) {
    const elapsed = now % CODE_INTERVAL_MS;
    return Math.ceil((CODE_INTERVAL_MS - elapsed) / 1000);
}
export function generateCode(sessionId, bucket) {
    let hash = 0;
    const input = `${sessionId}:${bucket}`;
    for (let i = 0; i < input.length; i++) {
        hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
    }
    return String(hash % 1_000_000).padStart(6, "0");
}
export function parseYouTubeId(url) {
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
    }
    catch {
        return null;
    }
    return null;
}
export function getYouTubeEmbedUrl(url) {
    const id = parseYouTubeId(url);
    if (!id)
        return null;
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=0&playsinline=1`;
}
