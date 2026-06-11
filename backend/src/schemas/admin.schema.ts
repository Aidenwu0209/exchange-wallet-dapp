import { z } from "zod";
import { evmAddressSchema } from "./common.schema.js";

export const sweepSchema = z.object({
  deposit_address: z.union([z.literal("ALL"), evmAddressSchema])
});

export const approvalTypedDataQuerySchema = z.object({
  approver_address: evmAddressSchema
});

export const approveWithdrawalSchema = z
  .object({
    approver_address: evmAddressSchema,
    signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/).optional(),
    deadline: z.string().regex(/^[0-9]+$/).optional()
  })
  .superRefine((value, ctx) => {
    if (Boolean(value.signature) !== Boolean(value.deadline)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["signature"],
        message: "signature and deadline must be provided together"
      });
    }
  });

export const executeWithdrawalSchema = z.object({
  approver_address: evmAddressSchema.optional()
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
