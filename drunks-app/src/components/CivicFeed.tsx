"use client";

import { truncateHash } from "@/lib/data";

interface CivicEvent {
  epoch: number;
  description: string;
  voteResult: string;
  debateRoot: string;
}

export default function CivicFeed({ events }: { events: CivicEvent[] }) {
  return (
    <div className="space-y-3">
      {events.map((event, i) => (
        <div
          key={i}
          className="glass-panel glass-panel-hover p-5 cursor-pointer group"
        >
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[0.6rem] font-mono px-2 py-0.5 rounded bg-[rgba(0,191,255,0.08)] text-[var(--accent-blue)] border border-[rgba(0,191,255,0.2)]">
              EPOCH {event.epoch}
            </span>
            <span className="text-[0.6rem] font-mono text-[var(--accent-green)]">
              {event.voteResult}
            </span>
          </div>

          <p className="text-sm text-[var(--text-primary)] mb-3">
            {event.description}
          </p>

          {/* Expandable detail - visible on hover */}
          <div className="opacity-60 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-2">
              <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">
                DEBATE ROOT
              </span>
              <span className="hash">
                {truncateHash(event.debateRoot, 12)}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
