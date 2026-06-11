import { z } from "zod";
import { evmAddressSchema } from "./common.schema.js";

export const createUserSchema = z.object({
  username: z.string().min(1).max(64),
  wallet_address: evmAddressSchema
});

export const userIdParamsSchema = z.object({
  user_id: z.string().min(1)
});
