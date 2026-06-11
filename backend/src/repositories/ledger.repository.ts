import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class LedgerRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(input: {
    id: string;
    userId: string;
    direction: string;
    businessType: string;
    businessId: string;
    assetSymbol: string;
    amount: string;
    availableAfter: string;
    frozenAfter: string;
    txHash?: string;
    logIndex?: number;
    blockNumber?: number;
  }) {
    return this.db.ledgerEntry.create({ data: input });
  }

  listByUser(userId: string, skip = 0, take = 20) {
    return this.db.ledgerEntry.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take });
  }
}
