"use client";

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
  const address = account.address;
  const admins = normalizeAdminList(process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? "");
  const multisigOwners = normalizeAdminList(process.env.NEXT_PUBLIC_MULTISIG_OWNER_ADDRESSES ?? process.env.NEXT_PUBLIC_ADMIN_ADDRESSES ?? "");
  const isAdmin = Boolean(address && admins.includes(address.toLowerCase()));
  const isMultisigApprover = Boolean(address && multisigOwners.includes(address.toLowerCase()));
  const supportedNetwork = [31337, 11155111, 1].includes(chainId);

  return {
    address,
    chainId,
    isConnected: account.isConnected,
    isConnecting: isPending,
    isAdmin,
    isMultisigApprover,
    supportedNetwork,
    connect: () => connect({ connector: connectors[0] }),
    disconnect
  };
}
