"use client";

import { useEffect, useState } from "react";
import LeaderboardTable from "@/components/LeaderboardTable";
import { loadReport, synthesizeAgents, formatNumber } from "@/lib/data";
import { GSPReport, AgentCard, RAIL_LABELS, RAIL_COLORS } from "@/lib/types";

export default function LeaderboardPage() {
  const [report, setReport] = useState<GSPReport | null>(null);
  const [agents, setAgents] = useState<AgentCard[]>([]);
  const [tab, setTab] = useState<"patrons" | "agents" | "rails">("patrons");

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

  // Aggregate capital per rail
  const railStats = report.realms.map((realm) => {
    const realmAgents = agents.filter((a) => a.realm === realm.name);
    const totalVault = realmAgents.reduce((sum, a) => sum + a.vaultBacked, 0);
    const avgScore = realmAgents.length > 0
      ? Math.round(realmAgents.reduce((sum, a) => sum + a.performanceScore, 0) / realmAgents.length)
      : 0;
    return {
      realm: realm.name,
      rail: realm.rail,
      color: RAIL_COLORS[realm.rail] || "#888",
      label: RAIL_LABELS[realm.rail] || realm.rail,
      totalVault,
      avgScore,
      agentCount: realmAgents.length,
    };
  }).sort((a, b) => b.totalVault - a.totalVault);

  return (
    <div className="min-h-screen max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--text-primary)]">Leaderboard</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Season 1 rankings — {report.patron.total_backers} patrons ·{" "}
          {formatNumber(report.patron.total_capital)} $CORE deployed
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6">
        {(["patrons", "agents", "rails"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-[0.7rem] font-mono tracking-widest rounded-lg transition-all ${
              tab === t
                ? "text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.2)]"
                : "text-[var(--text-muted)] border border-transparent hover:text-[var(--text-secondary)]"
            }`}
          >
            TOP {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "patrons" && (
        <LeaderboardTable entries={report.patron.leaderboard} title="Top Patrons by Capital Deployed" />
      )}

      {tab === "agents" && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] mb-4 uppercase">
            Top Agents by Performance Score
          </h3>
          <div className="space-y-1">
            <div className="grid grid-cols-[40px_1fr_80px_100px_80px_100px] gap-2 px-3 py-2 text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase border-b border-[var(--border-subtle)]">
              <span>RANK</span>
              <span>AGENT</span>
              <span>RAIL</span>
              <span className="text-right">SCORE</span>
              <span className="text-right">PATRONS</span>
              <span className="text-right">VAULT</span>
            </div>
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                className="grid grid-cols-[40px_1fr_80px_100px_80px_100px] gap-2 px-3 py-2.5 rounded-lg hover:bg-[var(--bg-panel-hover)] transition-colors group cursor-pointer"
              >
                <span className="text-[0.7rem] font-mono text-[var(--text-muted)]">
                  {i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                </span>
                <span className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
                  {agent.name}
                </span>
                <span className="text-[0.65rem] font-mono font-bold" style={{ color: agent.railColor }}>
                  {RAIL_LABELS[agent.rail]}
                </span>
                <span className="text-right text-sm font-mono text-[var(--accent-green)]">
                  {agent.performanceScore}
                </span>
                <span className="text-right text-sm font-mono text-[var(--text-secondary)]">
                  {agent.patronCount}
                </span>
                <span className="text-right text-sm font-mono text-[var(--text-primary)]">
                  {formatNumber(agent.vaultBacked)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "rails" && (
        <div className="glass-panel p-6">
          <h3 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] mb-4 uppercase">
            Top Rails by Capital Flow
          </h3>
          <div className="space-y-3">
            {railStats.map((rail, i) => (
              <div
                key={rail.realm}
                className="flex items-center gap-4 px-4 py-4 rounded-lg hover:bg-[var(--bg-panel-hover)] transition-colors"
              >
                <span className="text-[0.7rem] font-mono text-[var(--text-muted)] w-8">
                  #{i + 1}
                </span>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                  style={{
                    background: `${rail.color}15`,
                    color: rail.color,
                    border: `1px solid ${rail.color}30`,
                  }}
                >
                  {rail.rail.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-[var(--text-primary)] capitalize">{rail.realm}</div>
                  <div className="text-[0.6rem] font-mono" style={{ color: rail.color }}>
                    {rail.label} Rail · {rail.agentCount} agents
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold font-mono text-[var(--text-primary)]">
                    {formatNumber(rail.totalVault)} CORE
                  </div>
                  <div className="text-[0.6rem] font-mono text-[var(--accent-green)]">
                    avg score: {rail.avgScore}
                  </div>
                </div>
                {/* Capital bar */}
                <div className="w-32 hidden md:block">
                  <div className="h-2 rounded bg-[var(--border-subtle)]">
                    <div
                      className="h-full rounded"
                      style={{
                        width: `${(rail.totalVault / (railStats[0]?.totalVault || 1)) * 100}%`,
                        background: rail.color,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
        <SummaryCard label="Total Capital" value={formatNumber(report.patron.total_capital)} suffix="CORE" />
        <SummaryCard label="Pool Distributed" value={formatNumber(report.patron.lifetime_pool_distributed)} suffix="CORE" />
        <SummaryCard label="Total Backers" value={report.patron.total_backers.toString()} />
        <SummaryCard label="Active Vaults" value={report.patron.total_vaults.toString()} />
      </div>
    </div>
  );
}

function SummaryCard({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="glass-panel p-4 text-center">
      <div className="text-[0.55rem] font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1">{label}</div>
      <div className="text-lg font-bold font-mono text-[var(--text-primary)]">
        {value}
        {suffix && <span className="text-[0.6rem] text-[var(--text-muted)] ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
