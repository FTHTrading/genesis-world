"use client";

import { useEffect, useState } from "react";

export default function EpochTimer({ currentEpoch }: { currentEpoch: number }) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds((s) => (s + 1) % 120); // 2 minute epoch cycle
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = 120 - seconds;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  const progress = (seconds / 120) * 100;

  return (
    <div className="glass-panel p-4 flex items-center gap-4">
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase">
            CURRENT EPOCH
          </span>
          <span className="text-sm font-bold font-mono text-[var(--accent-blue)]">
            {currentEpoch}
          </span>
        </div>
        <div className="h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-violet)] transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">
            NEXT EPOCH IN
          </span>
          <span className="text-[0.7rem] font-mono text-[var(--accent-green)]">
            {mins}:{secs.toString().padStart(2, "0")}
          </span>
        </div>
      </div>
    </div>
  );
}
