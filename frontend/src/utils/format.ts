export function shortAddress(address?: string | null) {
  if (!address) return "-";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function formatAtomic(amount?: string | null, decimals = 18) {
  if (!amount) return "0";
  const value = BigInt(amount);
  const base = 10n ** BigInt(decimals);
  const whole = value / base;
  const fraction = (value % base).toString().padStart(decimals, "0").slice(0, 6).replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

export function statusTone(status?: string | null) {
  if (!status) return "";
  if (["CONFIRMED", "ANCHORED", "APPROVED", "MATCHED"].includes(status)) return "success";
  if (["PENDING", "PENDING_MULTISIG", "PENDING_REVIEW", "BROADCASTED"].includes(status)) return "warning";
  if (["FAILED", "RISK_REJECTED", "BLOCKED", "MISMATCHED"].includes(status)) return "danger";
  return "";
}
