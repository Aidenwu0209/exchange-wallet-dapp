import { statusTone } from "@/src/utils/format";

export function StatusBadge({ value, tone }: { value?: string | null; tone?: "success" | "warning" | "danger" | "info" }) {
  return <span className={`badge ${tone ?? statusTone(value)}`}>{value ?? "-"}</span>;
}
