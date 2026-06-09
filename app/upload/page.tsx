"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { sendMediaToCode } from "@/lib/room-service";
import { isApiConfigured } from "@/lib/api";

type UploadMode = "file" | "video-url" | "youtube";

function UploadForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialCode = searchParams.get("code") ?? "";

  const [code, setCode] = useState(initialCode);
  const [mode, setMode] = useState<UploadMode>("file");
  const [file, setFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (!/^\d{6}$/.test(code.trim())) {
        throw new Error("Enter the current 6-digit code shown on the glasses.");
      }

      if (mode === "file") {
        if (!file) {
          throw new Error("Choose a photo or video to upload.");
        }
        await sendMediaToCode(code.trim(), { kind: "file", file });
      } else if (mode === "video-url") {
        await sendMediaToCode(code.trim(), { kind: "video-url", url: videoUrl.trim() });
      } else {
        await sendMediaToCode(code.trim(), { kind: "youtube", url: youtubeUrl.trim() });
      }

      setStatus("Media sent to the glasses display.");
      setFile(null);
      setVideoUrl("");
      setYoutubeUrl("");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Meta Display
          </p>
          <h1 className="text-3xl font-semibold text-white">Upload Media</h1>
          <p className="mt-2 max-w-xl text-sm text-white/60">
            Enter the 6-digit code shown on the glasses, then send a photo, video,
            direct video link, or YouTube link to that display.
          </p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Display page
        </Link>
      </header>

      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8"
      >
        <label className="block">
          <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">
            Glasses code
          </span>
          <input
            value={code}
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
            }
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            required
            placeholder="123456"
            className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 font-mono text-3xl tracking-[0.35em] text-white outline-none transition focus:border-emerald-400/60"
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-3">
          {([
            ["file", "Photo / Video"],
            ["video-url", "Video URL"],
            ["youtube", "YouTube"],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMode(value)}
              className={`rounded-2xl border px-4 py-3 text-sm transition ${
                mode === value
                  ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-black/20 text-white/60 hover:border-white/25 hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {mode === "file" && (
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">
              Upload from camera roll or capture
            </span>
            <input
              type="file"
              accept="image/*,video/*"
              capture="environment"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="block w-full rounded-2xl border border-dashed border-white/15 bg-black/20 px-4 py-8 text-sm text-white/70 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-medium file:text-black"
            />
            {previewUrl && file?.type.startsWith("image/") && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Preview"
                className="mt-4 max-h-72 rounded-2xl object-contain"
              />
            )}
            {previewUrl && file?.type.startsWith("video/") && (
              <video
                src={previewUrl}
                controls
                className="mt-4 max-h-72 w-full rounded-2xl"
              />
            )}
          </label>
        )}

        {mode === "video-url" && (
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">
              Direct video URL
            </span>
            <input
              value={videoUrl}
              onChange={(event) => setVideoUrl(event.target.value)}
              placeholder="https://example.com/video.mp4"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none transition focus:border-emerald-400/60"
            />
          </label>
        )}

        {mode === "youtube" && (
          <label className="block">
            <span className="mb-2 block text-sm uppercase tracking-[0.2em] text-white/45">
              YouTube link
            </span>
            <input
              value={youtubeUrl}
              onChange={(event) => setYoutubeUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none transition focus:border-emerald-400/60"
            />
          </label>
        )}

        {error && (
          <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        {status && (
          <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-2xl bg-emerald-400 px-4 py-4 text-base font-semibold text-black transition hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? "Sending..." : "Send to glasses"}
        </button>
      </form>

      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-sm text-white/60">
        <p className="font-medium text-white/80">How pairing works</p>
        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Open the display page on the Meta glasses browser.</li>
          <li>Note the current 6-digit code before it expires.</li>
          <li>Upload here using that code, or open the link shown on the display.</li>
          <li>The media appears live on the glasses screen.</li>
        </ol>
        <button
          type="button"
          onClick={() => router.push(`/upload?code=${code}`)}
          className="mt-4 text-emerald-300 hover:underline"
        >
          Refresh share link with current code
        </button>
      </section>
    </main>
  );
}

export default function UploadPage() {
  if (!isApiConfigured()) {
    return <SetupNotice />;
  }

  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center text-white/60">
          Loading upload page...
        </main>
      }
    >
      <UploadForm />
    </Suspense>
  );
}
