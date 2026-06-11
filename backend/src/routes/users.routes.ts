import { Router } from "express";
import { ok } from "../core/response.js";
import { UserService } from "../services/user.service.js";
import { ReconciliationService } from "../services/reconciliation.service.js";
import { createUserSchema, userIdParamsSchema } from "../schemas/user.schema.js";
import { asyncRoute } from "./helpers.js";

export const userRoutes = Router();
const users = new UserService();
const reconciliation = new ReconciliationService();

userRoutes.post(
  "/users",
  asyncRoute(async (req, res) => {
    const input = createUserSchema.parse(req.body);
    ok(req, res, await users.createUser(input), 201);
  })
);

userRoutes.get(
  "/users/:user_id/assets",
  asyncRoute(async (req, res) => {
    const params = userIdParamsSchema.parse(req.params);
    ok(req, res, await users.getAssets(params.user_id));
  })
);

userRoutes.get(
  "/users/:user_id/deposit-address",
  asyncRoute(async (req, res) => {
    const params = userIdParamsSchema.parse(req.params);
    ok(req, res, await users.getDepositAddress(params.user_id));
  })
);

userRoutes.get(
  "/users/:user_id/proof-of-reserve",
  asyncRoute(async (req, res) => {
    const params = userIdParamsSchema.parse(req.params);
    ok(req, res, await reconciliation.proofForUser(params.user_id));
  })
);
