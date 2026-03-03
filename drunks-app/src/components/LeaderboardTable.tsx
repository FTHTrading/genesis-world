"use client";

import { PatronEntry, TIER_COLORS } from "@/lib/types";
import { formatNumber } from "@/lib/data";

export default function LeaderboardTable({
  entries,
  title,
  type = "patron",
}: {
  entries: PatronEntry[];
  title: string;
  type?: "patron" | "agent";
}) {
  return (
    <div className="glass-panel p-6">
      <h3 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] mb-4 uppercase">
        {title}
      </h3>
      <div className="space-y-1">
        {/* Header */}
        <div className="grid grid-cols-[40px_1fr_100px_100px_80px_80px] gap-2 px-3 py-2 text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase border-b border-[var(--border-subtle)]">
          <span>RANK</span>
          <span>ACCOUNT</span>
          <span className="text-right">DEPOSITED</span>
          <span className="text-right">REWARDS</span>
          <span className="text-right">AGENTS</span>
          <span className="text-right">TIER</span>
        </div>

        {/* Rows */}
        {entries.map((entry, i) => {
          const name = entry.account_id.replace("patron-", "");
          const tierColor = TIER_COLORS[entry.tier] || "#888";
          return (
            <div
              key={entry.account_id}
              className="grid grid-cols-[40px_1fr_100px_100px_80px_80px] gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-panel-hover)] transition-colors group"
            >
              <span className="text-[0.7rem] font-mono text-[var(--text-muted)]">
                {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
              </span>
              <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                {name}
              </span>
              <span className="text-right text-sm font-mono text-[var(--text-primary)]">
                {formatNumber(entry.total_deposited)}
              </span>
              <span className="text-right text-sm font-mono text-[var(--accent-green)]">
                +{formatNumber(entry.total_rewards)}
              </span>
              <span className="text-right text-sm font-mono text-[var(--text-secondary)]">
                {entry.agents_backed}
              </span>
              <span className="text-right">
                <span
                  className={`tier-badge tier-${entry.tier}`}
                >
                  {entry.tier}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
