"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider, http, createConfig } from "wagmi";
import { polygon } from "wagmi/chains";
import {
  RainbowKitProvider,
  darkTheme,
  type Theme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import {
  metaMaskWallet,
  coinbaseWallet,
  walletConnectWallet,
  rainbowWallet,
} from "@rainbow-me/rainbowkit/wallets";

// ═══════════════════════════════════════════════
// GSP Web3 Provider — Polygon Mainnet
// Bloomberg Terminal Dark Theme
// ═══════════════════════════════════════════════

const PROJECT_ID = "gsp-genesis-sentience-protocol";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Recommended",
      wallets: [metaMaskWallet, coinbaseWallet, walletConnectWallet, rainbowWallet],
    },
  ],
  {
    appName: "GSP — The First Minds",
    projectId: "b1f5e3c8d4a2f6e7b9c0d1e2f3a4b5c6", // WalletConnect Cloud project ID placeholder
  }
);

const config = createConfig({
  connectors,
  chains: [polygon],
  transports: {
    [polygon.id]: http("https://polygon-mainnet.g.alchemy.com/v2/SArQ_uTUUBzu6BVr-E6ak"),
  },
  ssr: false,
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 2,
    },
  },
});

// Custom dark theme matching GSP design system
const gspTheme: Theme = {
  ...darkTheme({
    accentColor: "#00BFFF",
    accentColorForeground: "#0B0F1A",
    borderRadius: "small",
    fontStack: "system",
  }),
  colors: {
    ...darkTheme().colors,
    modalBackground: "#0E1225",
    modalBorder: "rgba(255, 255, 255, 0.08)",
    profileForeground: "#0E1225",
    closeButton: "#8892A4",
    closeButtonBackground: "rgba(255, 255, 255, 0.06)",
    connectButtonBackground: "rgba(0, 191, 255, 0.1)",
    connectButtonInnerBackground: "rgba(0, 191, 255, 0.15)",
    connectButtonText: "#00BFFF",
    generalBorder: "rgba(255, 255, 255, 0.08)",
    menuItemBackground: "rgba(255, 255, 255, 0.06)",
    modalText: "#E8ECF4",
    modalTextSecondary: "#8892A4",
    selectedOptionBorder: "rgba(0, 191, 255, 0.3)",
    accentColor: "#00BFFF",
    accentColorForeground: "#0B0F1A",
    actionButtonBorder: "rgba(0, 191, 255, 0.3)",
    actionButtonBorderMobile: "rgba(0, 191, 255, 0.3)",
    actionButtonSecondaryBackground: "rgba(255, 255, 255, 0.06)",
    connectButtonBackgroundError: "rgba(231, 76, 60, 0.15)",
    connectButtonTextError: "#E74C3C",
    connectionIndicator: "#00E676",
    downloadBottomCardBackground: "#0E1225",
    downloadTopCardBackground: "#0B0F1A",
    error: "#E74C3C",
    generalBorderDim: "rgba(255, 255, 255, 0.04)",
    profileAction: "#0E1225",
    profileActionHover: "rgba(255, 255, 255, 0.06)",
    standby: "#FFD700",
  },
  fonts: {
    body: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
  },
  shadows: {
    connectButton: "0 0 20px rgba(0, 191, 255, 0.15)",
    dialog: "0 0 40px rgba(0, 0, 0, 0.5)",
    profileDetailsAction: "0 0 10px rgba(0, 191, 255, 0.1)",
    selectedOption: "0 0 15px rgba(0, 191, 255, 0.2)",
    selectedWallet: "0 0 15px rgba(0, 191, 255, 0.2)",
    walletLogo: "none",
  },
};

export default function Web3Provider({ children }: { children: ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={gspTheme} coolMode>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
