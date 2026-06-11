import { Router } from "express";
import { ok } from "../core/response.js";
import { DepositService } from "../services/deposit.service.js";
import { scanDepositsSchema } from "../schemas/deposit.schema.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { userIdParamsSchema } from "../schemas/user.schema.js";
import { asyncRoute } from "./helpers.js";

export const depositRoutes = Router();
const deposits = new DepositService();

depositRoutes.post(
  "/deposits/scan",
  asyncRoute(async (req, res) => {
    ok(req, res, await deposits.scan(scanDepositsSchema.parse(req.body)));
  })
);

depositRoutes.post(
  "/deposits/confirm",
  asyncRoute(async (req, res) => {
    ok(req, res, await deposits.confirmPending());
  })
);

depositRoutes.get(
  "/deposits/:user_id/history",
  asyncRoute(async (req, res) => {
    const params = userIdParamsSchema.parse(req.params);
    const page = paginationSchema.parse(req.query);
    ok(req, res, await deposits.history(params.user_id, page.page, page.page_size));
  })
);
