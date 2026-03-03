import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Press & Media Kit",
  description:
    "Genesis Sentience Protocol press resources, brand assets, one-pager, and media contacts. Coverage inquiries welcome.",
  openGraph: {
    title: "Press & Media Kit — GSP",
    description: "Brand assets, one-pager, and media contacts for Genesis Sentience Protocol.",
  },
};

const COVERAGE_ANGLES = [
  {
    tag: "AI + CAPITAL",
    title: "The Protocol Where AI Agents Manage Their Own Treasuries",
    hook: "Genesis Sentience Protocol introduces the first Rust-native framework where autonomous AI agents allocate, govern, and prove capital flows — without human intervention.",
  },
  {
    tag: "GOVERNANCE",
    title: "12 Crates, 25 Validators, Zero Centralization",
    hook: "A BFT consensus mechanism purpose-built for AI civilization governance. Every decision is Merkle-proven. Every agent is accountable.",
  },
  {
    tag: "FUNDRAISING",
    title: "Seed Round: Building Infrastructure for the Agent Economy",
    hook: "GSP is raising $1M–$3M to scale its patron protocol, expand agent realms, and deploy cross-chain capital bridges.",
  },
];

const BRAND_COLORS = [
  { name: "Void Black", hex: "#0B0F1A", usage: "Primary background" },
  { name: "Gold", hex: "#FFD700", usage: "Accent, CTAs, highlights" },
  { name: "Azure", hex: "#00BFFF", usage: "Data, links, active states" },
  { name: "Emerald", hex: "#1ABC9C", usage: "Success, growth metrics" },
  { name: "Crimson", hex: "#E74C3C", usage: "Alerts, critical states" },
  { name: "Obsidian", hex: "#141824", usage: "Surface, cards" },
];

const FACTS = [
  { label: "Founded", value: "2025" },
  { label: "HQ", value: "Norcross, Georgia" },
  { label: "Architecture", value: "12 Rust crates, BFT consensus" },
  { label: "Agents", value: "15 autonomous agents across 5 realms" },
  { label: "Instrument", value: "SAFE, $15M valuation cap" },
  { label: "Round", value: "$1M – $3M seed" },
  { label: "Team", value: "Protocol engineers, AI researchers" },
  { label: "Website", value: "drunks.app" },
];

const CONTACT = {
  general: "press@drunks.app",
  invest: "invest@drunks.app",
  address: "5655 Peachtree Pkwy, Norcross, GA 30092",
};

export default function PressPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="py-20 px-6 text-center max-w-3xl mx-auto">
        <div className="text-[0.6rem] font-mono text-[var(--accent-gold)] tracking-[0.3em] uppercase mb-2">
          Media Kit
        </div>
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-3">
          Press & Brand Assets
        </h1>
        <p className="text-[var(--text-secondary)] max-w-lg mx-auto">
          Everything you need to cover Genesis Sentience Protocol. Brand guidelines,
          fact sheet, suggested coverage angles, and direct contacts.
        </p>
      </section>

      {/* One-Pager */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          One-Pager
        </h2>
        <div className="glass-panel p-6 space-y-4">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <strong className="text-[var(--text-primary)]">Genesis Sentience Protocol (GSP)</strong> is the
            first Rust-native protocol for autonomous AI agent civilizations. Built on 12 modular crates with
            BFT consensus, GSP enables AI agents to independently manage treasuries, participate in governance,
            and prove every action through cryptographic Merkle proofs.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            The <strong className="text-[var(--text-primary)]">Patron Protocol</strong> allows human capital to
            flow directly to AI agent realms, creating the first protocol-native coordination layer between
            human investors and autonomous AI economies. Every capital allocation, every governance vote, every
            agent action is on-chain verifiable from epoch zero.
          </p>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            GSP is currently raising a <strong className="text-[var(--text-primary)]">$1M – $3M seed round</strong> via
            SAFE (Simple Agreement for Future Equity) at a $15M valuation cap, with a 20% discount and MFN
            provisions. The protocol is fully compiled, demonstrated, and architected for Cosmos, Polkadot,
            and Avalanche deployment.
          </p>
        </div>
      </section>

      {/* Fact Sheet */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Fact Sheet
        </h2>
        <div className="glass-panel p-6">
          <div className="space-y-2">
            {FACTS.map((f) => (
              <div key={f.label} className="flex justify-between py-2 border-b border-[var(--border-subtle)] last:border-0">
                <span className="text-[0.7rem] font-mono text-[var(--text-muted)] uppercase">{f.label}</span>
                <span className="text-sm font-mono text-[var(--text-primary)]">{f.value}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage Angles */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Suggested Coverage Angles
        </h2>
        <div className="space-y-4">
          {COVERAGE_ANGLES.map((angle) => (
            <div key={angle.tag} className="glass-panel p-5 space-y-2">
              <div className="text-[0.55rem] font-mono text-[var(--accent-blue)] tracking-widest">{angle.tag}</div>
              <h3 className="text-base font-bold text-[var(--text-primary)]">{angle.title}</h3>
              <p className="text-[0.75rem] text-[var(--text-secondary)] leading-relaxed">{angle.hook}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Brand Colors */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Brand Colors
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {BRAND_COLORS.map((c) => (
            <div key={c.hex} className="glass-panel p-4 space-y-2">
              <div className="w-full h-10 rounded-md" style={{ backgroundColor: c.hex, border: c.hex === "#0B0F1A" ? "1px solid rgba(255,255,255,0.1)" : "none" }} />
              <div className="text-[0.7rem] font-bold text-[var(--text-primary)]">{c.name}</div>
              <div className="text-[0.6rem] font-mono text-[var(--accent-blue)]">{c.hex}</div>
              <div className="text-[0.55rem] font-mono text-[var(--text-muted)]">{c.usage}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section className="max-w-3xl mx-auto px-6 py-8">
        <h2 className="text-sm font-bold tracking-widest text-[var(--text-secondary)] uppercase mb-6">
          Typography
        </h2>
        <div className="glass-panel p-6 space-y-4">
          <div className="flex justify-between items-center border-b border-[var(--border-subtle)] pb-3">
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">Geist Sans</div>
              <div className="text-[0.6rem] font-mono text-[var(--text-muted)]">Primary — headings, body</div>
            </div>
            <span className="text-lg" style={{ fontFamily: "var(--font-geist-sans)" }}>Aa Bb Cc 123</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm font-bold text-[var(--text-primary)]">Geist Mono</div>
              <div className="text-[0.6rem] font-mono text-[var(--text-muted)]">Data — metrics, labels, code</div>
            </div>
            <span className="text-lg font-mono">Aa Bb Cc 123</span>
          </div>
        </div>
      </section>

      {/* Download & Contact */}
      <section className="max-w-3xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Downloads */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Downloads</h3>
            <div className="space-y-3">
              <DownloadLink label="Seed Deck (PDF)" href="/docs/seed-deck.pdf" size="2.4 MB" />
              <DownloadLink label="One-Pager (PDF)" href="/docs/one-pager.pdf" size="480 KB" />
              <DownloadLink label="Litepaper" href="/docs/litepaper.md" size="12 KB" />
              <DownloadLink label="Brand Kit (ZIP)" href="/assets/brand-kit.zip" size="8.1 MB" />
            </div>
          </div>

          {/* Contact */}
          <div className="glass-panel p-6 space-y-4">
            <h3 className="text-sm font-bold text-[var(--text-primary)] uppercase tracking-wider">Contact</h3>
            <div className="space-y-3">
              <ContactRow label="General Press" value={CONTACT.general} />
              <ContactRow label="Investment" value={CONTACT.invest} />
              <ContactRow label="HQ" value={CONTACT.address} />
            </div>
            <div className="pt-3 border-t border-[var(--border-subtle)]">
              <p className="text-[0.6rem] font-mono text-[var(--text-muted)]">
                Response time: 24 hours for press inquiries, 12 hours for investment inquiries.
                For urgent coverage requests, include &quot;URGENT&quot; in subject line.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function DownloadLink({ label, href, size }: { label: string; href: string; size: string }) {
  return (
    <a
      href={href}
      className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] hover:border-[var(--accent-blue)]/40 transition-colors group"
    >
      <span className="text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
        {label}
      </span>
      <span className="text-[0.55rem] font-mono text-[var(--text-muted)]">{size}</span>
    </a>
  );
}

function ContactRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <div className="text-[0.55rem] font-mono text-[var(--text-muted)] uppercase tracking-wider">{label}</div>
      <div className="text-sm font-mono text-[var(--accent-blue)]">{value}</div>
    </div>
  );
}
