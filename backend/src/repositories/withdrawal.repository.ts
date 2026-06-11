import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class WithdrawalRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(input: {
    id: string;
    userId: string;
    toAddress: string;
    amount: string;
    assetSymbol: string;
    status: string;
    riskLevel: string;
    riskReason?: string | null;
    multisigRequestId?: string | null;
    txHash?: string | null;
  }) {
    return this.db.withdrawal.create({ data: input });
  }

  findById(id: string) {
    return this.db.withdrawal.findUnique({ where: { id } });
  }

  listByUser(userId: string, skip: number, take: number) {
    return this.db.withdrawal.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take });
  }

  countByUser(userId: string) {
    return this.db.withdrawal.count({ where: { userId } });
  }

  listPendingMultisig(skip: number, take: number) {
    return this.db.withdrawal.findMany({ where: { status: "PENDING_MULTISIG" }, orderBy: { createdAt: "asc" }, skip, take });
  }

  countPendingMultisig() {
    return this.db.withdrawal.count({ where: { status: "PENDING_MULTISIG" } });
  }

  update(id: string, data: {
    status?: string;
    txHash?: string | null;
    multisigRequestId?: string | null;
    riskLevel?: string;
    riskReason?: string | null;
  }) {
    return this.db.withdrawal.update({ where: { id }, data });
  }

  recentWithdrawals(userId: string, since: Date) {
    return this.db.withdrawal.count({ where: { userId, createdAt: { gte: since } } });
  }

  dailyWithdrawals(userId: string, since: Date) {
    return this.db.withdrawal.findMany({ where: { userId, createdAt: { gte: since }, status: { not: "RISK_REJECTED" } } });
  }
}
