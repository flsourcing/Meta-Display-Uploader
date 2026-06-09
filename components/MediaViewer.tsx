"use client";

import { useEffect, useState } from "react";
import type { MediaItem } from "@/lib/types";

interface MediaViewerProps {
  media: MediaItem | null;
}

export function MediaViewer({ media }: MediaViewerProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [media?.url, media?.uploadedAt]);

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
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
            Loading image...
          </div>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          key={`${media.url}-${media.uploadedAt}`}
          src={media.url}
          alt={media.originalName ?? "Uploaded photo"}
          decoding="async"
          loading="eager"
          onLoad={() => setLoaded(true)}
          className={`h-full w-full object-contain transition-opacity duration-200 ${loaded ? "opacity-100" : "opacity-0"}`}
        />
      </div>
    );
  }

  if (media.type === "video") {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl bg-black">
        <video
          key={`${media.url}-${media.uploadedAt}`}
          src={media.url}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  if (media.type === "video-url") {
    return (
      <div className="relative h-full min-h-[240px] overflow-hidden rounded-3xl bg-black">
        <video
          key={`${media.url}-${media.uploadedAt}`}
          src={media.url}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="h-full w-full object-contain"
        />
      </div>
    );
  }

  return (
    <div className="relative aspect-video min-h-[240px] overflow-hidden rounded-3xl bg-black">
      <iframe
        key={`${media.url}-${media.uploadedAt}`}
        src={media.url}
        title="YouTube video"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        className="absolute inset-0 h-full w-full border-0"
      />
    </div>
  );
}
