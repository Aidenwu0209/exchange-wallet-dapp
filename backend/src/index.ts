import cors from "cors";
import express from "express";
import { config } from "./core/config.js";
import { logger } from "./core/logger.js";
import { errorHandler, requestIdMiddleware } from "./core/response.js";
import { adminRoutes } from "./routes/admin.routes.js";
import { depositRoutes } from "./routes/deposits.routes.js";
import { faucetRoutes } from "./routes/faucet.routes.js";
import { healthRoutes } from "./routes/health.routes.js";
import { userRoutes } from "./routes/users.routes.js";
import { withdrawalRoutes } from "./routes/withdrawals.routes.js";

const app = express();

app.use(cors());
app.use(express.json());
app.use(requestIdMiddleware);

app.use("/api/v1", healthRoutes);
app.use("/api/v1", userRoutes);
app.use("/api/v1", faucetRoutes);
app.use("/api/v1", depositRoutes);
app.use("/api/v1", withdrawalRoutes);
app.use("/api/v1", adminRoutes);
app.use(errorHandler);

app.listen(config.port, () => {
  logger.info("backend started", {
    port: config.port,
    chain_id: config.chainId,
    rpc_url: config.rpcUrl
  });
});
