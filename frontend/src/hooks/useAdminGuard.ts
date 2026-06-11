"use client";

import { useWalletStatus } from "./useWalletStatus";

export function useAdminGuard() {
  const wallet = useWalletStatus();
  return {
    ...wallet,
    canOperateAdmin: wallet.isConnected && wallet.isAdmin && wallet.supportedNetwork
  };
}
