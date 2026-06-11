import { z } from "zod";
import { atomicAmountSchema, evmAddressSchema } from "./common.schema.js";

export const createWithdrawalSchema = z.object({
  user_id: z.string().min(1),
  to_address: evmAddressSchema,
  amount: atomicAmountSchema,
  asset_symbol: z.literal("MockUSDT").default("MockUSDT"),
  note: z.string().max(200).optional()
});

export const withdrawalIdParamsSchema = z.object({
  withdrawal_id: z.string().min(1)
});
