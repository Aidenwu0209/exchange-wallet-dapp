"use client";

import { Copy } from "lucide-react";
import { shortAddress } from "@/src/utils/format";

export function TxHashLink({ txHash }: { txHash?: string | null }) {
  if (!txHash) return <span className="muted">-</span>;
  return (
    <button
      className="button secondary mono"
      type="button"
      title={txHash}
      onClick={() => navigator.clipboard.writeText(txHash)}
      style={{ minHeight: 30, padding: "5px 8px" }}
    >
      <Copy size={14} />
      {shortAddress(txHash)}
    </button>
  );
}
