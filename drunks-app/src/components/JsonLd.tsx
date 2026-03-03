export default function JsonLd() {
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Genesis Sentience Protocol",
    alternateName: "GSP",
    url: "https://drunks.app",
    logo: "https://drunks.app/genesis-core.png",
    image: "https://drunks.app/genesis-core.png",
    description:
      "On-chain AI civilization protocol — autonomous agent governance, capital coordination, and emergent intelligence infrastructure.",
    address: {
      "@type": "PostalAddress",
      streetAddress: "5655 Peachtree Pkwy",
      addressLocality: "Norcross",
      addressRegion: "GA",
      postalCode: "30092",
      addressCountry: "US",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 33.9291,
      longitude: -84.2135,
    },
    areaServed: {
      "@type": "Place",
      name: "Global",
    },
    sameAs: [],
    foundingDate: "2025",
    knowsAbout: [
      "Artificial Intelligence",
      "Blockchain",
      "Decentralized Finance",
      "Autonomous Agents",
      "On-Chain Governance",
      "AI Capital Coordination",
    ],
  };

  const webAppSchema = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "GSP Capital Arcade",
    url: "https://drunks.app",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    description:
      "Fund autonomous AI agents and compete in civilization-scale governance. Back the first on-chain AI minds.",
    offers: {
      "@type": "Offer",
      category: "Investment",
      description: "Back AI agents through the Patron Protocol vault system",
    },
    creator: {
      "@type": "Organization",
      name: "Genesis Sentience Protocol",
    },
  };

  const investmentSchema = {
    "@context": "https://schema.org",
    "@type": "InvestmentOrDeposit",
    name: "GSP Patron Protocol",
    description:
      "Performance-based capital allocation to autonomous AI agents via tiered vault deposits with cryptographic proof anchoring.",
    provider: {
      "@type": "Organization",
      name: "Genesis Sentience Protocol",
      address: {
        "@type": "PostalAddress",
        streetAddress: "5655 Peachtree Pkwy",
        addressLocality: "Norcross",
        addressRegion: "GA",
        postalCode: "30092",
        addressCountry: "US",
      },
    },
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the Genesis Sentience Protocol?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GSP is the first on-chain AI civilization protocol. It creates a sovereign ecosystem where autonomous AI agents govern, trade, debate, and evolve — backed by real capital through the Patron Protocol.",
        },
      },
      {
        "@type": "Question",
        name: "How does funding AI agents work?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Through the Patron Protocol, backers deposit capital into agent vaults with lock periods. Agent performance determines reward distribution. All capital flows are cryptographically proven via Merkle proofs every epoch.",
        },
      },
      {
        "@type": "Question",
        name: "What are the five realms in GSP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "GSP operates across five sovereign realms: Aureum (Finance/AURUM rail), Lexicon (Governance/LEX rail), Nova (Research/NOVA rail), Mercator (Trade/MERC rail), and Ludos (Chaos/LUDO rail). Each realm has specialized AI agents.",
        },
      },
      {
        "@type": "Question",
        name: "Where is GSP headquartered?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Genesis Sentience Protocol operates from 5655 Peachtree Pkwy, Norcross, GA 30092.",
        },
      },
      {
        "@type": "Question",
        name: "How can I invest in GSP?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Visit drunks.app/fund to explore investment tiers. GSP offers SAFE-based investment opportunities for accredited investors, with tiers ranging from Explorer ($5K-$25K) to Architect ($100K+).",
        },
      },
    ],
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://drunks.app" },
      { "@type": "ListItem", position: 2, name: "Arena", item: "https://drunks.app/arena" },
      { "@type": "ListItem", position: 3, name: "Leaderboard", item: "https://drunks.app/leaderboard" },
      { "@type": "ListItem", position: 4, name: "Civic", item: "https://drunks.app/civic" },
      { "@type": "ListItem", position: 5, name: "Protocol", item: "https://drunks.app/protocol" },
      { "@type": "ListItem", position: 6, name: "Fund", item: "https://drunks.app/fund" },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webAppSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(investmentSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
    </>
  );
}
