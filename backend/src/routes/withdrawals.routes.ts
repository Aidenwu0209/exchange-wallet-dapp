import { Router } from "express";
import { ok } from "../core/response.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { userIdParamsSchema } from "../schemas/user.schema.js";
import { createWithdrawalSchema, withdrawalIdParamsSchema } from "../schemas/withdrawal.schema.js";
import { WithdrawalService } from "../services/withdrawal.service.js";
import { asyncRoute } from "./helpers.js";

export const withdrawalRoutes = Router();
const withdrawals = new WithdrawalService();

withdrawalRoutes.post(
  "/withdrawals",
  asyncRoute(async (req, res) => {
    const input = createWithdrawalSchema.parse(req.body);
    ok(req, res, await withdrawals.create(input), 201);
  })
);

withdrawalRoutes.get(
  "/withdrawals/:user_id/history",
  asyncRoute(async (req, res) => {
    const params = userIdParamsSchema.parse(req.params);
    const page = paginationSchema.parse(req.query);
    ok(req, res, await withdrawals.history(params.user_id, page.page, page.page_size));
  })
);

withdrawalRoutes.get(
  "/withdrawals/detail/:withdrawal_id",
  asyncRoute(async (req, res) => {
    const params = withdrawalIdParamsSchema.parse(req.params);
    ok(req, res, await withdrawals.detail(params.withdrawal_id));
  })
);
