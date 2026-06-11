import { Contract } from "ethers";
import { config } from "../core/config.js";
import { contractsReadOnly, erc20Abi, freshBlockNumber } from "../core/contracts.js";
import { prisma } from "../core/prisma.js";
import { RiskRepository } from "../repositories/risk.repository.js";
import { ScanStateRepository } from "../repositories/scan-state.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { WithdrawalRepository } from "../repositories/withdrawal.repository.js";
import { randomId } from "../utils/id.js";
import { SweepService } from "./sweep.service.js";

export class AdminService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly withdrawals = new WithdrawalRepository(),
    private readonly risks = new RiskRepository(),
    private readonly scanStates = new ScanStateRepository(),
    private readonly sweepService = new SweepService()
  ) {}

  async dashboard() {
    const users = await this.users.list();
    const token = new Contract(config.mockUsdtAddress, erc20Abi, contractsReadOnly().token.runner);
    const hotBalance = config.hotWalletAddress ? ((await token.balanceOf(config.hotWalletAddress)) as bigint).toString() : "0";
    const coldBalance = config.multisigColdWalletAddress
      ? ((await token.balanceOf(config.multisigColdWalletAddress)) as bigint).toString()
      : "0";
    const depositWallets = await this.sweepService.uncollectedBalance();
    return {
      hot_wallet: {
        address: config.hotWalletAddress,
        balance: hotBalance
      },
      cold_wallet: {
        address: config.multisigColdWalletAddress,
        balance: coldBalance
      },
      deposit_wallets: depositWallets,
      ledger: {
        total_user_available: users.reduce((acc, user) => acc + BigInt(user.availableBalance), 0n).toString(),
        total_user_frozen: users.reduce((acc, user) => acc + BigInt(user.frozenBalance), 0n).toString()
      },
      pending_multisig_count: await this.withdrawals.countPendingMultisig(),
      risk_event_count: await this.risks.countEvents()
    };
  }

  async addBlacklist(input: { address: string; reason: string }) {
    const item = await this.risks.addBlacklist({
      id: randomId("bl"),
      address: input.address,
      reason: input.reason
    });
    return {
      address: item.address,
      reason: item.reason,
      created_at: item.createdAt.toISOString()
    };
  }

  async riskEvents(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([this.risks.listEvents(skip, pageSize), this.risks.countEvents()]);
    return {
      items: items.map((item) => ({
        risk_event_id: item.id,
        user_id: item.userId,
        withdrawal_id: item.withdrawalId,
        address: item.address,
        risk_level: item.riskLevel,
        code: item.code,
        message: item.message,
        details: JSON.parse(item.detailsJson),
        created_at: item.createdAt.toISOString()
      })),
      page,
      page_size: pageSize,
      total
    };
  }

  async scanState() {
    const state = await this.scanStates.getOrCreate(config.chainId, config.requiredConfirmations);
    return {
      chain_id: state.chainId,
      last_scanned_block: state.lastScannedBlock,
      latest_block: await freshBlockNumber(),
      required_confirmations: state.requiredConfirmations,
      scanner_status: state.scannerStatus
    };
  }

  async resetDataForLocalDemo() {
    await prisma.$transaction([
      prisma.onchainEvent.deleteMany(),
      prisma.multisigApproval.deleteMany(),
      prisma.reconciliationReport.deleteMany(),
      prisma.riskEvent.deleteMany(),
      prisma.withdrawal.deleteMany(),
      prisma.ledgerEntry.deleteMany(),
      prisma.deposit.deleteMany(),
      prisma.depositAddress.deleteMany(),
      prisma.user.deleteMany(),
      prisma.blacklistAddress.deleteMany(),
      prisma.blockScanState.deleteMany()
    ]);
    return { reset: true };
  }
}
