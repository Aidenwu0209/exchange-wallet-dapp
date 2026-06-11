import { Router } from "express";
import { ok } from "../core/response.js";
import { paginationSchema } from "../schemas/common.schema.js";
import { approveWithdrawalSchema, blacklistSchema, onchainEventsQuerySchema, sweepSchema } from "../schemas/admin.schema.js";
import { withdrawalIdParamsSchema } from "../schemas/withdrawal.schema.js";
import { AdminService } from "../services/admin.service.js";
import { MultisigService } from "../services/multisig.service.js";
import { OnchainEventService } from "../services/onchain-event.service.js";
import { ReconciliationService } from "../services/reconciliation.service.js";
import { SweepService } from "../services/sweep.service.js";
import { asyncRoute } from "./helpers.js";

export const adminRoutes = Router();
const admin = new AdminService();
const sweep = new SweepService();
const multisig = new MultisigService();
const reconciliation = new ReconciliationService();
const onchain = new OnchainEventService();

adminRoutes.get(
  "/admin/dashboard",
  asyncRoute(async (req, res) => {
    ok(req, res, await admin.dashboard());
  })
);

adminRoutes.post(
  "/admin/sweep",
  asyncRoute(async (req, res) => {
    ok(req, res, await sweep.sweep(sweepSchema.parse(req.body)));
  })
);

adminRoutes.get(
  "/admin/pending-withdrawals",
  asyncRoute(async (req, res) => {
    const page = paginationSchema.parse(req.query);
    ok(req, res, await multisig.pending(page.page, page.page_size));
  })
);

adminRoutes.post(
  "/admin/withdrawals/:withdrawal_id/approve",
  asyncRoute(async (req, res) => {
    const params = withdrawalIdParamsSchema.parse(req.params);
    const input = approveWithdrawalSchema.parse(req.body);
    ok(req, res, await multisig.approve(params.withdrawal_id, input.approver_address));
  })
);

adminRoutes.post(
  "/admin/withdrawals/:withdrawal_id/execute",
  asyncRoute(async (req, res) => {
    const params = withdrawalIdParamsSchema.parse(req.params);
    const input = approveWithdrawalSchema.partial().parse(req.body ?? {});
    ok(req, res, await multisig.execute(params.withdrawal_id, input.approver_address));
  })
);

adminRoutes.post(
  "/admin/blacklist",
  asyncRoute(async (req, res) => {
    ok(req, res, await admin.addBlacklist(blacklistSchema.parse(req.body)), 201);
  })
);

adminRoutes.get(
  "/admin/risk-events",
  asyncRoute(async (req, res) => {
    const page = paginationSchema.parse(req.query);
    ok(req, res, await admin.riskEvents(page.page, page.page_size));
  })
);

adminRoutes.post(
  "/admin/reconcile",
  asyncRoute(async (req, res) => {
    ok(req, res, await reconciliation.reconcile());
  })
);

adminRoutes.get(
  "/admin/reconcile/latest",
  asyncRoute(async (req, res) => {
    ok(req, res, await reconciliation.latest());
  })
);

adminRoutes.get(
  "/admin/onchain-events",
  asyncRoute(async (req, res) => {
    const page = paginationSchema.parse(req.query);
    const filter = onchainEventsQuerySchema.parse(req.query);
    ok(req, res, await onchain.list(filter.event_type, page.page, page.page_size));
  })
);

adminRoutes.get(
  "/admin/block-scan-state",
  asyncRoute(async (req, res) => {
    ok(req, res, await admin.scanState());
  })
);

adminRoutes.post(
  "/admin/local-reset",
  asyncRoute(async (req, res) => {
    ok(req, res, await admin.resetDataForLocalDemo());
  })
);
