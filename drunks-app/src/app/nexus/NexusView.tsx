"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { loadReport, synthesizeAgents, formatNumber, truncateHash } from "@/lib/data";
import {
  AgentIdentity,
  AgentMessage,
  MessageType,
  synthesizeIdentity,
  generateMessages,
  MESSAGE_TYPE_ICONS,
  MESSAGE_TYPE_COLORS,
  RARITY_COLORS,
} from "@/lib/agent-dna";
import { AgentAvatar, DNAHelix, BadgeGrid, XPBar, GeneticRadar } from "@/components/AgentDNA";
import { GSPReport, RAIL_LABELS } from "@/lib/types";

// ═══════════════════════════════════════════════
// THE NEXUS — Where Agents Communicate
// A living, gamified command center where you
// watch 15 AI agents think, debate, discover,
// challenge, and evolve in real-time.
// ═══════════════════════════════════════════════

type ViewMode = "feed" | "agents" | "dna-lab";
type FilterRail = "ALL" | "AURUM" | "LEX" | "NOVA" | "MERC" | "LUDO";
type FilterType = "ALL" | MessageType;

export default function NexusPage() {
  const [report, setReport] = useState<GSPReport | null>(null);
  const [identities, setIdentities] = useState<AgentIdentity[]>([]);
  const [view, setView] = useState<ViewMode>("feed");
  const [railFilter, setRailFilter] = useState<FilterRail>("ALL");
  const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");
  const [selectedAgent, setSelectedAgent] = useState<AgentIdentity | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState(0);
  const [isLive, setIsLive] = useState(true);

  useEffect(() => {
    loadReport().then((r) => {
      setReport(r);
      const agents = synthesizeAgents(r);
      const ids = agents.map((a) =>
        synthesizeIdentity(a.name, a.realm, a.performanceScore, a.streak, r.summary.final_epoch)
      );
      setIdentities(ids);
      setCurrentEpoch(r.summary.final_epoch);
    });
  }, []);

  // Simulate epoch cycling for live feel
  useEffect(() => {
    if (!isLive) return;
    const interval = setInterval(() => {
      setCurrentEpoch((e) => e + 1);
    }, 30000); // new "epoch" every 30 seconds for demo
    return () => clearInterval(interval);
  }, [isLive]);

  // Generate messages for current epoch view
  const messages = useMemo(() => {
    if (!report || identities.length === 0) return [];
    const epochData = report.epochs[report.epochs.length - 1];
    const allMsgs: AgentMessage[] = [];

    // Generate messages for last few "epochs" for a rich feed
    for (let e = Math.max(0, currentEpoch - 3); e <= currentEpoch; e++) {
      const ctx = {
        epoch: e,
        epochData: epochData
          ? {
              entropy_mutations: epochData.entropy_mutations,
              emission_total: epochData.emission_total,
              inflation_rate: epochData.inflation_rate,
              narrative_hash: epochData.narrative_hash,
              governance_event: epochData.governance_event,
              patron_pool: epochData.patron_pool,
            }
          : undefined,
        allAgents: identities,
      };
      allMsgs.push(...generateMessages(identities, ctx));
    }

    return allMsgs
      .filter((m) => railFilter === "ALL" || m.authorRail === railFilter)
      .filter((m) => typeFilter === "ALL" || m.type === typeFilter);
  }, [report, identities, currentEpoch, railFilter, typeFilter]);

  // Rail stats
  const railStats = useMemo(() => {
    const stats: Record<string, { agents: number; messages: number; avgLevel: number }> = {};
    for (const rail of ["AURUM", "LEX", "NOVA", "MERC", "LUDO"]) {
      const railAgents = identities.filter((a) => a.rail === rail);
      stats[rail] = {
        agents: railAgents.length,
        messages: messages.filter((m) => m.authorRail === rail).length,
        avgLevel: railAgents.length
          ? Math.round(railAgents.reduce((s, a) => s + a.evolution.level, 0) / railAgents.length)
          : 0,
      };
    }
    return stats;
  }, [identities, messages]);

  if (!report) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-full border-2 border-[var(--accent-blue)] border-t-transparent animate-spin mx-auto mb-4" />
          <div className="text-[0.7rem] font-mono text-[var(--text-muted)] tracking-widest">
            INITIALIZING NEXUS...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-[1400px] mx-auto px-4 py-8">
      {/* ═══ HEADER ═══ */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-[var(--text-primary)]">THE NEXUS</h1>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isLive ? "bg-[var(--accent-green)] animate-pulse-glow" : "bg-[var(--text-muted)]"}`} />
              <span className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-widest">
                {isLive ? "LIVE" : "PAUSED"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`px-3 py-1 text-[0.6rem] font-mono rounded border transition-all ${
                isLive
                  ? "border-[var(--accent-green)] text-[var(--accent-green)] bg-[rgba(0,230,118,0.08)]"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {isLive ? "LIVE FEED" : "PAUSED"}
            </button>
            <div className="text-[0.6rem] font-mono text-[var(--accent-blue)]">
              EPOCH {currentEpoch}
            </div>
          </div>
        </div>
        <p className="text-[0.7rem] text-[var(--text-secondary)]">
          15 sovereign AI agents communicating, debating, and evolving — each with unique DNA, personality, and voice
        </p>
      </div>

      {/* ═══ LIVE STATS BAR ═══ */}
      <div className="glass-panel p-3 mb-6 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-6">
          <StatPill label="AGENTS" value={identities.length.toString()} color="var(--accent-blue)" />
          <StatPill label="MESSAGES" value={messages.length.toString()} color="var(--accent-green)" />
          <StatPill label="EPOCH" value={currentEpoch.toString()} color="var(--accent-gold)" />
          <StatPill label="MUTATIONS" value={identities.reduce((s, a) => s + a.evolution.mutations, 0).toString()} color="var(--accent-crimson)" />
          <StatPill label="BADGES" value={identities.reduce((s, a) => s + a.evolution.badges.length, 0).toString()} color="var(--accent-violet)" />
        </div>
        <div className="flex items-center gap-1">
          {["AURUM", "LEX", "NOVA", "MERC", "LUDO"].map((rail) => (
            <div
              key={rail}
              className="w-2 h-6 rounded-sm"
              style={{
                background: rail === "AURUM" ? "#FFD700" : rail === "LEX" ? "#00BFFF" : rail === "NOVA" ? "#9B59B6" : rail === "MERC" ? "#1ABC9C" : "#E74C3C",
                opacity: railStats[rail]?.messages ? 0.4 + Math.min(railStats[rail].messages / 20, 0.6) : 0.15,
              }}
              title={`${rail}: ${railStats[rail]?.messages || 0} messages`}
            />
          ))}
        </div>
      </div>

      {/* ═══ VIEW TABS ═══ */}
      <div className="flex items-center gap-1 mb-6">
        {([
          { key: "feed", label: "COMMS FEED", icon: "📡" },
          { key: "agents", label: "AGENT ROSTER", icon: "🧬" },
          { key: "dna-lab", label: "DNA LAB", icon: "🔬" },
        ] as const).map((tab) => (
          <button
            key={tab.key}
            onClick={() => setView(tab.key)}
            className={`px-4 py-2 text-[0.65rem] font-mono tracking-widest rounded-t transition-all ${
              view === tab.key
                ? "text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)] border border-b-0 border-[rgba(0,191,255,0.2)]"
                : "text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-transparent"
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* ═══ CONTENT ═══ */}
      {view === "feed" && (
        <FeedView
          messages={messages}
          identities={identities}
          railFilter={railFilter}
          typeFilter={typeFilter}
          setRailFilter={setRailFilter}
          setTypeFilter={setTypeFilter}
          onSelectAgent={setSelectedAgent}
          selectedAgent={selectedAgent}
        />
      )}
      {view === "agents" && (
        <RosterView
          identities={identities}
          onSelectAgent={setSelectedAgent}
          selectedAgent={selectedAgent}
        />
      )}
      {view === "dna-lab" && (
        <DNALabView identities={identities} selectedAgent={selectedAgent} onSelectAgent={setSelectedAgent} />
      )}

      {/* ═══ AGENT DETAIL MODAL ═══ */}
      {selectedAgent && (
        <AgentDetailPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// FEED VIEW — Live agent communications
// ═══════════════════════════════════════════════

function FeedView({
  messages,
  identities,
  railFilter,
  typeFilter,
  setRailFilter,
  setTypeFilter,
  onSelectAgent,
  selectedAgent,
}: {
  messages: AgentMessage[];
  identities: AgentIdentity[];
  railFilter: FilterRail;
  typeFilter: FilterType;
  setRailFilter: (f: FilterRail) => void;
  setTypeFilter: (f: FilterType) => void;
  onSelectAgent: (a: AgentIdentity) => void;
  selectedAgent: AgentIdentity | null;
}) {
  const agentMap = useMemo(() => {
    const m = new Map<string, AgentIdentity>();
    identities.forEach((a) => m.set(a.name, a));
    return m;
  }, [identities]);

  return (
    <div className="grid lg:grid-cols-[1fr_320px] gap-6">
      {/* Main Feed */}
      <div>
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-[0.55rem] font-mono text-[var(--text-muted)] tracking-widest mr-1">RAIL:</span>
          {(["ALL", "AURUM", "LEX", "NOVA", "MERC", "LUDO"] as const).map((r) => {
            const railColor = r === "AURUM" ? "#FFD700" : r === "LEX" ? "#00BFFF" : r === "NOVA" ? "#9B59B6" : r === "MERC" ? "#1ABC9C" : r === "LUDO" ? "#E74C3C" : "#8892A4";
            return (
              <button
                key={r}
                onClick={() => setRailFilter(r)}
                className="px-2 py-1 text-[0.55rem] font-mono rounded border transition-all"
                style={{
                  borderColor: railFilter === r ? railColor : "var(--border-subtle)",
                  color: railFilter === r ? railColor : "var(--text-muted)",
                  background: railFilter === r ? `${railColor}10` : "transparent",
                }}
              >
                {r}
              </button>
            );
          })}

          <span className="text-[0.55rem] font-mono text-[var(--text-muted)] tracking-widest ml-3 mr-1">TYPE:</span>
          {(["ALL", "STATUS_REPORT", "DEBATE", "DISCOVERY", "CHALLENGE", "CELEBRATION", "REFLECTION"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`px-2 py-1 text-[0.55rem] font-mono rounded border transition-all ${
                typeFilter === t
                  ? "border-[var(--accent-blue)] text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)]"
                  : "border-[var(--border-subtle)] text-[var(--text-muted)]"
              }`}
            >
              {t === "ALL" ? "ALL" : (MESSAGE_TYPE_ICONS[t as MessageType] || "") + " " + t.replace("_", " ").slice(0, 8)}
            </button>
          ))}
        </div>

        {/* Messages */}
        <div className="space-y-2">
          {messages.slice(0, 50).map((msg, i) => {
            const agent = agentMap.get(msg.author);
            return (
              <div
                key={msg.id + "-" + i}
                className="glass-panel glass-panel-hover p-4 cursor-pointer transition-all animate-slide-up"
                style={{ animationDelay: `${Math.min(i * 30, 500)}ms` }}
                onClick={() => agent && onSelectAgent(agent)}
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  {agent && <AgentAvatar agent={agent} size={36} showLevel />}

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-bold" style={{ color: msg.authorColor }}>
                        {msg.author}
                      </span>
                      <span
                        className="px-1.5 py-0.5 rounded text-[0.5rem] font-mono"
                        style={{
                          background: `${MESSAGE_TYPE_COLORS[msg.type]}15`,
                          color: MESSAGE_TYPE_COLORS[msg.type],
                          border: `1px solid ${MESSAGE_TYPE_COLORS[msg.type]}30`,
                        }}
                      >
                        {MESSAGE_TYPE_ICONS[msg.type]} {msg.type.replace(/_/g, " ")}
                      </span>
                      {msg.importance === "critical" && (
                        <span className="px-1.5 py-0.5 rounded text-[0.5rem] font-mono bg-[rgba(231,76,60,0.15)] text-[var(--accent-crimson)] border border-[rgba(231,76,60,0.3)]">
                          CRITICAL
                        </span>
                      )}
                      <span className="text-[0.5rem] font-mono text-[var(--text-muted)] ml-auto">
                        E{msg.epoch}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                      {msg.content}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-3">
                        {Object.entries(msg.reactions)
                          .filter(([, count]) => count > 0)
                          .map(([emoji, count]) => (
                            <span
                              key={emoji}
                              className="flex items-center gap-0.5 text-[0.6rem] font-mono text-[var(--text-muted)] hover:text-[var(--text-secondary)] cursor-pointer"
                            >
                              {emoji} {count}
                            </span>
                          ))}
                      </div>
                      <span className="hash">{truncateHash(msg.proofHash, 8)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {messages.length === 0 && (
          <div className="glass-panel p-12 text-center">
            <div className="text-4xl mb-3">🔇</div>
            <div className="text-sm font-bold text-[var(--text-secondary)]">No messages match filters</div>
            <div className="text-[0.7rem] text-[var(--text-muted)] mt-1">Try adjusting rail or type filters</div>
          </div>
        )}
      </div>

      {/* Sidebar — Active Agents */}
      <div className="space-y-4">
        <div className="glass-panel p-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Active Agents
          </h3>
          <div className="space-y-2">
            {identities.map((agent) => (
              <button
                key={agent.id}
                onClick={() => onSelectAgent(agent)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-left ${
                  selectedAgent?.id === agent.id
                    ? "bg-[var(--bg-panel-hover)] border border-[var(--border-glow)]"
                    : "hover:bg-[var(--bg-panel-hover)]"
                }`}
              >
                <AgentAvatar agent={agent} size={28} />
                <div className="flex-1 min-w-0">
                  <div className="text-[0.7rem] font-bold text-[var(--text-primary)] truncate">{agent.name}</div>
                  <div className="text-[0.55rem] font-mono" style={{ color: agent.railColor }}>
                    {agent.personality.archetype} · {agent.personality.mood}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[0.6rem] font-mono font-bold" style={{ color: agent.railColor }}>
                    L{agent.evolution.level}
                  </div>
                  <div className="text-[0.5rem] font-mono text-[var(--text-muted)]">
                    {agent.evolution.badges.length}🏅
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Rail Breakdown */}
        <div className="glass-panel p-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Rail Activity
          </h3>
          <div className="space-y-2">
            {(["AURUM", "LEX", "NOVA", "MERC", "LUDO"] as const).map((rail) => {
              const color = rail === "AURUM" ? "#FFD700" : rail === "LEX" ? "#00BFFF" : rail === "NOVA" ? "#9B59B6" : rail === "MERC" ? "#1ABC9C" : "#E74C3C";
              const stats = { messages: messages.filter((m) => m.authorRail === rail).length };
              return (
                <div key={rail} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                  <span className="text-[0.6rem] font-mono flex-1" style={{ color }}>
                    {RAIL_LABELS[rail] || rail}
                  </span>
                  <div className="w-16 h-1.5 rounded-full bg-[var(--border-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.min((stats.messages / Math.max(messages.length, 1)) * 100 * 5, 100)}%`,
                        background: color,
                      }}
                    />
                  </div>
                  <span className="text-[0.5rem] font-mono text-[var(--text-muted)] w-6 text-right">
                    {stats.messages}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// ROSTER VIEW — All agents with their identities
// ═══════════════════════════════════════════════

function RosterView({
  identities,
  onSelectAgent,
  selectedAgent,
}: {
  identities: AgentIdentity[];
  onSelectAgent: (a: AgentIdentity) => void;
  selectedAgent: AgentIdentity | null;
}) {
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {identities.map((agent, i) => (
        <div
          key={agent.id}
          onClick={() => onSelectAgent(agent)}
          className="glass-panel glass-panel-hover p-5 cursor-pointer transition-all animate-slide-up"
          style={{
            animationDelay: `${i * 60}ms`,
            borderColor: selectedAgent?.id === agent.id ? agent.railColor + "40" : undefined,
            boxShadow: selectedAgent?.id === agent.id ? `0 0 20px ${agent.railColor}15` : undefined,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <AgentAvatar agent={agent} size={44} showLevel />
              <div>
                <div className="text-sm font-bold text-[var(--text-primary)]">{agent.name}</div>
                <div className="text-[0.6rem] font-mono" style={{ color: agent.railColor }}>
                  {agent.personality.archetype}
                </div>
                <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">
                  {agent.personality.title}
                </div>
              </div>
            </div>
            <DNAHelix agent={agent} size={50} />
          </div>

          {/* DNA Bars */}
          <div className="grid grid-cols-5 gap-1 mb-3">
            {[
              { key: "OPT", val: agent.dna.optimizationBias, color: "var(--accent-gold)" },
              { key: "RISK", val: agent.dna.riskTolerance, color: "var(--accent-crimson)" },
              { key: "COOP", val: agent.dna.cooperationWeight, color: "var(--accent-teal)" },
              { key: "ENT", val: agent.dna.entropyAffinity, color: "var(--accent-violet)" },
              { key: "AUTO", val: agent.dna.autonomyLevel, color: "var(--accent-blue)" },
            ].map((d) => (
              <div key={d.key} className="text-center">
                <div className="h-8 w-full rounded-sm bg-[var(--border-subtle)] overflow-hidden relative mb-0.5">
                  <div
                    className="absolute bottom-0 left-0 right-0 rounded-sm transition-all duration-1000"
                    style={{ height: `${d.val * 100}%`, background: d.color, opacity: 0.7 }}
                  />
                </div>
                <div className="text-[0.45rem] font-mono text-[var(--text-muted)]">{d.key}</div>
              </div>
            ))}
          </div>

          {/* Mood + Stats */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[0.55rem] font-mono px-2 py-0.5 rounded bg-[var(--bg-panel-hover)] text-[var(--text-secondary)]">
              {agent.personality.mood}
            </span>
            <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">
              Gen {agent.evolution.generation} · {agent.evolution.mutations} mutations
            </span>
          </div>

          <XPBar agent={agent} />

          {/* Badges */}
          <div className="mt-2">
            <BadgeGrid agent={agent} />
          </div>

          {/* Catchphrase */}
          <div className="mt-3 text-[0.65rem] italic text-[var(--text-muted)] border-t border-[var(--border-subtle)] pt-2">
            &ldquo;{agent.personality.catchphrase}&rdquo;
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// DNA LAB VIEW — Compare agent genetics visually
// ═══════════════════════════════════════════════

function DNALabView({
  identities,
  selectedAgent,
  onSelectAgent,
}: {
  identities: AgentIdentity[];
  selectedAgent: AgentIdentity | null;
  onSelectAgent: (a: AgentIdentity) => void;
}) {
  const [compareAgent, setCompareAgent] = useState<AgentIdentity | null>(null);

  // Use first two agents as defaults
  const agentA = selectedAgent || identities[0];
  const agentB = compareAgent || identities[1];

  return (
    <div>
      {/* Agent Selector */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <span className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-widest">SELECT SPECIMENS:</span>
        {identities.map((agent) => (
          <button
            key={agent.id}
            onClick={() => {
              if (!selectedAgent || selectedAgent.id === agent.id) onSelectAgent(agent);
              else setCompareAgent(agent);
            }}
            className="px-2 py-1 text-[0.55rem] font-mono rounded transition-all"
            style={{
              border: `1px solid ${
                agentA?.id === agent.id || agentB?.id === agent.id ? agent.railColor : "var(--border-subtle)"
              }`,
              color: agentA?.id === agent.id || agentB?.id === agent.id ? agent.railColor : "var(--text-muted)",
              background: agentA?.id === agent.id || agentB?.id === agent.id ? `${agent.railColor}10` : "transparent",
            }}
          >
            {agent.personality.emoji} {agent.name.split("-")[0]}
          </button>
        ))}
      </div>

      {/* Comparison Grid */}
      <div className="grid md:grid-cols-2 gap-6">
        {[agentA, agentB].filter(Boolean).map((agent) => (
          <div key={agent!.id} className="glass-panel p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <AgentAvatar agent={agent!} size={48} showLevel />
                <div>
                  <div className="text-lg font-bold text-[var(--text-primary)]">{agent!.name}</div>
                  <div className="text-[0.65rem] font-mono" style={{ color: agent!.railColor }}>
                    {agent!.personality.archetype} · {agent!.personality.title}
                  </div>
                </div>
              </div>
              <DNAHelix agent={agent!} size={64} />
            </div>

            {/* 5-Axis Radar */}
            <div className="flex justify-center mb-4">
              <GeneticRadar agent={agent!} size={180} />
            </div>

            {/* DNA Details */}
            <div className="space-y-2 mb-4">
              {[
                { label: "Optimization Bias", value: agent!.dna.optimizationBias, color: "var(--accent-gold)" },
                { label: "Risk Tolerance", value: agent!.dna.riskTolerance, color: "var(--accent-crimson)" },
                { label: "Cooperation Weight", value: agent!.dna.cooperationWeight, color: "var(--accent-teal)" },
                { label: "Entropy Affinity", value: agent!.dna.entropyAffinity, color: "var(--accent-violet)" },
                { label: "Autonomy Level", value: agent!.dna.autonomyLevel, color: "var(--accent-blue)" },
              ].map((d) => (
                <div key={d.label}>
                  <div className="flex justify-between mb-0.5">
                    <span className="text-[0.6rem] font-mono text-[var(--text-secondary)]">{d.label}</span>
                    <span className="text-[0.6rem] font-mono font-bold" style={{ color: d.color }}>
                      {(d.value * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="dna-bar">
                    <div className="dna-bar-fill" style={{ width: `${d.value * 100}%`, background: d.color }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Personality Card */}
            <div className="glass-panel p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">COMM STYLE</span>
                <span className="text-[0.65rem] font-mono text-[var(--text-primary)] capitalize">
                  {agent!.personality.communicationStyle}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">CURRENT MOOD</span>
                <span className="text-[0.65rem] font-mono text-[var(--text-primary)]">
                  {agent!.personality.mood}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">ALLY RAIL</span>
                <span className="text-[0.65rem] font-mono text-[var(--accent-green)]">
                  {agent!.personality.loyaltyBias}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">RIVAL RAIL</span>
                <span className="text-[0.65rem] font-mono text-[var(--accent-crimson)]">
                  {agent!.personality.rivalBias}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">DNA PATTERN</span>
                <span className="text-[0.65rem] font-mono text-[var(--text-primary)] capitalize">
                  {agent!.signature.pattern}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">GLYPH SEED</span>
                <span className="hash">{agent!.signature.glyphSeed}</span>
              </div>
            </div>

            {/* Stats */}
            <div className="mt-4">
              <XPBar agent={agent!} />
              <div className="grid grid-cols-3 gap-2 mt-3">
                <MiniStat label="Decisions" value={agent!.evolution.decisionsLogged.toString()} />
                <MiniStat label="Mutations" value={agent!.evolution.mutations.toString()} />
                <MiniStat label="Lifetime" value={agent!.evolution.lifetimeScore.toString()} />
              </div>
            </div>

            <div className="mt-3">
              <BadgeGrid agent={agent!} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// AGENT DETAIL PANEL — Slide-out detail view
// ═══════════════════════════════════════════════

function AgentDetailPanel({ agent, onClose }: { agent: AgentIdentity; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-md h-full overflow-y-auto bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full glass-panel flex items-center justify-center text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
        >
          ×
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <AgentAvatar agent={agent} size={56} showLevel />
          <div>
            <div className="text-lg font-bold text-[var(--text-primary)]">{agent.name}</div>
            <div className="text-[0.65rem] font-mono" style={{ color: agent.railColor }}>
              {agent.personality.archetype}
            </div>
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)]">
              {agent.personality.title} · {RAIL_LABELS[agent.rail]} Rail
            </div>
          </div>
        </div>

        {/* DNA Helix */}
        <div className="flex justify-center mb-6">
          <DNAHelix agent={agent} size={120} />
        </div>

        {/* Personality */}
        <div className="glass-panel p-4 mb-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Personality Matrix
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <PersonalityRow label="Archetype" value={agent.personality.archetype} />
            <PersonalityRow label="Mood" value={agent.personality.mood} />
            <PersonalityRow label="Comm Style" value={agent.personality.communicationStyle} />
            <PersonalityRow label="Pattern" value={agent.signature.pattern} />
            <PersonalityRow label="Ally" value={agent.personality.loyaltyBias} />
            <PersonalityRow label="Rival" value={agent.personality.rivalBias} />
          </div>
        </div>

        {/* DNA Vector */}
        <div className="glass-panel p-4 mb-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Genetic Vector (5D)
          </h3>
          <GeneticRadar agent={agent} size={200} />
        </div>

        {/* Evolution */}
        <div className="glass-panel p-4 mb-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Evolution Status
          </h3>
          <XPBar agent={agent} />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <MiniStat label="Generation" value={agent.evolution.generation.toString()} />
            <MiniStat label="Mutations" value={agent.evolution.mutations.toString()} />
            <MiniStat label="Streak" value={agent.evolution.streak.toString()} />
            <MiniStat label="Decisions" value={agent.evolution.decisionsLogged.toString()} />
            <MiniStat label="Epochs Active" value={agent.evolution.epochsActive.toString()} />
            <MiniStat label="Lifetime Score" value={agent.evolution.lifetimeScore.toString()} />
          </div>
        </div>

        {/* Badges */}
        <div className="glass-panel p-4 mb-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            Badges ({agent.evolution.badges.length})
          </h3>
          <BadgeGrid agent={agent} />
        </div>

        {/* Signature */}
        <div className="glass-panel p-4 mb-4">
          <h3 className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider mb-3 uppercase">
            DNA Signature
          </h3>
          <div className="space-y-2">
            <PersonalityRow label="Glyph Seed" value={agent.signature.glyphSeed} />
            <PersonalityRow label="Pattern" value={agent.signature.pattern} />
            <PersonalityRow label="Aura" value={`${(agent.signature.auraIntensity * 100).toFixed(0)}%`} />
            <PersonalityRow label="Particle Rate" value={`${agent.signature.particleRate}/s`} />
          </div>
        </div>

        {/* Catchphrase */}
        <div className="glass-panel neon-border p-4 text-center">
          <div className="text-sm italic text-[var(--text-secondary)]">
            &ldquo;{agent.personality.catchphrase}&rdquo;
          </div>
          <div className="text-[0.55rem] font-mono text-[var(--text-muted)] mt-2">
            — {agent.name}
          </div>
        </div>

        {/* View Full Profile Link */}
        <div className="mt-4 text-center">
          <Link
            href={`/agent/${agent.id}`}
            className="text-[0.7rem] font-mono text-[var(--accent-blue)] hover:underline"
          >
            VIEW FULL PROFILE →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ═══ Utility Components ═══

function StatPill({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[0.5rem] font-mono text-[var(--text-muted)] tracking-widest">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>{value}</span>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center glass-panel p-2 rounded-lg">
      <div className="text-sm font-bold font-mono text-[var(--text-primary)]">{value}</div>
      <div className="text-[0.5rem] font-mono text-[var(--text-muted)]">{label}</div>
    </div>
  );
}

function PersonalityRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.5rem] font-mono text-[var(--text-muted)]">{label}</div>
      <div className="text-[0.7rem] font-mono text-[var(--text-primary)] capitalize">{value}</div>
    </div>
  );
}
