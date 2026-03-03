"use client";

import { useEffect, useState } from "react";
import CivicFeed from "@/components/CivicFeed";
import { loadReport, generateCivicEvents, formatNumber, truncateHash } from "@/lib/data";
import { GSPReport } from "@/lib/types";

export default function CivicPage() {
  const [report, setReport] = useState<GSPReport | null>(null);

  useEffect(() => {
    loadReport().then(setReport);
  }, []);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  const events = generateCivicEvents(report);

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Civic View</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Structured governance memory — Moltbook Protocol (GSP-CIVIC)
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-6">
        {/* Main Feed */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase">
              Civilization Feed
            </h2>
            <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">
              {events.length} governance events
            </span>
          </div>
          <CivicFeed events={events} />
        </div>

        {/* Sidebar Stats */}
        <div className="space-y-4">
          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Governance Metrics
            </h3>
            <div className="space-y-3">
              <MetricRow label="Total Threads" value={report.civic.total_threads.toString()} />
              <MetricRow label="Debate Nodes" value={report.civic.total_debate_nodes.toString()} />
              <MetricRow label="Debate Edges" value={report.civic.total_debate_edges.toString()} />
              <MetricRow label="Precedents" value={report.civic.total_precedents.toString()} />
              <MetricRow label="Reputation Actors" value={report.civic.reputation_actors.toString()} />
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Precedent Chain
            </h3>
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-1">HEAD</div>
            <div className="hash break-all">{report.civic.precedent_chain_head}</div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Debate Roots by Epoch
            </h3>
            <div className="space-y-1.5">
              {report.civic.debate_roots.map((root, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[0.55rem] font-mono text-[var(--accent-blue)]">E{i}</span>
                  <span className="hash">{truncateHash(root, 10)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              How It Works
            </h3>
            <div className="text-[0.7rem] text-[var(--text-secondary)] space-y-2">
              <p>Every governance action becomes a <strong>typed thread</strong> in the Moltbook Protocol.</p>
              <p>Threads form a <strong>debate DAG</strong> with Merkle-anchored roots per epoch.</p>
              <p>Dissent, proposals, and resolutions are permanent — the chain remembers <em>why</em> it did what it did.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.65rem] font-mono text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{value}</span>
    </div>
  );
}
