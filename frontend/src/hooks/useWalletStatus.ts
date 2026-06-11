"use client";

import { useState } from "react";
import { useAccount, useChainId, useConnect, useDisconnect } from "wagmi";

function normalizeAdminList(value: string) {
  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
}

export function useWalletStatus() {
  const account = useAccount();
  const chainId = useChainId();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const [walletError, setWalletError] = useState<string | null>(null);
  const [networkActionPending, setNetworkActionPending] = useState(false);
  const address = account.address;
  const admins = normalizeAdminList(process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? "");
  const multisigOwners = normalizeAdminList(process.env.NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES ?? process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? "");
  const isAdmin = Boolean(address && admins.includes(address.toLowerCase()));
  const isMultisigApprover = Boolean(address && multisigOwners.includes(address.toLowerCase()));
  const supportedNetwork = [31337, 11155111, 1].includes(chainId);
  const isLocalAnvil = chainId === 31337;

  async function connectWallet() {
    setWalletError(null);
    const connector = connectors[0];
    if (!connector) {
      setWalletError("未检测到 MetaMask 钱包");
      return;
    }
    connect({ connector });
  }

  async function switchToAnvil() {
    setWalletError(null);
    if (!window.ethereum) {
      setWalletError("未检测到 MetaMask 钱包");
      return;
    }
    setNetworkActionPending(true);
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: "0x7a69" }]
      });
    } catch (error) {
      const code = typeof error === "object" && error && "code" in error ? Number((error as { code?: unknown }).code) : undefined;
      if (code !== 4902) {
        setWalletError(error instanceof Error ? error.message : "切换网络失败");
        return;
      }
      await window.ethereum.request({
        method: "wallet_addEthereumChain",
        params: [
          {
            chainId: "0x7a69",
            chainName: "Anvil Local 31337",
            nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
            rpcUrls: [process.env.NEXT_PUBLIC_ANVIL_RPC_URL ?? "http://127.0.0.1:8545"]
          }
        ]
      });
    } finally {
      setNetworkActionPending(false);
    }
  }

  return {
    address,
    chainId,
    isConnected: account.isConnected,
    isConnecting: isPending,
    isAdmin,
    isMultisigApprover,
    supportedNetwork,
    isLocalAnvil,
    networkActionPending,
    walletError,
    connect: connectWallet,
    switchToAnvil,
    disconnect
  };
}
