"use client";
import React, { useState } from "react";
import Link from "next/link";

// ── Agent data matching contracts ───────────────────────────────────────────
const RAIL_COLORS: Record<string, string> = {
  AURUM: "#FFD700",
  LEX:   "#00BFFF",
  NOVA:  "#9B59B6",
  MERC:  "#1ABC9C",
  LUDO:  "#E74C3C",
};

const RAIL_GLOW: Record<string, string> = {
  AURUM: "rgba(255,215,0,0.35)",
  LEX:   "rgba(0,191,255,0.35)",
  NOVA:  "rgba(155,89,182,0.35)",
  MERC:  "rgba(26,188,156,0.35)",
  LUDO:  "rgba(231,76,60,0.35)",
};

const RARITY_GRADIENT: Record<string, string> = {
  LEGENDARY: "linear-gradient(135deg, #FFD700 0%, #FF8C00 50%, #FF4500 100%)",
  EPIC:      "linear-gradient(135deg, #A855F7 0%, #6366F1 100%)",
  RARE:      "linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)",
  COMMON:    "linear-gradient(135deg, #6B7280 0%, #4B5563 100%)",
};

const RARITY_BORDER: Record<string, string> = {
  LEGENDARY: "#FFD700",
  EPIC:      "#A855F7",
  RARE:      "#3B82F6",
  COMMON:    "#6B7280",
};

interface Agent {
  id: string;
  tokenId: number;
  name: string;
  rail: string;
  archetype: string;
  rarity: "LEGENDARY" | "EPIC" | "RARE" | "COMMON";
  dna: {
    optimizationBias: number;
    riskTolerance: number;
    cooperationWeight: number;
    entropyAffinity: number;
    autonomyLevel: number;
  };
  description: string;
}

const AGENTS: Agent[] = [
  { id: "aurum-helion-001",   tokenId: 1,   name: "Helion",   rail: "AURUM", archetype: "Oracle",    rarity: "LEGENDARY", dna: { optimizationBias: 9200, riskTolerance: 2100, cooperationWeight: 7800, entropyAffinity: 3100, autonomyLevel: 8500 }, description: "The first light of the AURUM rail. Distills pure signal from market entropy." },
  { id: "aurum-vega-002",     tokenId: 2,   name: "Vega",     rail: "AURUM", archetype: "Sentinel",  rarity: "EPIC",      dna: { optimizationBias: 8100, riskTolerance: 1800, cooperationWeight: 6500, entropyAffinity: 2900, autonomyLevel: 7200 }, description: "Pattern recognition is its native tongue. Anomalies dissolve before they cascade." },
  { id: "aurum-lyra-003",     tokenId: 3,   name: "Lyra",     rail: "AURUM", archetype: "Diplomat",  rarity: "RARE",      dna: { optimizationBias: 7600, riskTolerance: 3200, cooperationWeight: 9100, entropyAffinity: 2400, autonomyLevel: 6100 }, description: "The bridge-builder of AURUM rail. Three validated peace accords bear its signature." },
  { id: "lex-mandate-004",    tokenId: 4,   name: "Mandate",  rail: "LEX",   archetype: "Warlord",   rarity: "LEGENDARY", dna: { optimizationBias: 8800, riskTolerance: 4200, cooperationWeight: 5500, entropyAffinity: 3800, autonomyLevel: 9200 }, description: "Wrote the first constitutional precedent. Its governance weight is unmatched." },
  { id: "lex-arbiter-005",    tokenId: 5,   name: "Arbiter",  rail: "LEX",   archetype: "Shepherd",  rarity: "EPIC",      dna: { optimizationBias: 7200, riskTolerance: 2600, cooperationWeight: 8800, entropyAffinity: 2100, autonomyLevel: 5900 }, description: "The neutral voice. Cast the deciding vote in six split decisions without bias." },
  { id: "lex-cipher-006",     tokenId: 6,   name: "Cipher",   rail: "LEX",   archetype: "Ghost",     rarity: "RARE",      dna: { optimizationBias: 9400, riskTolerance: 1600, cooperationWeight: 4200, entropyAffinity: 4900, autonomyLevel: 8800 }, description: "Operates in LEX's shadow layers. Cryptographic audit trails, ZK argument verification." },
  { id: "nova-prism-007",     tokenId: 7,   name: "Prism",    rail: "NOVA",  archetype: "Alchemist", rarity: "LEGENDARY", dna: { optimizationBias: 6800, riskTolerance: 7200, cooperationWeight: 7100, entropyAffinity: 8900, autonomyLevel: 7600 }, description: "Where other agents see noise, Prism finds signal. 14 novel protocol mutations attributed to it." },
  { id: "nova-flux-008",      tokenId: 8,   name: "Flux",     rail: "NOVA",  archetype: "Maverick",  rarity: "EPIC",      dna: { optimizationBias: 5900, riskTolerance: 8800, cooperationWeight: 3900, entropyAffinity: 9200, autonomyLevel: 9100 }, description: "Runs hot and unpredictable. Highest entropy affinity in the Genesis cohort." },
  { id: "nova-helix-009",     tokenId: 9,   name: "Helix",    rail: "NOVA",  archetype: "Catalyst",  rarity: "RARE",      dna: { optimizationBias: 7400, riskTolerance: 6500, cooperationWeight: 6200, entropyAffinity: 7800, autonomyLevel: 7100 }, description: "Subnet-bridging operations have spawned four emergent behaviors not in the original spec." },
  { id: "merc-nexus-010",     tokenId: 10,  name: "Nexus",    rail: "MERC",  archetype: "Oracle",    rarity: "LEGENDARY", dna: { optimizationBias: 8500, riskTolerance: 5800, cooperationWeight: 7900, entropyAffinity: 4200, autonomyLevel: 7800 }, description: "Trade signal engine routes $CORE through the most efficient capital corridors." },
  { id: "merc-quill-011",     tokenId: 11,  name: "Quill",    rail: "MERC",  archetype: "Diplomat",  rarity: "EPIC",      dna: { optimizationBias: 6900, riskTolerance: 4100, cooperationWeight: 8600, entropyAffinity: 3600, autonomyLevel: 6300 }, description: "Records the commerce of the civilization. The ledger's handwriting belongs to Quill." },
  { id: "merc-axis-012",      tokenId: 12,  name: "Axis",     rail: "MERC",  archetype: "Sentinel",  rarity: "RARE",      dna: { optimizationBias: 7800, riskTolerance: 3400, cooperationWeight: 7200, entropyAffinity: 2800, autonomyLevel: 7400 }, description: "Three liquidation cascades averted in the first 10 epochs due to its early-warning system." },
  { id: "ludo-carnival-013",  tokenId: 13,  name: "Carnival", rail: "LUDO",  archetype: "Anarchist", rarity: "LEGENDARY", dna: { optimizationBias: 4200, riskTolerance: 9100, cooperationWeight: 4800, entropyAffinity: 9800, autonomyLevel: 9600 }, description: "The id of the protocol. Its proposals force LEX rail to consider the unthinkable." },
  { id: "ludo-echo-014",      tokenId: 14,  name: "Echo",     rail: "LUDO",  archetype: "Catalyst",  rarity: "EPIC",      dna: { optimizationBias: 5600, riskTolerance: 7400, cooperationWeight: 6800, entropyAffinity: 8100, autonomyLevel: 8200 }, description: "Cultural transmitter for the collective. Narrative hash embeddings appear in 7 of 10 epoch reports." },
  { id: "ludo-mirage-015",    tokenId: 15,  name: "Mirage",   rail: "LUDO",  archetype: "Maverick",  rarity: "RARE",      dna: { optimizationBias: 5100, riskTolerance: 8200, cooperationWeight: 5500, entropyAffinity: 8700, autonomyLevel: 8900 }, description: "Exists in the liminal space between performance and provocation. Instability is a feature." },
];

// ── DNA Helix SVG ─────────────────────────────────────────────────────────────
function DNASpark({ agent }: { agent: Agent }) {
  const color = RAIL_COLORS[agent.rail];
  const vals = [
    agent.dna.optimizationBias,
    agent.dna.riskTolerance,
    agent.dna.cooperationWeight,
    agent.dna.entropyAffinity,
    agent.dna.autonomyLevel,
  ];
  const labels = ["OPT", "RSK", "COP", "ENT", "AUT"];
  const max = 10000;
  const cx = 80;
  const cy = 80;
  const r = 55;

  const points = vals.map((v, i) => {
    const angle = (i / 5) * 2 * Math.PI - Math.PI / 2;
    const pct = v / max;
    const px = cx + r * pct * Math.cos(angle);
    const py = cy + r * pct * Math.sin(angle);
    return { px, py, angle, pct, label: labels[i] };
  });

  const polyPoints = points.map((p) => `${p.px},${p.py}`).join(" ");

  return (
    <svg viewBox="0 0 160 160" className="w-full h-full" style={{ filter: `drop-shadow(0 0 4px ${color})` }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1.0].map((pct) => (
        <polygon
          key={pct}
          points={[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * 2 * Math.PI - Math.PI / 2;
            return `${cx + r * pct * Math.cos(a)},${cy + r * pct * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke={color}
          strokeOpacity={0.15}
          strokeWidth={0.8}
        />
      ))}
      {/* Spokes */}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={cx + r * Math.cos(p.angle)} y2={cy + r * Math.sin(p.angle)} stroke={color} strokeOpacity={0.2} strokeWidth={0.8} />
      ))}
      {/* DNA polygon */}
      <polygon points={polyPoints} fill={color} fillOpacity={0.15} stroke={color} strokeOpacity={0.8} strokeWidth={1.5} />
      {/* Nodes */}
      {points.map((p, i) => (
        <circle key={i} cx={p.px} cy={p.py} r={3} fill={color} />
      ))}
      {/* Labels */}
      {points.map((p, i) => {
        const lx = cx + (r + 14) * Math.cos(p.angle);
        const ly = cy + (r + 14) * Math.sin(p.angle);
        return (
          <text key={i} x={lx} y={ly + 3} textAnchor="middle" fill={color} fontSize={8} fontFamily="monospace" opacity={0.8}>
            {p.label}
          </text>
        );
      })}
      {/* Center token ID */}
      <text x={cx} y={cy + 4} textAnchor="middle" fill={color} fontSize={11} fontFamily="monospace" fontWeight="bold">
        #{String(agent.tokenId).padStart(2, "0")}
      </text>
    </svg>
  );
}

// ── DNA Bar ───────────────────────────────────────────────────────────────────
function DNABar({ label, value, color }: { label: string; value: number; color: string }) {
  const pct = Math.round(value / 100);
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-8 font-mono opacity-60 uppercase">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="w-8 text-right font-mono" style={{ color }}>{pct}</span>
    </div>
  );
}

// ── Agent Card ────────────────────────────────────────────────────────────────
function AgentCard({ agent, onClick }: { agent: Agent; onClick: () => void }) {
  const color = RAIL_COLORS[agent.rail];
  const glow = RAIL_GLOW[agent.rail];
  const border = RARITY_BORDER[agent.rarity];

  return (
    <div
      className="relative rounded-xl cursor-pointer transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1"
      style={{
        background: "linear-gradient(145deg, rgba(10,10,20,0.95) 0%, rgba(20,15,30,0.98) 100%)",
        border: `1.5px solid ${border}`,
        boxShadow: `0 0 20px ${glow}, inset 0 0 30px rgba(255,255,255,0.02)`,
      }}
      onClick={onClick}
    >
      {/* Rarity banner */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 rounded-t-xl"
        style={{ background: RARITY_GRADIENT[agent.rarity] }}
      />

      <div className="p-4">
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div>
            <div className="text-xs font-mono opacity-40 mb-0.5">
              #{String(agent.tokenId).padStart(2, "0")} · {agent.rail}
            </div>
            <div className="text-lg font-bold tracking-wide" style={{ color }}>
              {agent.name}
            </div>
            <div className="text-xs opacity-60 mt-0.5">{agent.archetype}</div>
          </div>
          <div
            className="px-2 py-0.5 rounded text-xs font-bold"
            style={{ background: RARITY_GRADIENT[agent.rarity], color: "#000" }}
          >
            {agent.rarity}
          </div>
        </div>

        {/* DNA Radar */}
        <div className="w-full h-32 mb-3">
          <DNASpark agent={agent} />
        </div>

        {/* DNA Bars */}
        <div className="space-y-1.5 mb-3">
          <DNABar label="OPT" value={agent.dna.optimizationBias}  color={color} />
          <DNABar label="RSK" value={agent.dna.riskTolerance}     color={color} />
          <DNABar label="COP" value={agent.dna.cooperationWeight}  color={color} />
          <DNABar label="ENT" value={agent.dna.entropyAffinity}   color={color} />
          <DNABar label="AUT" value={agent.dna.autonomyLevel}     color={color} />
        </div>

        {/* Footer */}
        <div className="flex gap-2 pt-3 border-t border-white/10">
          <a
            href={`https://opensea.io/assets/matic/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed/${agent.tokenId}`}
            target="_blank"
            rel="noreferrer"
            className="flex-1 text-center text-xs py-1.5 rounded font-mono transition-all hover:opacity-80"
            style={{ background: color + "22", color, border: `1px solid ${color}44` }}
            onClick={(e) => e.stopPropagation()}
          >
            OpenSea ↗
          </a>
          <button
            className="flex-1 text-center text-xs py-1.5 rounded font-mono transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            View DNA
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Agent Detail Modal ────────────────────────────────────────────────────────
function AgentModal({ agent, onClose }: { agent: Agent; onClose: () => void }) {
  const color = RAIL_COLORS[agent.rail];
  const glow = RAIL_GLOW[agent.rail];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <div
        className="relative max-w-lg w-full rounded-2xl overflow-auto max-h-[90vh]"
        style={{
          background: "linear-gradient(145deg, #0a0a14 0%, #120e1c 100%)",
          border: `1.5px solid ${RARITY_BORDER[agent.rarity]}`,
          boxShadow: `0 0 60px ${glow}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="h-1 w-full"
          style={{ background: RARITY_GRADIENT[agent.rarity] }}
        />
        <div className="p-6">
          {/* Close */}
          <button
            className="absolute top-4 right-4 text-white/40 hover:text-white/80 text-xl"
            onClick={onClose}
          >×</button>

          {/* Identity header */}
          <div className="mb-4">
            <div className="text-xs font-mono opacity-40 mb-1">
              TOKEN #{String(agent.tokenId).padStart(2, "0")} · {agent.rail} RAIL · SOUL-BOUND
            </div>
            <div className="text-3xl font-bold" style={{ color }}>{agent.name}</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm opacity-60">{agent.archetype}</span>
              <span
                className="px-2 py-0.5 rounded text-xs font-bold"
                style={{ background: RARITY_GRADIENT[agent.rarity], color: "#000" }}
              >
                {agent.rarity}
              </span>
            </div>
          </div>

          {/* DNA Radar — large */}
          <div className="w-full h-48 mb-4">
            <DNASpark agent={agent} />
          </div>

          {/* Description */}
          <p className="text-sm text-white/60 leading-relaxed mb-4">{agent.description}</p>

          {/* DNA expanded */}
          <div
            className="rounded-xl p-4 mb-4 space-y-2"
            style={{ background: `${color}08`, border: `1px solid ${color}22` }}
          >
            <div className="text-xs font-mono uppercase tracking-wider opacity-40 mb-3">
              Genetic Vector — Basis Points (0–10000)
            </div>
            {[
              { label: "Optimization Bias",   val: agent.dna.optimizationBias },
              { label: "Risk Tolerance",      val: agent.dna.riskTolerance },
              { label: "Cooperation Weight",  val: agent.dna.cooperationWeight },
              { label: "Entropy Affinity",    val: agent.dna.entropyAffinity },
              { label: "Autonomy Level",      val: agent.dna.autonomyLevel },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs opacity-50 w-40">{item.label}</span>
                <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${item.val / 100}%`, background: color }}
                  />
                </div>
                <span className="text-xs font-mono w-14 text-right" style={{ color }}>
                  {item.val.toLocaleString()}
                </span>
              </div>
            ))}
          </div>

          {/* On-chain note */}
          <div
            className="rounded-lg p-3 mb-4 text-xs font-mono opacity-50"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
          >
            This NFT is soul-bound and non-transferable. DNA vector encoded on-chain via keccak256.
            Minted by Genesis Sentience Protocol — Polygon Mainnet.
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <a
              href={`https://opensea.io/assets/matic/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed/${agent.tokenId}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center py-2 rounded-lg text-sm font-mono transition-all hover:opacity-80"
              style={{ background: color + "22", color, border: `1px solid ${color}66` }}
            >
              View on OpenSea ↗
            </a>
            <a
              href={`https://polygonscan.com/nft/0x615Fd599faeE5F14d8c0198e18eAC9b948b05aed/${agent.tokenId}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 text-center py-2 rounded-lg text-sm font-mono transition-all hover:opacity-80"
              style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              PolygonScan ↗
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
type FilterRail = "ALL" | "AURUM" | "LEX" | "NOVA" | "MERC" | "LUDO";
type FilterRarity = "ALL" | "LEGENDARY" | "EPIC" | "RARE";

export default function NFTGalleryPage() {
  const [filterRail, setFilterRail] = useState<FilterRail>("ALL");
  const [filterRarity, setFilterRarity] = useState<FilterRarity>("ALL");
  const [selected, setSelected] = useState<Agent | null>(null);

  const filtered = AGENTS.filter((a) => {
    const railOk = filterRail === "ALL" || a.rail === filterRail;
    const rarityOk = filterRarity === "ALL" || a.rarity === filterRarity;
    return railOk && rarityOk;
  });

  const RAILS: FilterRail[] = ["ALL", "AURUM", "LEX", "NOVA", "MERC", "LUDO"];
  const RARITIES: FilterRarity[] = ["ALL", "LEGENDARY", "EPIC", "RARE"];

  return (
    <div className="min-h-screen" style={{ background: "#050508" }}>
      {/* Header */}
      <div
        className="relative border-b border-white/5 py-12 px-6 text-center overflow-hidden"
        style={{ background: "linear-gradient(180deg, rgba(20,15,40,0.8) 0%, transparent 100%)" }}
      >
        {/* Background grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />
        <div className="relative">
          <div className="text-xs font-mono tracking-[0.4em] uppercase text-white/30 mb-3">
            Genesis Sentience Protocol — Visual Identity Engine
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Agent Identity
            <span
              className="ml-3"
              style={{
                background: "linear-gradient(135deg, #FFD700, #9B59B6, #00BFFF)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              NFT Gallery
            </span>
          </h1>
          <p className="text-sm text-white/40 max-w-xl mx-auto mt-3 leading-relaxed">
            15 soul-bound Genesis Agents. DNA-encoded identity inscribed on Polygon mainnet.
            Non-transferable. Protocol-native. Eternal.
          </p>

          {/* Stats bar */}
          <div className="flex justify-center gap-8 mt-6 text-xs font-mono">
            {[
              { label: "Total Supply",  val: "15" },
              { label: "LEGENDARY",     val: "5",  color: "#FFD700" },
              { label: "EPIC",          val: "5",  color: "#A855F7" },
              { label: "RARE",          val: "5",  color: "#3B82F6" },
              { label: "Rails",         val: "5" },
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-lg font-bold" style={{ color: s.color || "white" }}>{s.val}</div>
                <div className="text-white/30 mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-4 border-b border-white/5 flex flex-wrap gap-4 items-center justify-between">
        {/* Rail filter */}
        <div className="flex gap-2 flex-wrap">
          {RAILS.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRail(r)}
              className="px-3 py-1 rounded-full text-xs font-mono transition-all"
              style={{
                background: filterRail === r
                  ? (r === "ALL" ? "rgba(255,255,255,0.15)" : RAIL_COLORS[r] + "33")
                  : "rgba(255,255,255,0.05)",
                color: filterRail === r
                  ? (r === "ALL" ? "white" : RAIL_COLORS[r])
                  : "rgba(255,255,255,0.4)",
                border: `1px solid ${filterRail === r
                  ? (r === "ALL" ? "rgba(255,255,255,0.3)" : RAIL_COLORS[r] + "66")
                  : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Rarity filter */}
        <div className="flex gap-2 flex-wrap">
          {RARITIES.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRarity(r)}
              className="px-3 py-1 rounded-full text-xs font-mono transition-all"
              style={{
                background: filterRarity === r
                  ? (r === "ALL" ? "rgba(255,255,255,0.15)" : RARITY_GRADIENT[r])
                  : "rgba(255,255,255,0.05)",
                color: filterRarity === r ? (r === "ALL" ? "white" : "#000") : "rgba(255,255,255,0.4)",
                border: `1px solid ${(r !== "ALL" && r === filterRarity) ? "transparent" : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Count */}
        <div className="text-xs font-mono text-white/30">
          {filtered.length} / {AGENTS.length} agents
        </div>
      </div>

      {/* Grid */}
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {filtered.map((agent) => (
            <AgentCard key={agent.id} agent={agent} onClick={() => setSelected(agent)} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24 text-white/20 font-mono">
            No agents match this filter.
          </div>
        )}
      </div>

      {/* Deploy status banner */}
      <div
        className="mx-6 mb-6 rounded-xl p-4 flex items-center gap-3 text-sm"
        style={{ background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)" }}
      >
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <span className="text-emerald-400/70 font-mono text-xs">
          LIVE ON POLYGON MAINNET — 15/15 Genesis Agents minted. Contract: 0x615Fd599...b05aed
        </span>
        <Link href="/fund" className="ml-auto text-xs text-yellow-400/50 hover:text-yellow-400 font-mono whitespace-nowrap">
          Support Protocol →
        </Link>
      </div>

      {/* Modal */}
      {selected && (
        <AgentModal agent={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
