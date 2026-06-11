import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class ScanStateRepository {
  constructor(private readonly db: DbClient = prisma) {}

  async getOrCreate(chainId: number, requiredConfirmations: number) {
    return this.db.blockScanState.upsert({
      where: { chainId },
      update: {},
      create: {
        chainId,
        lastScannedBlock: 0,
        requiredConfirmations,
        scannerStatus: "idle"
      }
    });
  }

  update(chainId: number, data: { lastScannedBlock?: number; lastScannedBlockHash?: string | null; scannerStatus?: string }) {
    return this.db.blockScanState.update({ where: { chainId }, data });
  }
}
