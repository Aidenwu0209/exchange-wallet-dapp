import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class RiskRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findBlacklist(address: string) {
    return this.db.blacklistAddress.findUnique({ where: { address } });
  }

  addBlacklist(input: { id: string; address: string; reason: string }) {
    return this.db.blacklistAddress.upsert({
      where: { address: input.address },
      update: { reason: input.reason },
      create: input
    });
  }

  createEvent(input: {
    id: string;
    userId?: string | null;
    withdrawalId?: string | null;
    address?: string | null;
    riskLevel: string;
    code: string;
    message: string;
    detailsJson?: string;
  }) {
    return this.db.riskEvent.create({ data: input });
  }

  listEvents(skip: number, take: number) {
    return this.db.riskEvent.findMany({ orderBy: { createdAt: "desc" }, skip, take });
  }

  countEvents() {
    return this.db.riskEvent.count();
  }
}
