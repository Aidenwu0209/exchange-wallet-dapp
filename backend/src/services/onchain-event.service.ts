import type { ContractTransactionReceipt, Log, TransactionReceipt } from "ethers";
import { parseKnownLog } from "../core/contracts.js";
import { OnchainEventRepository } from "../repositories/onchain-event.repository.js";
import { randomId } from "../utils/id.js";

function eventType(name: string) {
  const map: Record<string, string> = {
    Transfer: "TRANSFER",
    DepositWalletCreated: "DEPOSIT_WALLET_CREATED",
    Swept: "SWEPT",
    WithdrawalSubmitted: "WITHDRAWAL_SUBMITTED",
    WithdrawalApproved: "WITHDRAWAL_APPROVED",
    WithdrawalExecuted: "WITHDRAWAL_EXECUTED",
    AuditAnchored: "AUDIT_ANCHORED"
  };
  return map[name] ?? name.toUpperCase();
}

function stringifyArgs(log: Log) {
  const parsed = parseKnownLog(log);
  if (!parsed) {
    return null;
  }
  const args: Record<string, string> = {};
  parsed.fragment.inputs.forEach((input, index) => {
    const raw = parsed.args[index];
    args[input.name || String(index)] = typeof raw === "bigint" ? raw.toString() : String(raw);
  });
  return {
    event_type: eventType(parsed.name),
    args
  };
}

export class OnchainEventService {
  constructor(private readonly repo = new OnchainEventRepository()) {}

  async recordReceipt(receipt: ContractTransactionReceipt | TransactionReceipt | null) {
    if (!receipt) {
      return;
    }
    for (const log of receipt.logs) {
      const parsed = stringifyArgs(log);
      if (!parsed) {
        continue;
      }
      await this.repo.create({
        id: randomId("evt"),
        eventType: parsed.event_type,
        contractAddress: log.address,
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        logIndex: log.index,
        argsJson: JSON.stringify(parsed.args)
      });
    }
  }

  async list(eventTypeFilter: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.repo.list(eventTypeFilter, skip, pageSize),
      this.repo.count(eventTypeFilter)
    ]);
    return {
      items: items.map((item) => ({
        event_type: item.eventType,
        contract_address: item.contractAddress,
        tx_hash: item.txHash,
        block_number: item.blockNumber,
        log_index: item.logIndex,
        args: JSON.parse(item.argsJson)
      })),
      page,
      page_size: pageSize,
      total
    };
  }
}
