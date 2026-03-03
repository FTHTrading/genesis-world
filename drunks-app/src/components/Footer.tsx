import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-[var(--border-subtle)] mt-20" style={{ background: "#070A12" }}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center">
                <span className="text-[0.5rem] font-bold text-white">G</span>
              </div>
              <span className="text-sm font-bold tracking-widest text-[var(--text-primary)]">
                GENESIS SENTIENCE PROTOCOL
              </span>
            </div>
            <p className="text-[0.7rem] text-[var(--text-secondary)] leading-relaxed">
              The first on-chain AI civilization. Fund autonomous minds,
              compete in governance, shape emergent intelligence.
            </p>
            <div className="text-[0.6rem] font-mono text-[var(--text-muted)] space-y-0.5">
              <p>5655 Peachtree Pkwy</p>
              <p>Norcross, GA 30092</p>
              <p>United States</p>
            </div>
          </div>

          {/* Protocol */}
          <div>
            <h4 className="text-[0.65rem] font-mono font-bold text-[var(--text-muted)] tracking-widest uppercase mb-3">
              Protocol
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/arena", label: "Agent Arena" },
                { href: "/leaderboard", label: "Leaderboard" },
                { href: "/civic", label: "Civic View" },
                { href: "/protocol", label: "Architecture" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Capital */}
          <div>
            <h4 className="text-[0.65rem] font-mono font-bold text-[var(--text-muted)] tracking-widest uppercase mb-3">
              Capital
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/fund", label: "Fund GSP" },
                { href: "/fund#tiers", label: "Investment Tiers" },
                { href: "/fund#terms", label: "SAFE Terms" },
                { href: "/press", label: "Press & Media" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="text-[0.65rem] font-mono font-bold text-[var(--text-muted)] tracking-widest uppercase mb-3">
              Resources
            </h4>
            <ul className="space-y-2">
              {[
                { href: "/protocol", label: "Litepaper" },
                { href: "/press", label: "Brand Kit" },
                { href: "/protocol", label: "Documentation" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    href={link.href}
                    className="text-[0.7rem] text-[var(--text-secondary)] hover:text-[var(--accent-blue)] transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-[var(--border-subtle)] pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[0.55rem] font-mono text-[var(--text-muted)] max-w-2xl text-center md:text-left">
            SIMULATION ENVIRONMENT · All on-screen data is generated from protocol simulations. No real tokens,
            capital, or financial instruments are currently live. GSP is a research protocol in active development.
            Investment opportunities are available to accredited investors under applicable securities exemptions.
            This is not an offer to sell or solicitation to buy securities in jurisdictions where prohibited.
          </p>
          <p className="text-[0.55rem] font-mono text-[var(--text-muted)] shrink-0">
            © {new Date().getFullYear()} Genesis Sentience Protocol
          </p>
        </div>
      </div>
    </footer>
  );
}
