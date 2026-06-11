import { z } from "zod";

export const evmAddressSchema = z.string().regex(/^0x[a-fA-F0-9]{40}$/);
export const atomicAmountSchema = z.string().regex(/^[0-9]+$/).refine((value) => BigInt(value) > 0n, "amount must be positive");

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  page_size: z.coerce.number().int().positive().max(100).default(20)
});

export type Pagination = z.infer<typeof paginationSchema>;
