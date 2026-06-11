import { getAddress, id } from "ethers";
import { config } from "../core/config.js";
import { contractsReadOnly, erc20Abi, freshBlockNumber, provider } from "../core/contracts.js";
import { prisma } from "../core/prisma.js";
import { DepositRepository } from "../repositories/deposit.repository.js";
import { LedgerRepository } from "../repositories/ledger.repository.js";
import { ScanStateRepository } from "../repositories/scan-state.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { addAtomic } from "../utils/amount.js";
import { randomId } from "../utils/id.js";
import { OnchainEventService } from "./onchain-event.service.js";

export class DepositService {
  constructor(
    private readonly deposits = new DepositRepository(),
    private readonly scanState = new ScanStateRepository(),
    private readonly events = new OnchainEventService()
  ) {}

  async scan(input: { from_block?: number; to_block: number | "latest" }) {
    const latest = await freshBlockNumber();
    const state = await this.scanState.getOrCreate(config.chainId, config.requiredConfirmations);
    const fromBlock = input.from_block ?? state.lastScannedBlock + 1;
    const toBlock = input.to_block === "latest" ? latest : input.to_block;

    if (toBlock < fromBlock) {
      return {
        scanned_from: fromBlock,
        scanned_to: toBlock,
        detected_events: 0,
        created_deposits: 0,
        duplicate_events: 0
      };
    }

    await this.scanState.update(config.chainId, { scannerStatus: "running" });
    try {
      const addresses = await this.deposits.listAddresses();
      const addressMap = new Map(addresses.map((address) => [address.address.toLowerCase(), address]));
      const transferTopic = id("Transfer(address,address,uint256)");
      const logs = await provider.getLogs({
        address: config.mockUsdtAddress,
        fromBlock,
        toBlock,
        topics: [transferTopic]
      });

      let detectedEvents = 0;
      let createdDeposits = 0;
      let duplicateEvents = 0;
      const token = contractsReadOnly().token;

      for (const log of logs) {
        const parsed = token.interface.parseLog(log);
        const to = getAddress(parsed?.args.to as string);
        const depositAddress = addressMap.get(to.toLowerCase());
        if (!depositAddress) {
          continue;
        }
        detectedEvents += 1;

        const existing = await this.deposits.findDepositEvent(config.chainId, log.transactionHash, log.index);
        if (existing) {
          duplicateEvents += 1;
          continue;
        }

        await this.deposits.createDeposit({
          id: randomId("dep"),
          userId: depositAddress.userId,
          chainId: config.chainId,
          fromAddress: getAddress(parsed?.args.from as string),
          depositAddress: depositAddress.address,
          amount: (parsed?.args.value as bigint).toString(),
          txHash: log.transactionHash,
          logIndex: log.index,
          detectedBlock: log.blockNumber,
          confirmations: Math.max(0, latest - log.blockNumber + 1),
          status: "PENDING"
        });

        await this.events.recordReceipt(await provider.getTransactionReceipt(log.transactionHash));
        createdDeposits += 1;
      }

      const lastBlock = await provider.getBlock(toBlock);
      await this.scanState.update(config.chainId, {
        lastScannedBlock: toBlock,
        lastScannedBlockHash: lastBlock?.hash ?? null,
        scannerStatus: "idle"
      });

      return {
        scanned_from: fromBlock,
        scanned_to: toBlock,
        detected_events: detectedEvents,
        created_deposits: createdDeposits,
        duplicate_events: duplicateEvents
      };
    } catch (error) {
      await this.scanState.update(config.chainId, { scannerStatus: "failed" });
      throw error;
    }
  }

  async confirmPending() {
    const latest = await freshBlockNumber();
    const pending = await this.deposits.pendingDeposits();
    let confirmedCount = 0;
    let pendingCount = 0;

    for (const deposit of pending) {
      const confirmations = Math.max(0, latest - deposit.detectedBlock + 1);
      if (confirmations < config.requiredConfirmations) {
        await this.deposits.updateConfirmation(deposit.id, { status: "PENDING", confirmations });
        pendingCount += 1;
        continue;
      }

      await prisma.$transaction(async (txClient) => {
        const depositRepo = new DepositRepository(txClient);
        const userRepo = new UserRepository(txClient);
        const ledgerRepo = new LedgerRepository(txClient);

        const currentDeposit = await depositRepo.findDepositEvent(deposit.chainId, deposit.txHash, deposit.logIndex);
        if (!currentDeposit || currentDeposit.status === "CONFIRMED") {
          return;
        }

        const user = await userRepo.findById(deposit.userId);
        if (!user) {
          return;
        }
        const availableAfter = addAtomic(user.availableBalance, deposit.amount);
        const totalDeposit = addAtomic(user.totalDeposit, deposit.amount);

        await depositRepo.updateConfirmation(deposit.id, {
          status: "CONFIRMED",
          confirmations,
          confirmedBlock: latest
        });
        await userRepo.updateBalances(user.id, availableAfter, user.frozenBalance, { totalDeposit });
        await ledgerRepo.create({
          id: randomId("le"),
          userId: user.id,
          direction: "CREDIT",
          businessType: "DEPOSIT_CONFIRMED",
          businessId: deposit.id,
          assetSymbol: "MockUSDT",
          amount: deposit.amount,
          availableAfter,
          frozenAfter: user.frozenBalance,
          txHash: deposit.txHash,
          logIndex: deposit.logIndex,
          blockNumber: latest
        });
      });
      confirmedCount += 1;
    }

    return {
      confirmed_count: confirmedCount,
      pending_count: pendingCount,
      required_confirmations: config.requiredConfirmations
    };
  }

  async history(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.deposits.listDeposits(userId, skip, pageSize),
      this.deposits.countDeposits(userId)
    ]);
    return {
      items: items.map((item) => ({
        deposit_id: item.id,
        from_address: item.fromAddress,
        deposit_address: item.depositAddress,
        amount: item.amount,
        tx_hash: item.txHash,
        log_index: item.logIndex,
        detected_block: item.detectedBlock,
        confirmed_block: item.confirmedBlock,
        confirmations: item.confirmations,
        status: item.status,
        created_at: item.createdAt.toISOString()
      })),
      page,
      page_size: pageSize,
      total
    };
  }
}
