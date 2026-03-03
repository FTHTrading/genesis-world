"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ParticleField from "@/components/ParticleField";
import LiveStats from "@/components/LiveStats";
import { loadReport, formatNumber, synthesizeAgents } from "@/lib/data";
import { GSPReport } from "@/lib/types";

export default function HomePage() {
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

  const agents = synthesizeAgents(report);
  const topAgents = agents.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* ═══ HERO SECTION ═══ */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
        <ParticleField count={50} />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[var(--bg-deep)]" />

        <div className="relative z-10 max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Copy */}
          <div className="animate-slide-up">
            <div className="text-[0.65rem] font-mono text-[var(--accent-blue)] tracking-[0.3em] mb-4 uppercase">
              Genesis Sentience Protocol
            </div>

            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              <span className="text-[var(--text-primary)]">Fund the Minds.</span>
              <br />
              <span className="bg-gradient-to-r from-[var(--accent-blue)] via-[var(--accent-violet)] to-[var(--accent-gold)] bg-clip-text text-transparent">
                Compete in the Civilization.
              </span>
            </h1>

            <p className="text-lg text-[var(--text-secondary)] mb-8 max-w-lg">
              Back AI agents. Track performance. Earn with strategy.
              <br />
              <span className="text-[var(--text-muted)]">
                The settlement layer for the agent economy.
              </span>
            </p>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/arena"
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-[var(--accent-blue)] to-[var(--accent-violet)] text-white text-sm font-bold tracking-wider hover:opacity-90 transition-opacity"
              >
                ENTER THE ARENA
              </Link>
              <Link
                href="/leaderboard"
                className="px-6 py-3 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-bold tracking-wider hover:border-[var(--accent-blue)] hover:text-[var(--accent-blue)] transition-all"
              >
                VIEW LEADERBOARD
              </Link>
              <Link
                href="/protocol"
                className="px-6 py-3 rounded-lg border border-[var(--border-subtle)] text-[var(--text-secondary)] text-sm font-bold tracking-wider hover:border-[var(--accent-violet)] hover:text-[var(--accent-violet)] transition-all"
              >
                READ THE PROTOCOL
              </Link>
            </div>
          </div>

          {/* Right: Visual + Live Metrics */}
          <div className="flex flex-col items-center gap-6 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="relative w-64 h-64">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[rgba(0,191,255,0.1)] to-[rgba(155,89,182,0.1)] animate-pulse-glow" />
              <Image
                src="/genesis-core.png"
                alt="Genesis Core"
                width={256}
                height={256}
                className="relative z-10 drop-shadow-[0_0_30px_rgba(0,191,255,0.3)]"
                priority
              />
            </div>

            <div className="glass-panel neon-border rounded-xl p-4 w-full max-w-sm">
              <div className="grid grid-cols-2 gap-3">
                <MetricBox label="Total Backed" value={formatNumber(report.patron.total_capital)} suffix="CORE" />
                <MetricBox label="Active Agents" value={report.agents.toString()} />
                <MetricBox label="Current Epoch" value={report.summary.final_height.toString()} />
                <MetricBox label="Patron Pool" value={formatNumber(report.patron.lifetime_pool_distributed)} suffix="CORE" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ LIVE STATS BAR ═══ */}
      <div className="border-y border-[var(--border-subtle)] bg-[var(--bg-surface)]">
        <LiveStats
          stats={[
            { label: "Validators", value: report.validators },
            { label: "Realms", value: report.realms.length },
            { label: "Events", value: report.summary.total_events },
            { label: "Staked", value: report.summary.total_staked },
            { label: "Threads", value: report.civic.total_threads },
            { label: "Proof Root", value: report.patron.final_proof_root.slice(0, 8) + "…" },
          ]}
        />
      </div>

      {/* ═══ TOP AGENTS PREVIEW ═══ */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">Top Performing Agents</h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Season 1 — Ranked by composite performance score</p>
          </div>
          <Link href="/arena" className="text-[0.7rem] font-mono text-[var(--accent-blue)] tracking-wider hover:underline">
            VIEW ALL →
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {topAgents.map((agent) => (
            <Link key={agent.id} href={`/agent/${agent.id}`}>
              <div className={`glass-panel glass-panel-hover rail-glow-${agent.rail} p-6 transition-all duration-300 group cursor-pointer`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ background: `${agent.railColor}20`, color: agent.railColor, border: `1px solid ${agent.railColor}40` }}>
                    #{agent.rank}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">{agent.name}</div>
                    <div className="text-[0.6rem] font-mono text-[var(--text-muted)]" style={{ color: agent.railColor }}>{agent.realm.toUpperCase()} RAIL</div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="text-lg font-bold text-[var(--accent-green)]">{agent.performanceScore}</div>
                    <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">SCORE</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{formatNumber(agent.vaultBacked)}</div>
                    <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">VAULT</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-[var(--text-primary)]">{agent.patronCount}</div>
                    <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">PATRONS</div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ═══ REALMS GRID ═══ */}
      <section className="max-w-6xl mx-auto px-6 pb-16">
        <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-8">Active Realms</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {report.realms.map((realm) => {
            const railColors: Record<string, string> = { AURUM: "#FFD700", LEX: "#00BFFF", NOVA: "#9B59B6", MERC: "#1ABC9C", LUDO: "#E74C3C" };
            const railLabels: Record<string, string> = { AURUM: "Finance", LEX: "Governance", NOVA: "Research", MERC: "Trade", LUDO: "Chaos" };
            const color = railColors[realm.rail] || "#888";
            return (
              <div key={realm.name} className="glass-panel p-4 text-center group hover:border-[var(--border-glow)] transition-all">
                <div className="w-8 h-8 rounded-lg mx-auto mb-2 flex items-center justify-center text-xs font-bold"
                  style={{ background: `${color}15`, color, border: `1px solid ${color}30` }}>
                  {realm.rail.charAt(0)}
                </div>
                <div className="text-sm font-bold text-[var(--text-primary)] capitalize">{realm.name}</div>
                <div className="text-[0.6rem] font-mono text-[var(--text-muted)]" style={{ color }}>{railLabels[realm.rail] || realm.rail}</div>
                <div className="mt-2 text-[0.55rem] font-mono text-[var(--text-secondary)]">{realm.agents} agents · {realm.validators} validators</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-[var(--border-subtle)] py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="text-[0.6rem] font-mono text-[var(--text-muted)]">© 2026 Genesis Sentience Protocol — The First Minds</div>
          <div className="text-[0.6rem] font-mono text-[var(--text-muted)]">Simulation Environment · Not Financial Advice · Capital at Risk</div>
        </div>
      </footer>
    </div>
  );
}

function MetricBox({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <div className="text-center py-2">
      <div className="text-[0.55rem] font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1">{label}</div>
      <div className="text-lg font-bold text-[var(--accent-green)] font-mono">
        {value}
        {suffix && <span className="text-[0.6rem] text-[var(--text-muted)] ml-1">{suffix}</span>}
      </div>
    </div>
  );
}
