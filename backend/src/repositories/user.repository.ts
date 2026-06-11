import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class UserRepository {
  constructor(private readonly db: DbClient = prisma) {}

  findById(userId: string) {
    return this.db.user.findUnique({ where: { id: userId } });
  }

  findByWallet(walletAddress: string) {
    return this.db.user.findUnique({ where: { walletAddress } });
  }

  findByUsername(username: string) {
    return this.db.user.findUnique({ where: { username } });
  }

  list() {
    return this.db.user.findMany({ orderBy: { createdAt: "asc" } });
  }

  create(input: { id: string; username: string; walletAddress: string; userIdHash: string }) {
    return this.db.user.create({ data: input });
  }

  updateBalances(userId: string, availableBalance: string, frozenBalance: string, totals?: { totalDeposit?: string; totalWithdrawal?: string }) {
    return this.db.user.update({
      where: { id: userId },
      data: {
        availableBalance,
        frozenBalance,
        ...(totals?.totalDeposit ? { totalDeposit: totals.totalDeposit } : {}),
        ...(totals?.totalWithdrawal ? { totalWithdrawal: totals.totalWithdrawal } : {})
      }
    });
  }
}
