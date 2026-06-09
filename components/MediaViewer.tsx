"use client";

import type { MediaItem } from "@/lib/types";

interface MediaViewerProps {
  media: MediaItem | null;
}

export function MediaViewer({ media }: MediaViewerProps) {
  if (!media) {
    return (
      <div className="flex h-full min-h-[240px] items-center justify-center rounded-3xl border border-dashed border-white/15 bg-white/5 px-6 text-center text-sm text-white/50">
        Waiting for media upload...
      </div>
    );
  }

  if (media.type === "image") {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl bg-black">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={media.url}
          alt={media.originalName ?? "Uploaded photo"}
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl bg-black">
        <video
          src={media.url}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (media.type === "video-url") {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl bg-black">
        <video
          src={media.url}
          controls
          autoPlay
          playsInline
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video min-h-[240px] overflow-hidden rounded-3xl bg-black">
      <iframe
        src={media.url}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
