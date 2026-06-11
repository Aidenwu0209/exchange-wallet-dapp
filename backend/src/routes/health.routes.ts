import { Router } from "express";
import { ok } from "../core/response.js";
import { HealthService } from "../services/health.service.js";
import { asyncRoute } from "./helpers.js";

export const healthRoutes = Router();
const service = new HealthService();

healthRoutes.get(
  "/health",
  asyncRoute(async (req, res) => {
    ok(req, res, await service.getHealth());
  })
);
