"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MediaViewer } from "@/components/MediaViewer";
import { SetupNotice } from "@/components/SetupNotice";
import {
  CRITICAL_AT_SECONDS,
  WARNING_AT_SECONDS,
  getCodePhase,
  type CodePhase,
} from "@/lib/code";
import { absoluteAppUrl } from "@/lib/paths";
import {
  ensureDisplaySession,
  refreshDisplaySession,
} from "@/lib/room-service";
import { getResolvedApiUrl, initApiConfig } from "@/lib/api";
import type { SessionState } from "@/lib/types";

function getCodeClassName(phase: CodePhase): string {
  if (phase === "warning") return "code-warning";
  if (phase === "critical") return "code-critical";
  return "code-fresh";
}

export default function DisplayPage() {
  const [apiReady, setApiReady] = useState(false);
  const [session, setSession] = useState<SessionState | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [phase, setPhase] = useState<CodePhase>("fresh");
  const [flashClass, setFlashClass] = useState("");
  const [error, setError] = useState<string | null>(null);
  const previousSeconds = useRef<number | null>(null);
  const sessionIdRef = useRef("");

  const refreshSession = useCallback(async (sessionId: string) => {
    try {
      const data = await refreshDisplaySession(sessionId);
      setSession(data);
      setSecondsRemaining(data.secondsRemaining);
      setError(null);
      return data;
    } catch (refreshError) {
      const message =
        refreshError instanceof Error
          ? refreshError.message
          : "Could not refresh session.";
      setError(
        message === "Failed to fetch"
          ? `Cannot reach API at ${getResolvedApiUrl() ?? "unknown"}. Check Railway is online and CORS_ORIGIN is set.`
          : message
      );
      return null;
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function bootstrap() {
      const apiUrl = await initApiConfig();
      if (!active) return;

      setApiReady(true);
      if (!apiUrl) return;

      try {
        const data = await ensureDisplaySession();
        if (!active) return;

        sessionIdRef.current = data.id;
        setSession(data);
        setSecondsRemaining(data.secondsRemaining);
        setError(null);
      } catch (bootstrapError) {
        if (!active) return;
        const message =
          bootstrapError instanceof Error
            ? bootstrapError.message
            : "Could not start display session.";
        setError(
          message === "Failed to fetch"
            ? `Cannot reach API at ${apiUrl}. Check Railway is online and CORS_ORIGIN is set.`
            : message
        );
      }
    }

    bootstrap();

    const poll = window.setInterval(() => {
      if (sessionIdRef.current) {
        void refreshSession(sessionIdRef.current);
      }
    }, 1000);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, [refreshSession]);

  useEffect(() => {
    if (!session) return;

    const timer = window.setInterval(() => {
      setSecondsRemaining((current) => {
        if (current <= 1) {
          void refreshSession(session.id);
          return 30;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [refreshSession, session]);

  useEffect(() => {
    const nextPhase = getCodePhase(secondsRemaining);
    setPhase(nextPhase);

    const previous = previousSeconds.current;
    if (previous !== null) {
      if (previous > WARNING_AT_SECONDS && secondsRemaining === WARNING_AT_SECONDS) {
        setFlashClass("flash-warning");
      }
      if (previous > CRITICAL_AT_SECONDS && secondsRemaining === CRITICAL_AT_SECONDS) {
        setFlashClass("flash-critical");
      }
      if (previous <= 1 && secondsRemaining === 30) {
        setFlashClass("");
      }
    }

    previousSeconds.current = secondsRemaining;
  }, [secondsRemaining]);

  useEffect(() => {
    if (!flashClass) return;
    const timeout = window.setTimeout(() => setFlashClass(""), 1100);
    return () => window.clearInterval(timeout);
  }, [flashClass]);

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

  const uploadUrl =
    session != null
      ? absoluteAppUrl(`/upload?code=${session.code}`)
      : absoluteAppUrl("/upload");

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 py-6 sm:px-8 sm:py-10">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-white/45">
            Meta Display
          </p>
          <h1 className="text-2xl font-semibold text-white">Glasses Pairing Code</h1>
        </div>
        <Link
          href="/upload"
          className="rounded-full border border-white/15 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
        >
          Upload page
        </Link>
      </header>

      {error && (
        <p className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </p>
      )}

      <section className="grid flex-1 gap-6 lg:grid-cols-[320px_1fr]">
        <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 sm:p-8">
          <p className="mb-3 text-sm uppercase tracking-[0.25em] text-white/45">
            Current code
          </p>
          <div
            className={`font-mono text-6xl font-bold tracking-[0.2em] transition-colors duration-300 sm:text-7xl ${getCodeClassName(phase)} ${flashClass}`}
          >
            {session?.code ?? "------"}
          </div>
          <div className="mt-6 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-white/45">
                Expires in
              </p>
              <p className="mt-1 text-4xl font-semibold tabular-nums">{secondsRemaining}s</p>
            </div>
            <div className="text-right text-xs text-white/45">
              <p>Green: fresh code</p>
              <p>Yellow flash at 20s</p>
              <p>Red flash at 10s</p>
            </div>
          </div>
          <div className="mt-6 rounded-2xl bg-black/30 p-4 text-sm text-white/60">
            <p className="mb-2 text-white/80">Send media to these glasses:</p>
            <p className="break-all font-mono text-xs text-emerald-300/90">{uploadUrl}</p>
          </div>
        </div>

        <div className="flex min-h-[360px] flex-col rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-6">
          <p className="mb-4 text-sm uppercase tracking-[0.25em] text-white/45">
            Live display
          </p>
          <div className="flex-1">
            <MediaViewer media={session?.media ?? null} />
          </div>
        </div>
      </section>
    </main>
  );
}
