export type MediaType = "image" | "video" | "video-url" | "youtube" | "webpage";

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
