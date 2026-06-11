"use client";

import { LogOut, PlugZap } from "lucide-react";
import { Button } from "@/src/components/ui/Button";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { AddressText } from "@/src/components/ui/AddressText";
import { useWalletStatus } from "@/src/hooks/useWalletStatus";

export function WalletStatus() {
  const wallet = useWalletStatus();
  return (
    <div className="button-row">
      <StatusBadge value={wallet.supportedNetwork ? `CHAIN_${wallet.chainId}` : "UNSUPPORTED"} />
      <StatusBadge value={wallet.isAdmin ? "ADMIN" : "USER"} />
      <StatusBadge value={wallet.isMultisigApprover ? "MULTISIG" : "NO_MULTISIG"} />
      {wallet.address ? <AddressText address={wallet.address} /> : null}
      {wallet.isConnected ? (
        <Button variant="secondary" icon={<LogOut size={16} />} onClick={() => wallet.disconnect()}>
          断开
        </Button>
      ) : (
        <Button icon={<PlugZap size={16} />} onClick={wallet.connect} disabled={wallet.isConnecting}>
          连接 MetaMask
        </Button>
      )}
    </div>
  );
}
