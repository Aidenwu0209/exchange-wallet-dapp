import type { DbClient } from "./types.js";
import { prisma } from "../core/prisma.js";

export class OnchainEventRepository {
  constructor(private readonly db: DbClient = prisma) {}

  create(input: {
    id: string;
    eventType: string;
    contractAddress: string;
    txHash: string;
    blockNumber: number;
    logIndex: number;
    argsJson: string;
  }) {
    return this.db.onchainEvent.upsert({
      where: { txHash_logIndex_eventType: { txHash: input.txHash, logIndex: input.logIndex, eventType: input.eventType } },
      update: input,
      create: input
    });
  }

  list(eventType: string, skip: number, take: number) {
    return this.db.onchainEvent.findMany({
      where: eventType === "ALL" ? {} : { eventType },
      orderBy: [{ blockNumber: "desc" }, { logIndex: "desc" }],
      skip,
      take
    });
  }

  count(eventType: string) {
    return this.db.onchainEvent.count({ where: eventType === "ALL" ? {} : { eventType } });
  }
}
