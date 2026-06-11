"use client";

import { Copy } from "lucide-react";
import { shortAddress } from "@/src/utils/format";

export function AddressText({ address, full = false }: { address?: string | null; full?: boolean }) {
  if (!address) return <span>-</span>;
  return (
    <button
      className="button secondary mono"
      title={address}
      type="button"
      onClick={() => navigator.clipboard.writeText(address)}
      style={{ minHeight: 30, padding: "5px 8px" }}
    >
      <Copy size={14} />
      {full ? address : shortAddress(address)}
    </button>
  );
}
