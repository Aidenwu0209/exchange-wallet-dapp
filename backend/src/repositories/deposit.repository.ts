import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class DepositRepository {
  constructor(private readonly db: DbClient = prisma) {}

  createAddress(input: {
    id: string;
    userId: string;
    chainId: number;
    assetSymbol: string;
    address: string;
    createdTxHash?: string;
  }) {
    return this.db.depositAddress.create({ data: input });
  }

  findAddressByUser(userId: string) {
    return this.db.depositAddress.findFirst({ where: { userId }, orderBy: { createdAt: "desc" } });
  }

  findAddress(address: string) {
    return this.db.depositAddress.findUnique({ where: { address } });
  }

  listAddresses() {
    return this.db.depositAddress.findMany({ orderBy: { createdAt: "asc" } });
  }

  listDeposits(userId: string, skip: number, take: number) {
    return this.db.deposit.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip, take });
  }

  countDeposits(userId: string) {
    return this.db.deposit.count({ where: { userId } });
  }

  findDepositEvent(chainId: number, txHash: string, logIndex: number) {
    return this.db.deposit.findUnique({ where: { chainId_txHash_logIndex: { chainId, txHash, logIndex } } });
  }

  createDeposit(input: {
    id: string;
    userId: string;
    chainId: number;
    fromAddress: string;
    depositAddress: string;
    amount: string;
    txHash: string;
    logIndex: number;
    detectedBlock: number;
    confirmations: number;
    status: string;
  }) {
    return this.db.deposit.create({ data: input });
  }

  pendingDeposits() {
    return this.db.deposit.findMany({ where: { status: "PENDING" }, orderBy: { detectedBlock: "asc" } });
  }

  updateConfirmation(id: string, input: { status: string; confirmations: number; confirmedBlock?: number }) {
    return this.db.deposit.update({ where: { id }, data: input });
  }
}
