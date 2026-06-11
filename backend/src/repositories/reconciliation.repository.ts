import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class ReconciliationRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(input: {
    id: string;
    totalUserBalance: string;
    totalFrozenBalance: string;
    hotWalletBalance: string;
    coldWalletBalance: string;
    depositWalletBalance: string;
    totalOnchainBalance: string;
    diff: string;
    reserveRatio: string;
    merkleRoot: string;
    snapshotHash: string;
    anchorTxHash?: string | null;
    status: string;
    proofJson: string;
  }) {
    return this.db.reconciliationReport.create({ data: input });
  }

  latest() {
    return this.db.reconciliationReport.findFirst({ orderBy: { createdAt: "desc" } });
  }
}
