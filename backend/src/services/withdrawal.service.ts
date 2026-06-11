import { contractsWithSigner, getAdminSigner, txMeta } from "../core/contracts.js";
import type { Log, LogDescription } from "ethers";
import { config } from "../core/config.js";
import { errors } from "../core/errors.js";
import { prisma } from "../core/prisma.js";
import { LedgerRepository } from "../repositories/ledger.repository.js";
import { RiskRepository } from "../repositories/risk.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { WithdrawalRepository } from "../repositories/withdrawal.repository.js";
import { addAtomic, subAtomic } from "../utils/amount.js";
import { normalizeAddress } from "../utils/address.js";
import { businessHash } from "../utils/hash.js";
import { randomId } from "../utils/id.js";
import { OnchainEventService } from "./onchain-event.service.js";
import { RiskEngineService } from "./risk-engine.service.js";

export class WithdrawalService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly withdrawals = new WithdrawalRepository(),
    private readonly risks = new RiskRepository(),
    private readonly riskEngine = new RiskEngineService(),
    private readonly events = new OnchainEventService()
  ) {}

  async create(input: { user_id: string; to_address: string; amount: string; asset_symbol: string }) {
    const user = await this.users.findById(input.user_id);
    if (!user) {
      throw errors.userNotFound(input.user_id);
    }
    const toAddress = normalizeAddress(input.to_address);
    const withdrawalId = randomId("wd");
    const decision = await this.riskEngine.evaluate({
      user_id: user.id,
      to_address: toAddress,
      amount: input.amount,
      available_balance: user.availableBalance
    });

    if (decision.action === "BLOCKED" || decision.action === "REJECTED") {
      await this.risks.createEvent({
        id: randomId("risk"),
        userId: user.id,
        withdrawalId,
        address: toAddress,
        riskLevel: decision.risk_level,
        code: decision.code,
        message: decision.message,
        detailsJson: JSON.stringify({ amount: input.amount, available: user.availableBalance })
      });
      await this.withdrawals.create({
        id: withdrawalId,
        userId: user.id,
        toAddress,
        amount: input.amount,
        assetSymbol: input.asset_symbol,
        status: "RISK_REJECTED",
        riskLevel: decision.risk_level,
        riskReason: decision.message
      });
      if (decision.code === "INSUFFICIENT_BALANCE") {
        throw errors.insufficientBalance(user.availableBalance, input.amount);
      }
      throw errors.blacklisted(toAddress);
    }

    if (decision.action === "PENDING_REVIEW") {
      await this.risks.createEvent({
        id: randomId("risk"),
        userId: user.id,
        withdrawalId,
        address: toAddress,
        riskLevel: decision.risk_level,
        code: decision.code,
        message: decision.message
      });
      const withdrawal = await this.freezeAndCreateWithdrawal({
        withdrawalId,
        user,
        toAddress,
        amount: input.amount,
        assetSymbol: input.asset_symbol,
        status: "PENDING_REVIEW",
        riskLevel: decision.risk_level,
        riskReason: decision.message
      });
      return this.withdrawalResponse(withdrawal);
    }

    if (decision.action === "PENDING_MULTISIG") {
      await this.risks.createEvent({
        id: randomId("risk"),
        userId: user.id,
        withdrawalId,
        address: toAddress,
        riskLevel: decision.risk_level,
        code: decision.code,
        message: decision.message
      });
      const withdrawal = await this.freezeAndCreateWithdrawal({
        withdrawalId,
        user,
        toAddress,
        amount: input.amount,
        assetSymbol: input.asset_symbol,
        status: "PENDING_MULTISIG",
        riskLevel: decision.risk_level,
        riskReason: decision.message
      });

      const signer = config.adminAddresses[0] ? getAdminSigner(config.adminAddresses[0]) : undefined;
      const { multisig } = contractsWithSigner(signer);
      const tx = await multisig.submitWithdrawal(businessHash(withdrawal.id), config.mockUsdtAddress, toAddress, input.amount);
      const receipt = await tx.wait();
      await this.events.recordReceipt(receipt);
      const submitted = receipt?.logs
        .map((log: Log) => {
          try {
            return multisig.interface.parseLog(log);
          } catch {
            return null;
          }
        })
        .find((parsed: LogDescription | null) => parsed?.name === "WithdrawalSubmitted");
      const requestId = submitted?.args.requestId?.toString();
      const updated = await this.withdrawals.update(withdrawal.id, { multisigRequestId: requestId ?? null });
      return this.withdrawalResponse(updated);
    }

    const frozen = await this.freezeAndCreateWithdrawal({
      withdrawalId,
      user,
      toAddress,
      amount: input.amount,
      assetSymbol: input.asset_symbol,
      status: "APPROVED",
      riskLevel: decision.risk_level,
      riskReason: null
    });

    try {
      const { token } = contractsWithSigner();
      const tx = await token.transfer(toAddress, input.amount);
      const receipt = await tx.wait();
      await this.events.recordReceipt(receipt);
      const meta = await txMeta(receipt);
      const confirmed = await this.markWithdrawalExecuted(frozen.id, meta.tx_hash);
      return this.withdrawalResponse(confirmed);
    } catch (error) {
      await this.rollbackFrozenWithdrawal(frozen.id);
      throw error;
    }
  }

  private async freezeAndCreateWithdrawal(input: {
    withdrawalId: string;
    user: Awaited<ReturnType<UserRepository["findById"]>>;
    toAddress: string;
    amount: string;
    assetSymbol: string;
    status: string;
    riskLevel: string;
    riskReason: string | null;
  }) {
    if (!input.user) {
      throw errors.userNotFound("");
    }
    const user = input.user;
    return prisma.$transaction(async (txClient) => {
      const userRepo = new UserRepository(txClient);
      const withdrawalRepo = new WithdrawalRepository(txClient);
      const ledgerRepo = new LedgerRepository(txClient);

      const availableAfter = subAtomic(user.availableBalance, input.amount);
      const frozenAfter = addAtomic(user.frozenBalance, input.amount);
      const withdrawal = await withdrawalRepo.create({
        id: input.withdrawalId,
        userId: user.id,
        toAddress: input.toAddress,
        amount: input.amount,
        assetSymbol: input.assetSymbol,
        status: input.status,
        riskLevel: input.riskLevel,
        riskReason: input.riskReason
      });
      await userRepo.updateBalances(user.id, availableAfter, frozenAfter);
      await ledgerRepo.create({
        id: randomId("le"),
        userId: user.id,
        direction: "FREEZE",
        businessType: "WITHDRAWAL_REQUESTED",
        businessId: withdrawal.id,
        assetSymbol: input.assetSymbol,
        amount: input.amount,
        availableAfter,
        frozenAfter
      });
      return withdrawal;
    });
  }

  async markWithdrawalExecuted(withdrawalId: string, txHash: string) {
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) {
      throw errors.validation({ withdrawal_id: "not found" });
    }
    const user = await this.users.findById(withdrawal.userId);
    if (!user) {
      throw errors.userNotFound(withdrawal.userId);
    }

    return prisma.$transaction(async (txClient) => {
      const userRepo = new UserRepository(txClient);
      const withdrawalRepo = new WithdrawalRepository(txClient);
      const ledgerRepo = new LedgerRepository(txClient);

      const frozenAfter = subAtomic(user.frozenBalance, withdrawal.amount);
      const totalWithdrawal = addAtomic(user.totalWithdrawal, withdrawal.amount);
      await userRepo.updateBalances(user.id, user.availableBalance, frozenAfter, { totalWithdrawal });
      const updated = await withdrawalRepo.update(withdrawal.id, { status: "CONFIRMED", txHash });
      await ledgerRepo.create({
        id: randomId("le"),
        userId: user.id,
        direction: "DEBIT",
        businessType: "WITHDRAWAL_EXECUTED",
        businessId: withdrawal.id,
        assetSymbol: withdrawal.assetSymbol,
        amount: withdrawal.amount,
        availableAfter: user.availableBalance,
        frozenAfter,
        txHash
      });
      return updated;
    });
  }

  private async rollbackFrozenWithdrawal(withdrawalId: string) {
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) {
      return;
    }
    const user = await this.users.findById(withdrawal.userId);
    if (!user) {
      return;
    }
    await prisma.$transaction(async (txClient) => {
      const userRepo = new UserRepository(txClient);
      const withdrawalRepo = new WithdrawalRepository(txClient);
      const ledgerRepo = new LedgerRepository(txClient);
      const availableAfter = addAtomic(user.availableBalance, withdrawal.amount);
      const frozenAfter = subAtomic(user.frozenBalance, withdrawal.amount);
      await userRepo.updateBalances(user.id, availableAfter, frozenAfter);
      await withdrawalRepo.update(withdrawal.id, { status: "FAILED" });
      await ledgerRepo.create({
        id: randomId("le"),
        userId: user.id,
        direction: "UNFREEZE",
        businessType: "WITHDRAWAL_REJECTED",
        businessId: withdrawal.id,
        assetSymbol: withdrawal.assetSymbol,
        amount: withdrawal.amount,
        availableAfter,
        frozenAfter
      });
    });
  }

  async history(userId: string, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.withdrawals.listByUser(userId, skip, pageSize),
      this.withdrawals.countByUser(userId)
    ]);
    return {
      items: items.map((item) => this.withdrawalResponse(item)),
      page,
      page_size: pageSize,
      total
    };
  }

  async detail(withdrawalId: string) {
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal) {
      throw errors.validation({ withdrawal_id: "not found" });
    }
    return this.withdrawalResponse(withdrawal);
  }

  private withdrawalResponse(withdrawal: Awaited<ReturnType<WithdrawalRepository["findById"]>>) {
    if (!withdrawal) {
      throw errors.validation({ withdrawal_id: "not found" });
    }
    return {
      withdrawal_id: withdrawal.id,
      user_id: withdrawal.userId,
      to_address: withdrawal.toAddress,
      amount: withdrawal.amount,
      asset_symbol: withdrawal.assetSymbol,
      status: withdrawal.status,
      risk_level: withdrawal.riskLevel,
      risk_reason: withdrawal.riskReason,
      tx_hash: withdrawal.txHash,
      multisig_request_id: withdrawal.multisigRequestId,
      created_at: withdrawal.createdAt.toISOString()
    };
  }
}
