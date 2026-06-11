import { contractsReadOnly, freshBlockNumber, provider } from "../core/contracts.js";
import { prisma } from "../core/prisma.js";
import { config } from "../core/config.js";

export class HealthService {
  async getHealth() {
    let latestBlock = 0;
    let chainId = config.chainId;
    let contractsLoaded = false;
    try {
      const network = await provider.getNetwork();
      latestBlock = await freshBlockNumber();
      chainId = Number(network.chainId);
      contractsReadOnly();
      contractsLoaded = true;
    } catch {
      contractsLoaded = false;
    }

    await prisma.$queryRaw`SELECT 1`;

    return {
      service: "exchange-wallet-backend",
      status: "ok",
      chain_id: chainId,
      latest_block: latestBlock,
      database: "ok",
      contracts_loaded: contractsLoaded
    };
  }
}
