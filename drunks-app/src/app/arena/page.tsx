"use client";

import { useEffect, useState } from "react";
import AgentCard from "@/components/AgentCard";
import EpochTimer from "@/components/EpochTimer";
import { loadReport, synthesizeAgents } from "@/lib/data";
import { AgentCard as AgentCardType, GSPReport, RAIL_LABELS } from "@/lib/types";

export default function ArenaPage() {
  const [report, setReport] = useState<GSPReport | null>(null);
  const [agents, setAgents] = useState<AgentCardType[]>([]);
  const [filterRail, setFilterRail] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"rank" | "vault" | "patrons">("rank");

  useEffect(() => {
    loadReport().then((r) => {
      setReport(r);
      setAgents(synthesizeAgents(r));
    });
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const rails = ["ALL", ...Object.keys(RAIL_LABELS)];

  let filtered = filterRail === "ALL" ? agents : agents.filter((a) => a.rail === filterRail);

  if (sortBy === "vault") {
    filtered = [...filtered].sort((a, b) => b.vaultBacked - a.vaultBacked);
  } else if (sortBy === "patrons") {
    filtered = [...filtered].sort((a, b) => b.patronCount - a.patronCount);
  }

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[var(--text-primary)]">The Arena</h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {agents.length} agents competing across {report.realms.length} realms
          </p>
        </div>
        <EpochTimer currentEpoch={report.summary.final_height} />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Rail filter */}
        <div className="flex items-center gap-1">
          {rails.map((rail) => (
            <button
              key={rail}
              onClick={() => setFilterRail(rail)}
              className={`px-3 py-1.5 text-[0.65rem] font-mono tracking-wider rounded transition-all ${
                filterRail === rail
                  ? "text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.2)]"
                  : "text-[var(--text-muted)] border border-transparent hover:border-[var(--border-subtle)] hover:text-[var(--text-secondary)]"
              }`}
            >
              {rail === "ALL" ? "ALL" : RAIL_LABELS[rail]}
            </button>
          ))}
        </div>

        <div className="w-px h-6 bg-[var(--border-subtle)] mx-2 hidden md:block" />

        {/* Sort */}
        <div className="flex items-center gap-1">
          <span className="text-[0.6rem] font-mono text-[var(--text-muted)] mr-1">SORT:</span>
          {(["rank", "vault", "patrons"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setSortBy(s)}
              className={`px-2 py-1 text-[0.6rem] font-mono tracking-wider rounded transition-all ${
                sortBy === s
                  ? "text-[var(--accent-violet)] bg-[rgba(155,89,182,0.08)] border border-[rgba(155,89,182,0.2)]"
                  : "text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]"
              }`}
            >
              {s.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Agent Grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((agent) => (
          <AgentCard key={agent.id} agent={agent} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 text-[var(--text-muted)]">
          <p className="text-lg">No agents found for this filter.</p>
        </div>
      )}
    </div>
  );
}
