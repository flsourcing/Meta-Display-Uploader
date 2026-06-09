export const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function withBasePath(path: string): string {
  if (!basePath) return path;
  if (path.startsWith(basePath)) return path;
  return `${basePath}${path.startsWith("/") ? path : `/${path}`}`;
}

export function absoluteAppUrl(path: string): string {
  if (typeof window === "undefined") {
    return withBasePath(path);
  }

  return `${window.location.origin}${withBasePath(path)}`;
}
