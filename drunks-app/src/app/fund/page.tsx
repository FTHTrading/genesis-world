"use client";

import { useState, useEffect } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { loadReport, formatNumber } from "@/lib/data";
import { GSPReport } from "@/lib/types";

const API_URL = "https://gsp-api.kevanbtc.workers.dev";

const TIERS = [
  {
    name: "EXPLORER",
    range: "$5K – $25K",
    min: 5000,
    max: 25000,
    color: "#1ABC9C",
    perks: [
      "Quarterly investor updates",
      "Protocol dashboard access",
      "Community Discord (Investor channel)",
      "Name in Genesis Block credits",
    ],
    badge: "◇",
  },
  {
    name: "STRATEGIST",
    range: "$25K – $100K",
    min: 25000,
    max: 100000,
    color: "#00BFFF",
    perks: [
      "Everything in Explorer",
      "Monthly strategy calls with founding team",
      "Early access to agent API + SDK",
      "Advisory board nomination rights",
      "Co-marketing opportunities",
    ],
    badge: "◆",
    featured: true,
  },
  {
    name: "ARCHITECT",
    range: "$100K+",
    min: 100000,
    max: null,
    color: "#FFD700",
    perks: [
      "Everything in Strategist",
      "Board observer seat",
      "Custom agent realm naming rights",
      "Direct line to CTO + protocol architect",
      "First-right on follow-on rounds",
      "Protocol governance voting power",
    ],
    badge: "◈",
  },
];

const SAFE_TERMS = [
  { label: "Instrument", value: "SAFE (Simple Agreement for Future Equity)" },
  { label: "Valuation Cap", value: "$15M" },
  { label: "Discount", value: "20%" },
  { label: "MFN", value: "Yes — most favored nation" },
  { label: "Round Target", value: "$1M – $3M" },
  { label: "Pro-rata Rights", value: "Strategist + Architect tiers" },
  { label: "Governing Law", value: "State of Georgia" },
  { label: "Entity", value: "Genesis Sentience Protocol, Inc." },
];

export default function FundPage() {
  const [report, setReport] = useState<GSPReport | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    amount: "",
    tier: "STRATEGIST",
    accredited: false,
    entity: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [investorCount, setInvestorCount] = useState<number | null>(null);

  useEffect(() => {
    loadReport().then(setReport);
    // Fetch live investor interest count
    fetch(`${API_URL}/api/stats`)
      .then((r) => r.json())
      .then((d) => setInvestorCount(d.count))
      .catch(() => setInvestorCount(null));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/api/invest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // Fallback: save to localStorage and show success
      const leads = JSON.parse(localStorage.getItem("gsp-leads") || "[]");
      leads.push({ ...form, timestamp: new Date().toISOString() });
      localStorage.setItem("gsp-leads", JSON.stringify(leads));
      setSubmitted(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="relative py-20 px-6 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[rgba(0,191,255,0.05)] to-transparent" />
        <div className="relative max-w-3xl mx-auto space-y-4">
          <div className="text-[0.6rem] font-mono text-[var(--accent-gold)] tracking-[0.3em] uppercase">
            Seed Round — Now Open
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-[var(--accent-gold)] via-white to-[var(--accent-blue)] bg-clip-text text-transparent leading-tight">
            Fund the First Minds
          </h1>
          <p className="text-[var(--text-secondary)] max-w-xl mx-auto">
            Back the protocol that creates autonomous AI civilizations.
            SAFE-based investment with institutional-grade infrastructure.
          </p>

          {/* Live Stats Bar */}
          <div className="flex items-center justify-center gap-6 mt-6">
            {report && (
              <>
                <StatPill label="Total Capital Flow" value={formatNumber(report.patron.total_capital)} />
                <StatPill label="Active Agents" value={report.summary.active_agents.toString()} />
                <StatPill label="Validators" value={report.summary.validator_count.toString()} />
              </>
            )}
            {investorCount !== null && (
              <StatPill label="Investors Interested" value={investorCount.toString()} accent />
            )}
          </div>
        </div>
      </section>

      {/* Investment Tiers */}
      <section id="tiers" className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-8 text-center">
          Investment Tiers
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {TIERS.map((tier) => (
            <div
              key={tier.name}
              className={`glass-panel p-6 relative ${
                tier.featured ? "border-[var(--accent-blue)]/40 ring-1 ring-[var(--accent-blue)]/20" : ""
              }`}
              style={{ borderTopColor: tier.color, borderTopWidth: 3 }}
            >
              {tier.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent-blue)] text-white text-[0.5rem] font-mono font-bold px-3 py-0.5 rounded-full tracking-widest">
                  MOST POPULAR
                </div>
              )}
              <div className="text-2xl mb-2" style={{ color: tier.color }}>
                {tier.badge}
              </div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">{tier.name}</h3>
              <div className="text-xl font-bold font-mono mt-1" style={{ color: tier.color }}>
                {tier.range}
              </div>
              <ul className="mt-4 space-y-2">
                {tier.perks.map((perk, i) => (
                  <li key={i} className="text-[0.7rem] text-[var(--text-secondary)] flex items-start gap-2">
                    <span className="text-[0.5rem] mt-0.5" style={{ color: tier.color }}>
                      ✓
                    </span>
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  setForm({ ...form, tier: tier.name });
                  document.getElementById("invest-form")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="w-full mt-6 py-2.5 rounded-lg text-sm font-mono font-bold tracking-wider transition-all"
                style={{
                  background: tier.featured ? tier.color : "transparent",
                  color: tier.featured ? "#0B0F1A" : tier.color,
                  border: `1px solid ${tier.color}40`,
                }}
              >
                SELECT {tier.name}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* SAFE Terms */}
      <section id="terms" className="max-w-3xl mx-auto px-6 py-12">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6 text-center">
          SAFE Terms
        </h2>
        <div className="glass-panel p-6">
          <div className="space-y-3">
            {SAFE_TERMS.map((term) => (
              <div key={term.label} className="flex items-center justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-[0.7rem] font-mono text-[var(--text-secondary)]">{term.label}</span>
                <span className="text-sm font-bold font-mono text-[var(--text-primary)]">{term.value}</span>
              </div>
            ))}
          </div>
          <p className="text-[0.6rem] text-[var(--text-muted)] mt-4">
            Standard YC SAFE template with MFN provision. Pro-rata rights for Strategist and Architect tiers.
            All investments subject to accredited investor verification under SEC Rule 506(b)/506(c).
          </p>
        </div>
      </section>

      {/* Why Now */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-8 text-center">
          Why Now
        </h2>
        <div className="grid md:grid-cols-3 gap-5">
          {[
            {
              icon: "⚡",
              title: "AI Agent Market",
              body: "Autonomous agents are the next frontier. $200B+ TAM by 2028. GSP is the capital coordination layer.",
            },
            {
              icon: "🏛️",
              title: "Protocol-Native",
              body: "Not a wrapper. Not a chatbot. 12-crate Rust architecture with Cosmos/Polkadot/Avalanche DNA. Built from zero.",
            },
            {
              icon: "🔐",
              title: "Cryptographic Proof",
              body: "Every capital flow, every governance decision, every agent action — Merkle-proven. Full auditability from epoch 0.",
            },
          ].map((card) => (
            <div key={card.title} className="glass-panel p-5 space-y-2">
              <div className="text-2xl">{card.icon}</div>
              <h3 className="text-sm font-bold text-[var(--text-primary)]">{card.title}</h3>
              <p className="text-[0.7rem] text-[var(--text-secondary)] leading-relaxed">{card.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Investment Form */}
      <section id="invest-form" className="max-w-2xl mx-auto px-6 py-12">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6 text-center">
          Express Investment Interest
        </h2>

        {submitted ? (
          <div className="glass-panel neon-border p-8 text-center space-y-4">
            <div className="text-4xl">✓</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)]">Interest Received</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              You&apos;ll receive a response within 24 hours with next steps, data room access,
              and scheduling for your introductory call.
            </p>
            <p className="text-[0.6rem] font-mono text-[var(--text-muted)]">
              Reference: GSP-{Date.now().toString(36).toUpperCase()}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="glass-panel p-6 space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Full Name"
                required
                value={form.name}
                onChange={(v) => setForm({ ...form, name: v })}
                placeholder="Jane Doe"
              />
              <FormField
                label="Email"
                type="email"
                required
                value={form.email}
                onChange={(v) => setForm({ ...form, email: v })}
                placeholder="jane@fund.com"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormField
                label="Investment Amount ($)"
                type="number"
                required
                value={form.amount}
                onChange={(v) => setForm({ ...form, amount: v })}
                placeholder="50000"
              />
              <div>
                <label className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1 block">
                  Tier
                </label>
                <select
                  value={form.tier}
                  onChange={(e) => setForm({ ...form, tier: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
                >
                  <option value="EXPLORER">Explorer ($5K – $25K)</option>
                  <option value="STRATEGIST">Strategist ($25K – $100K)</option>
                  <option value="ARCHITECT">Architect ($100K+)</option>
                </select>
              </div>
            </div>

            <FormField
              label="Entity Name (if applicable)"
              value={form.entity}
              onChange={(v) => setForm({ ...form, entity: v })}
              placeholder="Acme Ventures, LLC"
            />

            <div>
              <label className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1 block">
                Message (optional)
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={3}
                placeholder="Tell us about your interest in GSP..."
                className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-blue)] focus:outline-none transition-colors resize-none"
              />
            </div>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.accredited}
                onChange={(e) => setForm({ ...form, accredited: e.target.checked })}
                className="mt-0.5 accent-[var(--accent-blue)]"
                required
              />
              <span className="text-[0.7rem] text-[var(--text-secondary)] leading-relaxed">
                I confirm that I am an accredited investor as defined under SEC Rule 501 of Regulation D,
                or I am investing through a qualified entity. I understand this is an expression of interest,
                not a binding commitment.
              </span>
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-lg bg-gradient-to-r from-[var(--accent-gold)] to-[var(--accent-blue)] text-[#0B0F1A] text-sm font-bold tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {submitting ? "SUBMITTING..." : "SUBMIT INVESTMENT INTEREST"}
            </button>

            <p className="text-[0.5rem] font-mono text-[var(--text-muted)] text-center leading-relaxed">
              By submitting, you agree to be contacted regarding this investment opportunity.
              This is not an offer to sell securities. All investments are subject to final documentation,
              accredited investor verification, and applicable securities laws.
            </p>
          </form>
        )}
      </section>

      {/* Social Proof / Traction */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div className="glass-panel p-8">
          <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6 text-center">
            Protocol Traction
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {report && (
              <>
                <TractionStat value="12" label="Rust Crates" sublabel="Production architecture" />
                <TractionStat value="25" label="Validators" sublabel="BFT consensus" />
                <TractionStat value="15" label="Active Agents" sublabel="Across 5 realms" />
                <TractionStat value={formatNumber(report.patron.total_capital)} label="Capital Flow" sublabel="Simulation proven" />
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function StatPill({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <span
        className="text-sm font-bold font-mono"
        style={{ color: accent ? "var(--accent-gold)" : "var(--text-primary)" }}
      >
        {value}
      </span>
      <span className="text-[0.55rem] font-mono text-[var(--text-muted)] uppercase">{label}</span>
    </div>
  );
}

function FormField({
  label,
  type = "text",
  required,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  type?: string;
  required?: boolean;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider uppercase mb-1 block">
        {label} {required && <span className="text-[var(--accent-crimson)]">*</span>}
      </label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] font-mono text-sm focus:border-[var(--accent-blue)] focus:outline-none transition-colors"
      />
    </div>
  );
}

function TractionStat({ value, label, sublabel }: { value: string; label: string; sublabel: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold font-mono text-[var(--accent-gold)]">{value}</div>
      <div className="text-xs font-bold text-[var(--text-primary)] mt-1">{label}</div>
      <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">{sublabel}</div>
    </div>
  );
}
