"use client";

import Link from "next/link";
import { AgentCard as AgentCardType, RAIL_LABELS } from "@/lib/types";
import { formatNumber } from "@/lib/data";

export default function AgentCard({ agent }: { agent: AgentCardType }) {
  return (
    <Link href={`/agent/${agent.id}`}>
      <div
        className={`glass-panel glass-panel-hover rail-glow-${agent.rail} p-5 cursor-pointer transition-all duration-300 group`}
      >
        {/* Header: Rank + Name */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[0.6rem] font-mono text-[var(--text-muted)]">
                #{agent.rank}
              </span>
              {agent.streak >= 3 && (
                <span className="text-[0.6rem]" title={`${agent.streak} epoch streak`}>
                  🔥
                </span>
              )}
            </div>
            <h3 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
              {agent.name}
            </h3>
          </div>
          <span
            className="text-[0.6rem] font-mono font-bold tracking-widest px-2 py-0.5 rounded"
            style={{
              color: agent.railColor,
              background: `${agent.railColor}15`,
              border: `1px solid ${agent.railColor}30`,
            }}
          >
            {RAIL_LABELS[agent.rail] || agent.rail}
          </span>
        </div>

        {/* DNA Bars */}
        <div className="space-y-1.5 mb-4">
          {[
            { label: "OPT", value: agent.dna.optimizationBias, color: "var(--accent-blue)" },
            { label: "RSK", value: agent.dna.riskTolerance, color: "var(--accent-crimson)" },
            { label: "COP", value: agent.dna.cooperationWeight, color: "var(--accent-teal)" },
            { label: "ENT", value: agent.dna.entropyAffinity, color: "var(--accent-violet)" },
          ].map((bar) => (
            <div key={bar.label} className="flex items-center gap-2">
              <span className="text-[0.55rem] font-mono text-[var(--text-muted)] w-6">
                {bar.label}
              </span>
              <div className="dna-bar flex-1">
                <div
                  className="dna-bar-fill"
                  style={{
                    width: `${bar.value * 100}%`,
                    background: bar.color,
                  }}
                />
              </div>
              <span className="text-[0.55rem] font-mono text-[var(--text-secondary)] w-8 text-right">
                {(bar.value * 100).toFixed(0)}%
              </span>
            </div>
          ))}
        </div>

        {/* Stats Row */}
        <div className="flex items-center justify-between pt-3 border-t border-[var(--border-subtle)]">
          <div className="text-center">
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-0.5">SCORE</div>
            <div className="text-sm font-bold text-[var(--accent-green)]">
              {agent.performanceScore}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-0.5">VAULT</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {formatNumber(agent.vaultBacked)}
            </div>
          </div>
          <div className="text-center">
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] mb-0.5">PATRONS</div>
            <div className="text-sm font-bold text-[var(--text-primary)]">
              {agent.patronCount}
            </div>
          </div>
        </div>

        {/* Hover tooltip data */}
        <div className="mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300 text-[0.6rem] font-mono text-[var(--text-muted)] space-y-0.5">
          <div>Optimization Bias: {agent.dna.optimizationBias}</div>
          <div>Risk Tolerance: {agent.dna.riskTolerance}</div>
        </div>
      </div>
    </Link>
  );
}
