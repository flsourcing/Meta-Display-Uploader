"use client";

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
  const previousCode = useRef<string | null>(null);
  const sessionIdRef = useRef("");

  const applySession = useCallback((data: SessionState) => {
    if (previousCode.current && previousCode.current !== data.code) {
      setFlashClass("");
      previousSeconds.current = null;
    }

    previousCode.current = data.code;
    sessionIdRef.current = data.id;
    setSession(data);
    setSecondsRemaining(data.secondsRemaining);
    setError(null);
  }, []);

  const refreshSession = useCallback(
    async (sessionId: string) => {
      try {
        const data = await refreshDisplaySession(sessionId);
        applySession(data);
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
    },
    [applySession]
  );

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
        applySession(data);
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
    }, 500);

    return () => {
      active = false;
      window.clearInterval(poll);
    };
  }, [applySession, refreshSession]);

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
    }

    previousSeconds.current = secondsRemaining;
  }, [secondsRemaining]);

  useEffect(() => {
    if (!flashClass) return;
    const timeout = window.setTimeout(() => setFlashClass(""), 1100);
    return () => window.clearTimeout(timeout);
  }, [flashClass]);

  if (!apiReady) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white/60">
        Loading...
      </main>
    );
  }

  if (!getResolvedApiUrl()) {
    return <SetupNotice />;
  }

  if (session?.media) {
    return (
      <main className="fixed inset-0 bg-black">
        <MediaViewer media={session.media} />
      </main>
    );
  }

  const uploadUrl = absoluteAppUrl("/upload");

  return (
    <main className="flex min-h-screen items-center justify-center bg-black px-6 py-10">
      <div className="w-full max-w-xl text-center">
        <div
          className={`font-mono text-7xl font-bold tracking-[0.25em] transition-colors duration-300 sm:text-8xl ${getCodeClassName(phase)} ${flashClass}`}
        >
          {session?.code ?? "------"}
        </div>

        <p className="mt-8 text-5xl font-semibold tabular-nums text-white sm:text-6xl">
          {secondsRemaining}s
        </p>

        <div className="mt-12">
          <p className="text-sm uppercase tracking-[0.3em] text-white/40">
            Upload on phone or desktop
          </p>
          <p className="mt-4 break-all font-mono text-base text-emerald-300 sm:text-lg">
            {uploadUrl}
          </p>
        </div>

        {error && (
          <p className="mt-8 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}
      </div>
    </main>
  );
}
