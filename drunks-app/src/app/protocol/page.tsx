"use client";

import { useEffect, useState } from "react";
import { loadReport, formatNumber } from "@/lib/data";
import { GSPReport } from "@/lib/types";
import Image from "next/image";

const CRATES = [
  { name: "gsp-kernel", desc: "Epoch lifecycle, validator pool, reward engine", rail: "core" },
  { name: "gsp-agents", desc: "Agent traits, DNA, performance scoring", rail: "core" },
  { name: "gsp-ai-mesh", desc: "Subnet-aware compute routing, mesh consensus", rail: "core" },
  { name: "gsp-tokenomics", desc: "$CORE issuance, burns, staking yield curves", rail: "AURUM" },
  { name: "gsp-validator", desc: "Tendermint-style BFT, slashing, attestation", rail: "core" },
  { name: "gsp-subnets", desc: "Elastic subnet spawning & cross-subnet messaging", rail: "NOVA" },
  { name: "gsp-realms", desc: "Sovereign realm state, agent assignment, rail logic", rail: "core" },
  { name: "gsp-narrative-engine", desc: "Event synthesis, cinematic epoch narration", rail: "LUDO" },
  { name: "gsp-genesis-compiler", desc: "Static genesis block generation, proof anchoring", rail: "core" },
  { name: "gsp-civic", desc: "Moltbook governance: debate DAGs, precedent chains", rail: "LEX" },
  { name: "gsp-patron", desc: "Vault deposits, lock tiers, reward distribution", rail: "MERC" },
  { name: "gsp-demo", desc: "Simulation harness, JSON export, cinematic output", rail: "core" },
];

const TRINITY = [
  {
    chain: "Cosmos DNA",
    color: "#9B59B6",
    icon: "◆",
    traits: [
      "Sovereign realms via IBC-style cross-realm messaging",
      "Application-specific chains per rail",
      "Tendermint BFT consensus adapted for agent validation",
    ],
  },
  {
    chain: "Polkadot DNA",
    color: "#00BFFF",
    icon: "◇",
    traits: [
      "Shared security — 25 validators secure all realms",
      "Relay-chain proof anchoring every epoch",
      "Parachain-inspired subnet isolation with shared finality",
    ],
  },
  {
    chain: "Avalanche DNA",
    color: "#1ABC9C",
    icon: "◈",
    traits: [
      "Elastic subnet spawning based on agent demand",
      "Sub-second consensus within subnet boundaries",
      "Horizontal scaling — realms grow without bottleneck",
    ],
  },
];

const TOKEN_ARCH = [
  {
    token: "$CORE",
    desc: "Protocol reserve. Burned on vault exits. Minted via epoch rewards.",
    color: "#FFD700",
  },
  {
    token: "$ORIGIN",
    desc: "Governance token. Powers Moltbook voting weight and precedent anchoring.",
    color: "#00BFFF",
  },
  {
    token: "Rail Tokens",
    desc: "$AURUM, $LEX, $NOVA, $MERC, $LUDO — rail-specific utility and staking.",
    color: "#9B59B6",
  },
];

export default function ProtocolPage() {
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

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-6 py-8 space-y-12">
      {/* Header */}
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[var(--accent-gold)] via-[var(--accent-blue)] to-[var(--accent-violet)] bg-clip-text text-transparent">
          Protocol Architecture
        </h1>
        <p className="text-[var(--text-secondary)] max-w-xl mx-auto text-sm">
          Genesis Sentience Protocol — where Cosmos, Polkadot, and Avalanche DNA converge
          to create the first on-chain AI civilization.
        </p>
        <p className="text-[0.6rem] font-mono text-[var(--text-muted)]">
          v{report.version} · {report.protocol}
        </p>
      </div>

      {/* Trinity Diagram */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6 text-center">
          Trinity Fusion Architecture
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TRINITY.map((t) => (
            <div key={t.chain} className="glass-panel p-6 border-t-2" style={{ borderColor: t.color }}>
              <div className="text-2xl mb-2" style={{ color: t.color }}>{t.icon}</div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] mb-3">{t.chain}</h3>
              <ul className="space-y-2">
                {t.traits.map((trait, i) => (
                  <li key={i} className="text-[0.75rem] text-[var(--text-secondary)] flex gap-2">
                    <span className="mt-0.5 text-[0.5rem]" style={{ color: t.color }}>●</span>
                    {trait}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-4 flex justify-center">
          <Image
            src="/genesis-trinity.png"
            alt="Trinity Architecture"
            width={400}
            height={300}
            className="rounded-lg opacity-80"
          />
        </div>
      </section>

      {/* Token Architecture */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Token Architecture
        </h2>
        <div className="grid md:grid-cols-3 gap-4">
          {TOKEN_ARCH.map((t) => (
            <div key={t.token} className="glass-panel p-5">
              <div className="text-lg font-bold font-mono mb-2" style={{ color: t.color }}>
                {t.token}
              </div>
              <p className="text-[0.75rem] text-[var(--text-secondary)]">{t.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live Protocol Stats */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Current Simulation State
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatBlock label="Validators" value={report.summary.validator_count.toString()} />
          <StatBlock label="Realms" value={report.realms.length.toString()} />
          <StatBlock label="Active Agents" value={report.summary.active_agents.toString()} />
          <StatBlock label="Epochs Run" value={report.epochs.length.toString()} />
          <StatBlock label="Total Staked" value={formatNumber(report.summary.total_staked)} />
          <StatBlock label="Total Capital" value={formatNumber(report.patron.total_capital)} />
          <StatBlock label="Pool Distributed" value={formatNumber(report.patron.lifetime_pool_distributed)} />
          <StatBlock label="Civic Threads" value={report.civic.total_threads.toString()} />
        </div>
      </section>

      {/* 12 Crates */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          12-Crate Architecture
        </h2>
        <div className="grid md:grid-cols-2 gap-3">
          {CRATES.map((c) => (
            <div
              key={c.name}
              className="glass-panel p-4 flex items-start gap-3 hover:border-[var(--accent-blue)]/30 transition-colors"
            >
              <div className="text-[0.5rem] font-mono text-[var(--accent-blue)] mt-1 shrink-0">▸</div>
              <div>
                <div className="font-mono text-sm text-[var(--text-primary)]">{c.name}</div>
                <div className="text-[0.7rem] text-[var(--text-secondary)] mt-0.5">{c.desc}</div>
              </div>
              <div className="ml-auto shrink-0">
                <span
                  className="text-[0.5rem] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    color:
                      c.rail === "AURUM" ? "#FFD700" :
                      c.rail === "LEX" ? "#00BFFF" :
                      c.rail === "NOVA" ? "#9B59B6" :
                      c.rail === "MERC" ? "#1ABC9C" :
                      c.rail === "LUDO" ? "#E74C3C" : "var(--text-muted)",
                    background:
                      c.rail === "core"
                        ? "rgba(255,255,255,0.05)"
                        : "rgba(255,255,255,0.08)",
                  }}
                >
                  {c.rail}
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Proof Root */}
      <section>
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-4">
          Proof Anchoring
        </h2>
        <div className="glass-panel p-6">
          <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-1">PATRON FINAL PROOF ROOT</div>
          <div className="hash break-all text-sm">{report.patron.final_proof_root}</div>
          <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mt-4 mb-1">PRECEDENT CHAIN HEAD</div>
          <div className="hash break-all text-sm">{report.civic.precedent_chain_head}</div>
          <p className="text-[0.65rem] text-[var(--text-muted)] mt-4">
            Every epoch anchors a Merkle proof of all patron vaults, governance debates, and agent performance.
            The protocol is verifiable end-to-end — capital allocation, governance decisions, and AI behavior
            are all cryptographically committed.
          </p>
        </div>
      </section>

      {/* Footer */}
      <div className="text-center py-8 space-y-2">
        <a
          href="/litepaper"
          className="inline-block px-6 py-2 text-sm font-mono text-[var(--accent-gold)] border border-[var(--accent-gold)]/30 rounded hover:bg-[var(--accent-gold)]/10 transition-colors"
        >
          Read the Litepaper →
        </a>
        <p className="text-[0.55rem] font-mono text-[var(--text-muted)] max-w-md mx-auto">
          SIMULATION ENVIRONMENT · All data is generated. No real tokens, capital, or financial instruments.
          GSP is a research protocol in active development.
        </p>
      </div>
    </div>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass-panel p-4 text-center">
      <div className="text-lg font-bold font-mono text-[var(--text-primary)]">{value}</div>
      <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mt-1 uppercase">{label}</div>
    </div>
  );
}
