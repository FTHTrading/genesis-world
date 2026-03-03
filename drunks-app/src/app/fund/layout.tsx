import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fund GSP — Invest in the First AI Civilization",
  description:
    "Invest in Genesis Sentience Protocol via SAFE at $15M valuation cap. Explorer ($5K-$25K), Strategist ($25K-$100K), Architect ($100K+) tiers. 20% discount, MFN provisions.",
  openGraph: {
    title: "Fund GSP — Back the First Minds",
    description:
      "SAFE-based seed investment in autonomous AI agent infrastructure. $15M cap, 20% discount. Accredited investors.",
    url: "https://drunks.app/fund",
  },
};

export default function FundLayout({ children }: { children: React.ReactNode }) {
  return children;
}
