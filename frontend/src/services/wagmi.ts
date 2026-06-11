"use client";

import { QueryClient } from "@tanstack/react-query";
import { createConfig, http } from "wagmi";
import { injected } from "wagmi/connectors";
import { mainnet, sepolia } from "wagmi/chains";

export const anvil = {
  id: 31337,
  name: "Anvil",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ANVIL_RPC_URL ?? "http://127.0.0.1:8545"] }
  }
} as const;

export const wagmiConfig = createConfig({
  chains: [anvil, sepolia, mainnet],
  connectors: [injected({ target: "metaMask" })],
  transports: {
    [anvil.id]: http(anvil.rpcUrls.default.http[0]),
    [sepolia.id]: http(),
    [mainnet.id]: http()
  },
  ssr: true
});

export const queryClient = new QueryClient();
