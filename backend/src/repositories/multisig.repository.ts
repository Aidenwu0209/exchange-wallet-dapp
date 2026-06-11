import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class MultisigRepository {
  constructor(private readonly db: DbClient = prisma) {}

  createApproval(input: {
    id: string;
    withdrawalId: string;
    multisigRequestId: string;
    approverAddress: string;
    txHash?: string | null;
  }) {
    return this.db.multisigApproval.create({ data: input });
  }

  findApproval(withdrawalId: string, approverAddress: string) {
    return this.db.multisigApproval.findUnique({
      where: { withdrawalId_approverAddress: { withdrawalId, approverAddress } }
    });
  }

  countApprovals(withdrawalId: string) {
    return this.db.multisigApproval.count({ where: { withdrawalId } });
  }
}
