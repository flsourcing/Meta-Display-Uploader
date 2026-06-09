export function isApiConfigured(): boolean {
  return Boolean(getResolvedApiUrl());
}

let resolvedApiUrl: string | null = null;
let initPromise: Promise<string | null> | null = null;

function normalizeApiUrl(url: string): string {
  return url.trim().replace(/\/$/, "");
}

function isValidApiUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes("xxxx") || url.includes("example.com")) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

export function getResolvedApiUrl(): string | null {
  return resolvedApiUrl;
}

export async function initApiConfig(): Promise<string | null> {
  if (resolvedApiUrl) return resolvedApiUrl;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const envUrl = process.env.NEXT_PUBLIC_API_URL ?? "";
    if (isValidApiUrl(envUrl)) {
      resolvedApiUrl = normalizeApiUrl(envUrl);
      return resolvedApiUrl;
    }

    const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
    try {
      const response = await fetch(`${basePath}/api-config.json`, {
        cache: "no-store",
      });
      if (response.ok) {
        const data = (await response.json()) as { apiUrl?: string };
        if (data.apiUrl && isValidApiUrl(data.apiUrl)) {
          resolvedApiUrl = normalizeApiUrl(data.apiUrl);
          return resolvedApiUrl;
        }
      }
    } catch {
      // Fall through to unconfigured state.
    }

    return null;
  })();

  return initPromise;
}

export function getApiUrl(): string {
  if (!resolvedApiUrl) {
    throw new Error(
      "API is not configured. Set apiUrl in public/api-config.json or NEXT_PUBLIC_API_URL."
    );
  }
  return resolvedApiUrl;
}

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Request failed.";
  } catch {
    return "Request failed.";
  }
}

export async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<T> {
  await initApiConfig();
  const response = await fetch(`${getApiUrl()}${path}`, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}
