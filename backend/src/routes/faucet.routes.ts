import { Router } from "express";
import { z } from "zod";
import { ok } from "../core/response.js";
import { FaucetService } from "../services/faucet.service.js";
import { atomicAmountSchema, evmAddressSchema } from "../schemas/common.schema.js";
import { asyncRoute } from "./helpers.js";

export const faucetRoutes = Router();
const faucet = new FaucetService();

const faucetSchema = z.object({
  to_address: evmAddressSchema,
  amount: atomicAmountSchema
});

faucetRoutes.post(
  "/faucet/mock-usdt",
  asyncRoute(async (req, res) => {
    const input = faucetSchema.parse(req.body);
    ok(req, res, await faucet.mint(input));
  })
);
