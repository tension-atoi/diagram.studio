"use client";

import { useEffect, useState } from "react";
import { Copy, Check, Zap, HardDrive } from "lucide-react";

interface RuntimeStatus {
  engine: {
    reachable: boolean;
    model: string;
    modelMissing: boolean;
    detail: string;
  };
  verifier: { configured: boolean };
}

const POLL_INTERVAL_MS = 10_000;

export function DesktopStatusBar() {
  const [copied, setCopied] = useState(false);
  const [status, setStatus] = useState<RuntimeStatus | null>(null);
  const cachePath = "~/.cache/gnu-in-labs-diagram-studio/";

  const handleCopyCache = async () => {
    try {
      await navigator.clipboard.writeText(cachePath);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // ignore
    }
  };

  // The engine is a precondition rather than a claim, so it is asked for: the
  // studio says nothing is wrong until it has tried. Before the first answer
  // arrives the badge is neutral rather than green.
  useEffect(() => {
    let cancelled = false;

    const probe = async () => {
      try {
        const response = await fetch("/api/runtime", { cache: "no-store" });
        if (!response.ok) return;
        const next = (await response.json()) as RuntimeStatus;
        if (!cancelled) setStatus(next);
      } catch {
        // The probe is advisory; a failure leaves the previous verdict in place.
      }
    };

    void probe();
    const timer = setInterval(probe, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const engine = status?.engine;
  const ready = Boolean(engine?.reachable) && !engine?.modelMissing;
  const engineColor = !engine ? "#525a66" : ready ? "#8DA982" : "#d08a5a";
  const engineLabel = !engine
    ? "CHECKING ENGINE"
    : !engine.reachable
      ? "OLLAMA NOT REACHING"
      : engine.modelMissing
        ? "MODEL NOT PULLED"
        : `OLLAMA LOCAL : 11434`;

  return (
    <footer className="mt-auto h-7 border-t border-[var(--border)] bg-[#0d0f12] font-mono text-[11px] text-[#788290] transition-colors duration-150 select-none">
      <div className="flex h-full w-full items-center justify-between px-3 sm:px-4">
        {/* Left: Engine & verifier status, asked of the server rather than asserted */}
        <div className="flex items-center gap-3 overflow-hidden sm:gap-4">
          <div
            className="flex items-center gap-1.5"
            style={{ color: engineColor }}
            title={engine?.detail}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${ready ? "animate-pulse" : ""}`}
              style={{ backgroundColor: engineColor }}
            />
            <span className="text-[10px] font-semibold tracking-wider uppercase">
              {engineLabel}
            </span>
          </div>

          <span className="hidden text-[#2B3037] md:inline">|</span>

          <div className="hidden items-center gap-1 text-[#a0aab8] sm:flex">
            <span className="text-[#5F7F52]">MODEL:</span>
            <span className="font-medium text-white">
              {engine?.model ?? "…"}
            </span>
          </div>

          <span className="hidden text-[#2B3037] lg:inline">|</span>

          <div
            className="hidden items-center gap-1 lg:flex"
            style={{
              color: status?.verifier.configured ? "#8DA982" : "#525a66",
            }}
            title={
              status?.verifier.configured
                ? "Jev System One semantic verification is configured"
                : "No TypeSafe/Jev key is configured, so semantic verification is off"
            }
          >
            <Zap
              className={`h-2.5 w-2.5 ${status?.verifier.configured ? "fill-[#8DA982]" : ""}`}
            />
            <span className="text-[10px] font-medium tracking-wide">
              {status?.verifier.configured
                ? "JEV S1 VERIFIER ACTIVE"
                : "JEV VERIFIER OFF"}
            </span>
          </div>
        </div>

        {/* Center: Local storage path */}
        <div
          onClick={handleCopyCache}
          className="hover-[#16191e] hidden cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 transition-colors hover:text-white md:flex"
          title="Click to copy cache directory"
        >
          <HardDrive className="h-2.5 w-2.5 text-[#5F7F52]" />
          <span>cache: {cachePath}</span>
          {copied ? (
            <Check className="h-2.5 w-2.5 text-[#8DA982]" />
          ) : (
            <Copy className="h-2.5 w-2.5 text-[#525a66] hover:text-white" />
          )}
        </div>

        {/* Right: local install identity */}
        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <span className="flex items-center gap-1 text-[10px] font-semibold text-[#5F7F52] uppercase">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5F7F52]" />
            LOCAL STUDIO
          </span>

          <span className="hidden text-[#2B3037] sm:inline">|</span>

          <span className="hidden text-[#525a66] sm:inline">
            gnu.in.labs <span className="text-[10px]">v0.1.0</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
