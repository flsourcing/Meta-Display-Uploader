export function isApiConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_API_URL ?? "";
  if (!url) return false;
  if (url.includes("xxxx") || url.includes("example.com")) return false;
  return true;
}

export function getApiUrl(): string {
  const url = process.env.NEXT_PUBLIC_API_URL;
  if (!url) {
    throw new Error(
      "API is not configured. Set NEXT_PUBLIC_API_URL to your Railway API URL."
    );
  }
  if (url.includes("xxxx")) {
    throw new Error(
      "NEXT_PUBLIC_API_URL is still the placeholder. Use your real Railway domain from Settings → Networking."
    );
  }
  return url.replace(/\/$/, "");
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
  const response = await fetch(`${getApiUrl()}${path}`, init);
  if (!response.ok) {
    throw new Error(await parseError(response));
  }
  return (await response.json()) as T;
}
