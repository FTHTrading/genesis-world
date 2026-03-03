"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { loadReport, synthesizeAgents, formatNumber, truncateHash } from "@/lib/data";
import { AgentCard, GSPReport, RAIL_LABELS } from "@/lib/types";

export default function AgentDetail({ agentId }: { agentId: string }) {
  const [report, setReport] = useState<GSPReport | null>(null);
  const [agent, setAgent] = useState<AgentCard | null>(null);
  const [allAgents, setAllAgents] = useState<AgentCard[]>([]);
  const [depositAmount, setDepositAmount] = useState("");

  useEffect(() => {
    loadReport().then((r) => {
      setReport(r);
      const agents = synthesizeAgents(r);
      setAllAgents(agents);
      const found = agents.find((a) => a.id === agentId);
      setAgent(found || null);
    });
  }, [agentId]);

  if (!report || !agent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin" />
      </div>
    );
  }

  // Simulate epoch-by-epoch performance
  const epochScores = report.epochs.map((ep, i) => {
    const base = agent.performanceScore;
    const variance = Math.sin(i * 1.5 + agent.dna.riskTolerance * 10) * 15;
    return Math.max(0, Math.round(base + variance));
  });

  // Top patrons for this agent (simulated from global leaderboard)
  const agentPatrons = report.patron.leaderboard
    .filter((_, i) => i % 3 === (agent.rank % 3))
    .slice(0, 5);

  return (
    <div className="min-h-screen max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[0.7rem] font-mono text-[var(--text-muted)]">
        <Link href="/arena" className="hover:text-[var(--accent-blue)] transition-colors">
          ARENA
        </Link>
        <span>→</span>
        <span className="text-[var(--text-secondary)]">{agent.name}</span>
      </div>

      <div className="grid lg:grid-cols-[280px_1fr_300px] gap-6">
        {/* LEFT PANEL: Character Sheet */}
        <div className="space-y-4">
          {/* Avatar */}
          <div className={`glass-panel rail-glow-${agent.rail} p-6 text-center`}>
            <div
              className="w-24 h-24 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold animate-pulse-glow"
              style={{
                background: `${agent.railColor}15`,
                color: agent.railColor,
                border: `2px solid ${agent.railColor}40`,
                boxShadow: `0 0 30px ${agent.railColor}20`,
              }}
            >
              {agent.name.charAt(0)}
            </div>
            <h1 className="text-lg font-bold text-[var(--text-primary)]">{agent.name}</h1>
            <div
              className="text-[0.65rem] font-mono font-bold tracking-widest mt-1"
              style={{ color: agent.railColor }}
            >
              {RAIL_LABELS[agent.rail]} RAIL
            </div>
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mt-1">
              RANK #{agent.rank} of {allAgents.length}
            </div>
            {agent.streak >= 3 && (
              <div className="mt-2 text-[0.6rem] font-mono text-[var(--accent-gold)]">
                {agent.streak}-epoch streak
              </div>
            )}
          </div>

          {/* DNA Panel */}
          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Genetic Vector
            </h3>
            <div className="space-y-3">
              {[
                { label: "Optimization Bias", value: agent.dna.optimizationBias, color: "var(--accent-blue)" },
                { label: "Risk Tolerance", value: agent.dna.riskTolerance, color: "var(--accent-crimson)" },
                { label: "Cooperation Weight", value: agent.dna.cooperationWeight, color: "var(--accent-teal)" },
                { label: "Entropy Affinity", value: agent.dna.entropyAffinity, color: "var(--accent-violet)" },
              ].map((dna) => (
                <div key={dna.label}>
                  <div className="flex justify-between mb-1">
                    <span className="text-[0.6rem] font-mono text-[var(--text-secondary)]">{dna.label}</span>
                    <span className="text-[0.6rem] font-mono font-bold" style={{ color: dna.color }}>
                      {dna.value}
                    </span>
                  </div>
                  <div className="dna-bar">
                    <div
                      className="dna-bar-fill"
                      style={{ width: `${dna.value * 100}%`, background: dna.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Realm Info */}
          <div className="glass-panel p-5">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Realm
            </h3>
            <div className="text-sm font-bold text-[var(--text-primary)] capitalize">{agent.realm}</div>
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mt-1">
              {report.realms.find((r) => r.name === agent.realm)?.agents || 0} agents ·{" "}
              {report.realms.find((r) => r.name === agent.realm)?.validators || 0} validators
            </div>
          </div>
        </div>

        {/* CENTER: Performance */}
        <div className="space-y-4">
          {/* Score Overview */}
          <div className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[var(--text-secondary)] tracking-widest uppercase">
                Performance
              </h2>
              <div className="text-2xl font-bold text-[var(--accent-green)]">{agent.performanceScore}</div>
            </div>

            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <ScoreBlock label="Yield" value={Math.round(agent.dna.optimizationBias * 40)} max={40} color="var(--accent-gold)" />
              <ScoreBlock label="Stability" value={Math.round((1 - agent.dna.riskTolerance) * 30)} max={30} color="var(--accent-blue)" />
              <ScoreBlock label="Governance" value={Math.round(agent.dna.cooperationWeight * 30)} max={30} color="var(--accent-teal)" />
            </div>

            {/* Epoch Performance Chart */}
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Epoch Timeline
            </h3>
            <div className="flex items-end gap-1 h-24">
              {epochScores.map((score, i) => {
                const height = (score / 100) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t transition-all duration-500"
                      style={{
                        height: `${height}%`,
                        background: `linear-gradient(to top, ${agent.railColor}40, ${agent.railColor})`,
                        minHeight: 2,
                      }}
                    />
                    <span className="text-[0.5rem] font-mono text-[var(--text-muted)]">{i}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Epoch History */}
          <div className="glass-panel p-6">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Epoch History
            </h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {report.epochs.map((ep, i) => (
                <div
                  key={ep.epoch}
                  className="flex items-center justify-between px-3 py-2 rounded hover:bg-[var(--bg-panel-hover)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] font-mono text-[var(--accent-blue)]">E{ep.epoch}</span>
                    <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">H:{ep.block_height}</span>
                    <span className="text-xs text-[var(--text-secondary)]">{ep.narrative_summary}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[0.6rem] font-mono text-[var(--accent-green)]">{epochScores[i]}</span>
                    <span className="hash">{truncateHash(ep.narrative_hash, 6)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: Backing Interface */}
        <div className="space-y-4">
          {/* Vault Stats */}
          <div className="glass-panel neon-border p-6">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-4 uppercase">
              Vault
            </h3>
            <div className="space-y-3">
              <StatRow label="Total Backed" value={formatNumber(agent.vaultBacked)} suffix="CORE" />
              <StatRow label="Patron Count" value={agent.patronCount.toString()} />
              <StatRow label="Performance" value={agent.performanceScore.toString()} suffix="pts" />
            </div>
          </div>

          {/* Deposit Panel */}
          <div className="glass-panel p-6">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-4 uppercase">
              Fund This Agent
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-1 block">
                  AMOUNT ($CORE)
                </label>
                <input
                  type="number"
                  placeholder="10,000"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-1 block">
                  LOCK PERIOD
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {["1 Epoch", "5 Epochs", "10 Epochs"].map((period) => (
                    <button
                      key={period}
                      className="px-2 py-1.5 text-[0.6rem] font-mono rounded border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-all"
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>

              {depositAmount && (
                <div className="glass-panel p-3 mt-2">
                  <div className="text-[0.55rem] font-mono text-[var(--text-muted)] mb-1">
                    ESTIMATED PROJECTION (non-guaranteed)
                  </div>
                  <div className="text-sm font-bold text-[var(--accent-green)]">
                    ~{formatNumber(Math.round(Number(depositAmount) * (agent.performanceScore / 100) * 0.2))} CORE
                  </div>
                </div>
              )}

              <button className="w-full py-3 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-violet)] text-white text-sm font-bold tracking-wider hover:opacity-90 transition-opacity">
                FUND THIS AGENT
              </button>

              <p className="text-[0.5rem] font-mono text-[var(--text-muted)] text-center">
                Performance-based distribution. No guaranteed returns. Capital at risk.
              </p>
            </div>
          </div>

          {/* Top Patrons */}
          <div className="glass-panel p-6">
            <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
              Top Patrons
            </h3>
            <div className="space-y-2">
              {agentPatrons.map((patron, i) => {
                const name = patron.account_id.replace("patron-", "");
                return (
                  <div key={patron.account_id} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">
                        {i === 0 ? "1" : `#${i + 1}`}
                      </span>
                      <span className="text-sm font-bold text-[var(--text-primary)]">{name}</span>
                    </div>
                    <span className={`tier-badge tier-${patron.tier}`}>{patron.tier}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatRow({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[0.65rem] font-mono text-[var(--text-secondary)]">{label}</span>
      <span className="text-sm font-bold font-mono text-[var(--text-primary)]">
        {value} {suffix && <span className="text-[0.55rem] text-[var(--text-muted)]">{suffix}</span>}
      </span>
    </div>
  );
}

function ScoreBlock({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold" style={{ color }}>{value}</div>
      <div className="text-[0.5rem] font-mono text-[var(--text-muted)]">{label}</div>
      <div className="h-1 mt-1 rounded bg-[var(--border-subtle)]">
        <div className="h-full rounded" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <div className="text-[0.45rem] font-mono text-[var(--text-muted)] mt-0.5">/{max}</div>
    </div>
  );
}
