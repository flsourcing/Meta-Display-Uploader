"use client";

import { useEffect, useRef, useState } from "react";
import type { MediaItem } from "@/lib/types";

interface MediaViewerProps {
  media: MediaItem;
}

function VideoControls({
  playing,
  onTogglePlay,
  onSeekBack,
  onSeekForward,
}: {
  playing: boolean;
  onTogglePlay: () => void;
  onSeekBack: () => void;
  onSeekForward: () => void;
}) {
  return (
    <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-4 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-8 pt-16">
      <button
        type="button"
        onClick={onSeekBack}
        className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Back 10 seconds"
      >
        -10s
      </button>
      <button
        type="button"
        onClick={onTogglePlay}
        className="rounded-full border border-white/30 bg-white px-8 py-3 text-base font-semibold text-black transition hover:bg-white/90"
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? "Pause" : "Play"}
      </button>
      <button
        type="button"
        onClick={onSeekForward}
        className="rounded-full border border-white/20 bg-white/10 px-5 py-3 text-sm font-medium text-white backdrop-blur transition hover:bg-white/20"
        aria-label="Forward 10 seconds"
      >
        +10s
      </button>
    </div>
  );
}

function HtmlVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      void video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function seekBy(seconds: number) {
    const video = videoRef.current;
    if (!video) return;
    const duration = Number.isFinite(video.duration) ? video.duration : Infinity;
    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds));
  }

  return (
    <div className="relative h-full w-full bg-black">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        playsInline
        preload="auto"
        className="h-full w-full object-contain"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />
      <VideoControls
        playing={playing}
        onTogglePlay={togglePlay}
        onSeekBack={() => seekBy(-10)}
        onSeekForward={() => seekBy(10)}
      />
    </div>
  );
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          width?: string | number;
          height?: string | number;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YouTubePlayerInstance }) => void;
            onStateChange?: (event: { data: number; target: YouTubePlayerInstance }) => void;
          };
        }
      ) => YouTubePlayerInstance;
      PlayerState?: { PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  getCurrentTime: () => number;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getPlayerState: () => number;
  destroy: () => void;
}

function extractYouTubeId(url: string): string | null {
  const embedMatch = url.match(/\/embed\/([^?&/]+)/);
  if (embedMatch?.[1]) return embedMatch[1];

  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.slice(1).split("/")[0] || null;
    }
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

function loadYouTubeApi(): Promise<void> {
  if (window.YT?.Player) {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      resolve();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement("script");
      script.src = "https://www.youtube.com/iframe_api";
      document.body.appendChild(script);
    }
  });
}

function YouTubeVideoPlayer({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YouTubePlayerInstance | null>(null);
  const [playing, setPlaying] = useState(true);
  const videoId = extractYouTubeId(url);

  useEffect(() => {
    if (!videoId || !containerRef.current) return;

    let active = true;

    loadYouTubeApi().then(() => {
      if (!active || !containerRef.current || !window.YT?.Player) return;

      playerRef.current?.destroy();

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          controls: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          fs: 0,
        },
        events: {
          onReady: (event) => {
            event.target.playVideo();
            setPlaying(true);
          },
          onStateChange: (event) => {
            const playingState = window.YT?.PlayerState?.PLAYING ?? 1;
            const pausedState = window.YT?.PlayerState?.PAUSED ?? 2;
            if (event.data === playingState) setPlaying(true);
            if (event.data === pausedState) setPlaying(false);
          },
        },
      });
    });

    return () => {
      active = false;
      playerRef.current?.destroy();
      playerRef.current = null;
    };
  }, [videoId]);

  function togglePlay() {
    const player = playerRef.current;
    if (!player) return;
    const playingState = window.YT?.PlayerState?.PLAYING ?? 1;
    if (player.getPlayerState() === playingState) {
      player.pauseVideo();
    } else {
      player.playVideo();
    }
  }

  function seekBy(seconds: number) {
    const player = playerRef.current;
    if (!player) return;
    player.seekTo(Math.max(0, player.getCurrentTime() + seconds), true);
  }

  if (!videoId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-black text-white/60">
        Could not load YouTube video.
      </div>
    );
  }

  return (
    <div className="relative h-full w-full bg-black">
      <div ref={containerRef} className="h-full w-full [&>iframe]:h-full [&>iframe]:w-full" />
      <VideoControls
        playing={playing}
        onTogglePlay={togglePlay}
        onSeekBack={() => seekBy(-10)}
        onSeekForward={() => seekBy(10)}
      />
    </div>
  );
}

export function MediaViewer({ media }: MediaViewerProps) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(false);
  }, [media.url, media.uploadedAt]);

  if (media.type === "image") {
    return (
      <div className="relative h-full w-full bg-black">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
            Loading...
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

  if (media.type === "video" || media.type === "video-url") {
    return <HtmlVideoPlayer key={`${media.url}-${media.uploadedAt}`} src={media.url} />;
  }

  return <YouTubeVideoPlayer key={`${media.url}-${media.uploadedAt}`} url={media.url} />;
}
