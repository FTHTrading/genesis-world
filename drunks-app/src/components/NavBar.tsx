"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@rainbow-me/rainbowkit";

const NAV_ITEMS = [
  { href: "/", label: "HOME" },
  { href: "/nexus", label: "NEXUS", hot: true },
  { href: "/nft-gallery", label: "NFT" },
  { href: "/arena", label: "ARENA" },
  { href: "/leaderboard", label: "LEADERBOARD" },
  { href: "/civic", label: "CIVIC" },
  { href: "/protocol", label: "PROTOCOL" },
  { href: "/vault", label: "VAULT", vault: true },
  { href: "/fund", label: "FUND", cta: true },
];

export default function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-panel border-b border-[var(--border-subtle)]"
         style={{ borderRadius: 0 }}>
      <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-violet)] flex items-center justify-center animate-pulse-glow">
            <span className="text-xs font-bold text-white">G</span>
          </div>
          <span className="text-sm font-bold tracking-widest text-[var(--text-primary)] group-hover:text-[var(--accent-blue)] transition-colors">
            GSP
          </span>
          <span className="text-[0.6rem] font-mono text-[var(--text-muted)] tracking-wider hidden sm:block">
            SEASON 1
          </span>
        </Link>

        {/* Nav Links */}
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || 
              (item.href !== "/" && pathname.startsWith(item.href));
            if (item.cta) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="ml-2 px-4 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded bg-gradient-to-r from-[var(--accent-gold)] to-[#FFA500] text-[#0B0F1A] hover:opacity-90 transition-opacity animate-pulse-glow"
                >
                  {item.label}
                </Link>
              );
            }
            if ((item as any).hot) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded transition-all ${
                    active
                      ? "text-[var(--accent-green)] bg-[rgba(0,230,118,0.1)] border border-[rgba(0,230,118,0.3)]"
                      : "text-[var(--accent-green)] hover:bg-[rgba(0,230,118,0.06)] border border-[rgba(0,230,118,0.15)] animate-pulse-glow"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
            if ((item as any).vault) {
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded transition-all ${
                    active
                      ? "text-[var(--accent-gold)] bg-[rgba(255,215,0,0.1)] border border-[rgba(255,215,0,0.3)]"
                      : "text-[var(--accent-gold)] hover:bg-[rgba(255,215,0,0.06)] border border-[rgba(255,215,0,0.15)]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-1.5 text-[0.7rem] font-mono tracking-widest rounded transition-all ${
                  active
                    ? "text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)] border border-[rgba(0,191,255,0.2)]"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-transparent hover:border-[var(--border-subtle)]"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Wallet Connect */}
        <div className="hidden md:flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-green)] animate-pulse-glow" />
            <span className="text-[0.65rem] font-mono text-[var(--text-muted)] tracking-wider">
              POLYGON
            </span>
          </div>
          <ConnectButton.Custom>
            {({
              account,
              chain,
              openAccountModal,
              openChainModal,
              openConnectModal,
              mounted,
            }) => {
              const ready = mounted;
              const connected = ready && account && chain;

              return (
                <div
                  {...(!ready && {
                    "aria-hidden": true,
                    style: {
                      opacity: 0,
                      pointerEvents: "none",
                      userSelect: "none",
                    },
                  })}
                >
                  {(() => {
                    if (!connected) {
                      return (
                        <button
                          onClick={openConnectModal}
                          className="px-4 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded border border-[rgba(0,191,255,0.3)] text-[var(--accent-blue)] bg-[rgba(0,191,255,0.08)] hover:bg-[rgba(0,191,255,0.15)] hover:border-[rgba(0,191,255,0.5)] transition-all cursor-pointer"
                        >
                          CONNECT
                        </button>
                      );
                    }

                    if (chain.unsupported) {
                      return (
                        <button
                          onClick={openChainModal}
                          className="px-4 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded border border-[rgba(231,76,60,0.3)] text-[var(--accent-crimson)] bg-[rgba(231,76,60,0.08)] hover:bg-[rgba(231,76,60,0.15)] transition-all cursor-pointer"
                        >
                          WRONG NETWORK
                        </button>
                      );
                    }

                    return (
                      <button
                        onClick={openAccountModal}
                        className="px-4 py-1.5 text-[0.7rem] font-mono font-bold tracking-widest rounded border border-[rgba(0,230,118,0.3)] text-[var(--accent-green)] bg-[rgba(0,230,118,0.08)] hover:bg-[rgba(0,230,118,0.15)] transition-all cursor-pointer flex items-center gap-2"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-green)]" />
                        {account.displayName}
                      </button>
                    );
                  })()}
                </div>
              );
            }}
          </ConnectButton.Custom>
        </div>
      </div>
    </nav>
  );
}
