import { z } from "zod";
import { evmAddressSchema } from "./common.schema.js";

export const sweepSchema = z.object({
  deposit_address: z.union([z.literal("ALL"), evmAddressSchema])
});

export const approveWithdrawalSchema = z.object({
  approver_address: evmAddressSchema,
  signature: z.string().optional()
});

export const blacklistSchema = z.object({
  address: evmAddressSchema,
  reason: z.string().min(1).max(200)
});

export const onchainEventsQuerySchema = z.object({
  event_type: z
    .enum([
      "ALL",
      "TRANSFER",
      "DEPOSIT_WALLET_CREATED",
      "SWEPT",
      "WITHDRAWAL_SUBMITTED",
      "WITHDRAWAL_APPROVED",
      "WITHDRAWAL_EXECUTED",
      "AUDIT_ANCHORED"
    ])
    .default("ALL")
});
