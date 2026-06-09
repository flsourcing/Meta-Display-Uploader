"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SetupNotice } from "@/components/SetupNotice";
import { getResolvedApiUrl, initApiConfig } from "@/lib/api";
import { sendMediaToCode } from "@/lib/room-service";

type UploadMode = "media" | "webpage" | "video-link";

function UploadForm() {
  const [code, setCode] = useState("");
  const [mode, setMode] = useState<UploadMode>("media");
  const [file, setFile] = useState<File | null>(null);
  const [pageUrl, setPageUrl] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const photoCameraRef = useRef<HTMLInputElement>(null);
  const photoLibraryRef = useRef<HTMLInputElement>(null);
  const videoCameraRef = useRef<HTMLInputElement>(null);
  const videoLibraryRef = useRef<HTMLInputElement>(null);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selected = event.target.files?.[0] ?? null;
    setFile(selected);
    setMode("media");
    setShowMediaPicker(false);
    event.target.value = "";
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setStatus(null);
    setIsSubmitting(true);

    try {
      if (!/^\d{6}$/.test(code.trim())) {
        throw new Error("Enter the current 6-digit code shown on the glasses.");
      }

      if (mode === "media") {
        if (!file) {
          throw new Error("Choose a photo or video first.");
        }
        setStatus(file.type.startsWith("image/") ? "Compressing photo..." : "Uploading...");
        await sendMediaToCode(code.trim(), { kind: "file", file });
        setFile(null);
      } else if (mode === "webpage") {
        if (!pageUrl.trim()) {
          throw new Error("Enter a web page URL.");
        }
        setStatus("Sending web page...");
        await sendMediaToCode(code.trim(), { kind: "webpage", url: pageUrl.trim() });
        setPageUrl("");
      } else {
        if (!videoLink.trim()) {
          throw new Error("Enter a video or YouTube URL.");
        }
        setStatus("Sending video...");
        await sendMediaToCode(code.trim(), { kind: "video-link", url: videoLink.trim() });
        setVideoLink("");
      }

      setStatus("Sent to glasses.");
    } catch (submitError) {
      setError(
        submitError instanceof Error ? submitError.message : "Upload failed."
      );
      setStatus(null);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <main className="mx-auto flex min-h-screen w-full max-w-lg flex-col gap-6 px-4 py-8">
        <header className="flex items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-white">Upload</h1>
          <Link
            href="/"
            className="text-sm text-white/60 transition hover:text-white"
          >
            Display
          </Link>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-xs uppercase tracking-[0.2em] text-white/45">
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

          <div className="grid gap-3">
            <button
              type="button"
              onClick={() => {
                setMode("media");
                setShowMediaPicker(true);
              }}
              className={`rounded-2xl border px-4 py-4 text-left text-base transition ${
                mode === "media"
                  ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-black/20 text-white/70 hover:border-white/25"
              }`}
            >
              Photo / Video
              {file && (
                <span className="mt-1 block text-xs text-emerald-300/80">
                  {file.name}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setMode("webpage")}
              className={`rounded-2xl border px-4 py-4 text-left text-base transition ${
                mode === "webpage"
                  ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-black/20 text-white/70 hover:border-white/25"
              }`}
            >
              URL
            </button>

            <button
              type="button"
              onClick={() => setMode("video-link")}
              className={`rounded-2xl border px-4 py-4 text-left text-base transition ${
                mode === "video-link"
                  ? "border-emerald-400/60 bg-emerald-400/10 text-white"
                  : "border-white/10 bg-black/20 text-white/70 hover:border-white/25"
              }`}
            >
              Video URL
            </button>
          </div>

          {mode === "webpage" && (
            <input
              value={pageUrl}
              onChange={(event) => setPageUrl(event.target.value)}
              placeholder="https://example.com"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none transition focus:border-emerald-400/60"
            />
          )}

          {mode === "video-link" && (
            <input
              value={videoLink}
              onChange={(event) => setVideoLink(event.target.value)}
              placeholder="Video or YouTube URL"
              className="w-full rounded-2xl border border-white/10 bg-black/40 px-4 py-4 text-white outline-none transition focus:border-emerald-400/60"
            />
          )}

          {mode === "media" && previewUrl && file?.type.startsWith("image/") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={previewUrl}
              alt="Preview"
              className="max-h-48 w-full rounded-2xl object-contain"
            />
          )}

          {mode === "media" && previewUrl && file?.type.startsWith("video/") && (
            <video src={previewUrl} controls className="max-h-48 w-full rounded-2xl" />
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
      </main>

      {showMediaPicker && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-4 sm:items-center"
          onClick={() => setShowMediaPicker(false)}
        >
          <div
            className="w-full max-w-sm rounded-3xl border border-white/10 bg-zinc-950 p-5"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="mb-4 text-center text-sm uppercase tracking-[0.2em] text-white/45">
              Photo / Video
            </p>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => photoLibraryRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white transition hover:border-emerald-400/60"
              >
                Choose photo
              </button>
              <button
                type="button"
                onClick={() => photoCameraRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white transition hover:border-emerald-400/60"
              >
                Take photo
              </button>
              <button
                type="button"
                onClick={() => videoLibraryRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white transition hover:border-emerald-400/60"
              >
                Choose video
              </button>
              <button
                type="button"
                onClick={() => videoCameraRef.current?.click()}
                className="rounded-2xl border border-white/10 bg-black/30 px-4 py-4 text-white transition hover:border-emerald-400/60"
              >
                Record video
              </button>
              <button
                type="button"
                onClick={() => setShowMediaPicker(false)}
                className="rounded-2xl px-4 py-3 text-sm text-white/50 transition hover:text-white"
              >
                Cancel
              </button>
            </div>

            <input
              ref={photoCameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={photoLibraryRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={videoCameraRef}
              type="file"
              accept="video/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />
            <input
              ref={videoLibraryRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default function UploadPage() {
  const [apiReady, setApiReady] = useState(false);

  useEffect(() => {
    initApiConfig().finally(() => setApiReady(true));
  }, []);

  if (!apiReady) {
    return (
      <main className="flex min-h-screen items-center justify-center text-white/60">
        Loading...
      </main>
    );
  }

  if (!getResolvedApiUrl()) {
    return <SetupNotice />;
  }

  return <UploadForm />;
}
