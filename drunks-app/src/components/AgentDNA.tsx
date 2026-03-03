"use client";

import { AgentIdentity, RARITY_COLORS } from "@/lib/agent-dna";

// ═══════════════════════════════════════════════
// DNA HELIX — Animated visual fingerprint
// Every agent's helix is unique, derived from
// their GeneticVector. No two look the same.
// ═══════════════════════════════════════════════

export function DNAHelix({ agent, size = 80 }: { agent: AgentIdentity; size?: number }) {
  const { dna, signature } = agent;
  const strands = 12;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full">
        <defs>
          <radialGradient id={`glow-${agent.id}`}>
            <stop offset="0%" stopColor={signature.primaryColor} stopOpacity={signature.auraIntensity} />
            <stop offset="100%" stopColor={signature.primaryColor} stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`strand-${agent.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={signature.primaryColor} />
            <stop offset="100%" stopColor={signature.secondaryColor} />
          </linearGradient>
        </defs>

        {/* Aura */}
        <circle cx="50" cy="50" r="48" fill={`url(#glow-${agent.id})`} />

        {/* DNA Strands */}
        {Array.from({ length: strands }).map((_, i) => {
          const angle = (i / strands) * Math.PI * 2;
          const wobble = dna.entropyAffinity * 8;
          const x1 = 50 + Math.cos(angle) * (20 + dna.optimizationBias * 10);
          const y1 = 50 + Math.sin(angle) * (20 + dna.riskTolerance * 10);
          const x2 = 50 + Math.cos(angle + Math.PI) * (15 + dna.cooperationWeight * 12);
          const y2 = 50 + Math.sin(angle + Math.PI) * (15 + dna.autonomyLevel * 12);

          return (
            <g key={i}>
              <line
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={i % 2 === 0 ? signature.primaryColor : signature.secondaryColor}
                strokeWidth={0.8 + dna.riskTolerance * 0.5}
                opacity={0.4 + (i / strands) * 0.4}
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 50 50`}
                  to={`${dna.entropyAffinity > 0.3 ? 360 : -360} 50 50`}
                  dur={`${8 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </line>
              {/* Connection nodes */}
              <circle cx={x1} cy={y1} r={1 + dna.optimizationBias * 1.5} fill={signature.primaryColor} opacity="0.6">
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from={`0 50 50`}
                  to={`${dna.entropyAffinity > 0.3 ? 360 : -360} 50 50`}
                  dur={`${8 + i * 0.5}s`}
                  repeatCount="indefinite"
                />
              </circle>
            </g>
          );
        })}

        {/* Center symbol */}
        <circle cx="50" cy="50" r={6 + dna.autonomyLevel * 4} fill="none" stroke={signature.primaryColor} strokeWidth="1.5" opacity="0.8">
          <animate attributeName="r" values={`${6 + dna.autonomyLevel * 4};${8 + dna.autonomyLevel * 4};${6 + dna.autonomyLevel * 4}`} dur="3s" repeatCount="indefinite" />
        </circle>
        <text x="50" y="54" textAnchor="middle" fontSize="14" fill={signature.primaryColor}>
          {agent.personality.emoji}
        </text>
      </svg>
    </div>
  );
}

// ═══════════════════════════════════════════════
// AGENT AVATAR — Glowing identity badge
// ═══════════════════════════════════════════════

export function AgentAvatar({ agent, size = 48, showLevel = false }: {
  agent: AgentIdentity;
  size?: number;
  showLevel?: boolean;
}) {
  return (
    <div className="relative inline-flex" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full flex items-center justify-center text-lg font-bold animate-pulse-glow"
        style={{
          background: `${agent.railColor}15`,
          color: agent.railColor,
          border: `2px solid ${agent.railColor}40`,
          boxShadow: `0 0 ${12 + agent.signature.auraIntensity * 20}px ${agent.railColor}${Math.round(agent.signature.auraIntensity * 40).toString(16).padStart(2, "0")}`,
          fontSize: size * 0.35,
        }}
      >
        {agent.personality.emoji}
      </div>
      {showLevel && (
        <div
          className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[0.5rem] font-mono font-bold"
          style={{
            background: agent.railColor,
            color: "#0B0F1A",
            boxShadow: `0 0 8px ${agent.railColor}60`,
          }}
        >
          {agent.evolution.level}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════
// BADGE DISPLAY — Collectible achievement badges
// ═══════════════════════════════════════════════

export function BadgeGrid({ agent }: { agent: AgentIdentity }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {agent.evolution.badges.map((badge) => (
        <div
          key={badge.id}
          className="group relative px-2 py-1 rounded-md text-[0.55rem] font-mono cursor-help"
          style={{
            background: `${RARITY_COLORS[badge.rarity]}10`,
            border: `1px solid ${RARITY_COLORS[badge.rarity]}30`,
            color: RARITY_COLORS[badge.rarity],
          }}
        >
          <span className="mr-1">{badge.icon}</span>
          {badge.name}
          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 rounded-lg bg-[#0B0F1A] border border-[var(--border-subtle)] text-[0.6rem] text-[var(--text-secondary)] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
            <div className="font-bold mb-0.5" style={{ color: RARITY_COLORS[badge.rarity] }}>
              {badge.rarity.toUpperCase()}
            </div>
            {badge.description}
            <div className="text-[var(--text-muted)] mt-0.5">Earned: Epoch {badge.earnedEpoch}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════
// XP BAR — Leveling progress
// ═══════════════════════════════════════════════

export function XPBar({ agent }: { agent: AgentIdentity }) {
  const progress = (agent.evolution.xp / agent.evolution.xpToNext) * 100;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">
          LVL {agent.evolution.level}
        </span>
        <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">
          {agent.evolution.xp} / {agent.evolution.xpToNext} XP
        </span>
      </div>
      <div className="h-2 rounded-full bg-[var(--border-subtle)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{
            width: `${Math.min(progress, 100)}%`,
            background: `linear-gradient(90deg, ${agent.railColor}, ${agent.signature.secondaryColor})`,
            boxShadow: `0 0 8px ${agent.railColor}40`,
          }}
        />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
// GENETIC VECTOR RADAR — 5-axis DNA chart
// ═══════════════════════════════════════════════

export function GeneticRadar({ agent, size = 160 }: { agent: AgentIdentity; size?: number }) {
  const dims = [
    { key: "optimizationBias", label: "OPT", value: agent.dna.optimizationBias },
    { key: "riskTolerance", label: "RISK", value: agent.dna.riskTolerance },
    { key: "cooperationWeight", label: "COOP", value: agent.dna.cooperationWeight },
    { key: "entropyAffinity", label: "ENT", value: agent.dna.entropyAffinity },
    { key: "autonomyLevel", label: "AUTO", value: agent.dna.autonomyLevel },
  ];
  const center = size / 2;
  const maxR = size * 0.38;

  const points = dims.map((d, i) => {
    const angle = (i / dims.length) * Math.PI * 2 - Math.PI / 2;
    const r = d.value * maxR;
    return {
      ...d, angle,
      x: center + Math.cos(angle) * r,
      y: center + Math.sin(angle) * r,
      labelX: center + Math.cos(angle) * (maxR + 16),
      labelY: center + Math.sin(angle) * (maxR + 16),
    };
  });

  const polygonPoints = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: size, height: size }}>
      {/* Grid rings */}
      {[0.25, 0.5, 0.75, 1].map((scale) => (
        <polygon
          key={scale}
          points={dims.map((_, i) => {
            const angle = (i / dims.length) * Math.PI * 2 - Math.PI / 2;
            const r = scale * maxR;
            return `${center + Math.cos(angle) * r},${center + Math.sin(angle) * r}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />
      ))}

      {/* Axis lines */}
      {points.map((p) => (
        <line key={p.key} x1={center} y1={center}
          x2={center + Math.cos(p.angle) * maxR}
          y2={center + Math.sin(p.angle) * maxR}
          stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
      ))}

      {/* Fill polygon */}
      <polygon points={polygonPoints} fill={`${agent.railColor}20`} stroke={agent.railColor} strokeWidth="1.5" />

      {/* Data points */}
      {points.map((p) => (
        <circle key={p.key} cx={p.x} cy={p.y} r="3" fill={agent.railColor}>
          <animate attributeName="r" values="3;4;3" dur="2s" repeatCount="indefinite" />
        </circle>
      ))}

      {/* Labels */}
      {points.map((p) => (
        <text key={p.key} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle"
          fontSize="8" fill="#8892A4" fontFamily="monospace">
          {p.label}
        </text>
      ))}
    </svg>
  );
}
