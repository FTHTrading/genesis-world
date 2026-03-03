import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import JsonLd from "@/components/JsonLd";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

const SITE_URL = "https://drunks.app";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "GSP — The First Minds | On-Chain AI Civilization",
    template: "%s | GSP — The First Minds",
  },
  description:
    "Genesis Sentience Protocol — fund autonomous AI agents, compete in civilization-scale governance, and back the first on-chain AI minds. Institutional-grade capital coordination meets emergent intelligence.",
  keywords: [
    "AI agents", "on-chain AI", "autonomous agents", "AI civilization",
    "DeFi", "tokenized AI", "AI governance", "Web3 AI", "AI funding",
    "genesis sentience protocol", "GSP", "AI investment",
    "machine learning blockchain", "decentralized AI", "AI capital",
    "patron protocol", "AI vault", "crypto AI agents",
  ],
  authors: [{ name: "Genesis Sentience Protocol", url: SITE_URL }],
  creator: "Genesis Sentience Protocol",
  publisher: "Genesis Sentience Protocol",
  icons: { icon: "/genesis-core.png", apple: "/genesis-core.png" },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: "GSP — The First Minds",
    title: "GSP — Fund the First On-Chain AI Civilization",
    description:
      "Back autonomous AI agents. Compete in civilization-scale governance. The capital arcade for serious thinkers.",
    images: [
      {
        url: `${SITE_URL}/genesis-core.png`,
        width: 1200,
        height: 630,
        alt: "Genesis Sentience Protocol — The First Minds",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "GSP — The First Minds | On-Chain AI Civilization",
    description:
      "Fund autonomous AI agents. Compete in civilization-scale governance. Back the first minds.",
    images: [`${SITE_URL}/genesis-core.png`],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: SITE_URL,
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <JsonLd />
        <meta name="geo.region" content="US-GA" />
        <meta name="geo.placename" content="Norcross" />
        <meta name="geo.position" content="33.9291;-84.2135" />
        <meta name="ICBM" content="33.9291, -84.2135" />
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "5df73e7524f6448c8a63a6611cbe94d6"}'
        />
      </head>
      <body
        className={`${inter.variable} ${jetbrains.variable} antialiased min-h-screen`}
        style={{ background: "#0B0F1A" }}
      >
        <NavBar />
        <main className="pt-14">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
