import { z } from "zod";

export const scanDepositsSchema = z.object({
  from_block: z.coerce.number().int().nonnegative().optional(),
  to_block: z.union([z.literal("latest"), z.coerce.number().int().nonnegative()]).default("latest")
});
