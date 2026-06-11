import { statusTone } from "@/src/utils/format";

export function StatusBadge({ value }: { value?: string | null }) {
  return <span className={`badge ${statusTone(value)}`}>{value ?? "-"}</span>;
}
