import { randomUUID } from "node:crypto";

export function randomId(prefix = "") {
  const id = randomUUID().replace(/-/g, "").slice(0, 16);
  return prefix ? `${prefix}_${id}` : id;
}
