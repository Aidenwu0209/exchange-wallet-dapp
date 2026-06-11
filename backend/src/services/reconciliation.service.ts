import { Contract } from "ethers";
import { config } from "../core/config.js";
import { contractsReadOnly, contractsWithSigner, erc20Abi } from "../core/contracts.js";
import { errors } from "../core/errors.js";
import { DepositRepository } from "../repositories/deposit.repository.js";
import { ReconciliationRepository } from "../repositories/reconciliation.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { addAtomic, ratioDecimal, subAtomic, sumAtomic } from "../utils/amount.js";
import { createLeaf, buildMerkleRoot, buildProof, verifyProof, type MerkleLeaf } from "../utils/merkle.js";
import { randomId } from "../utils/id.js";
import { snapshotHash as makeSnapshotHash } from "../utils/hash.js";
import { OnchainEventService } from "./onchain-event.service.js";

export class ReconciliationService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly deposits = new DepositRepository(),
    private readonly reports = new ReconciliationRepository(),
    private readonly events = new OnchainEventService()
  ) {}

  async reconcile() {
    const users = await this.users.list();
    const depositAddresses = await this.deposits.listAddresses();
    const readOnly = contractsReadOnly();
    const token = new Contract(config.mockUsdtAddress, erc20Abi, readOnly.token.runner);

    const totalUserBalance = sumAtomic(users.map((user) => user.availableBalance));
    const totalFrozenBalance = sumAtomic(users.map((user) => user.frozenBalance));
    const liabilities = addAtomic(totalUserBalance, totalFrozenBalance);
    const hotWalletBalance = ((await token.balanceOf(config.hotWalletAddress)) as bigint).toString();
    const coldWalletBalance = ((await token.balanceOf(config.multisigColdWalletAddress)) as bigint).toString();

    let depositWalletBalance = 0n;
    for (const address of depositAddresses) {
      depositWalletBalance += (await token.balanceOf(address.address)) as bigint;
    }
    const depositWalletBalanceString = depositWalletBalance.toString();
    const totalOnchainBalance = sumAtomic([hotWalletBalance, coldWalletBalance, depositWalletBalanceString]);
    const diff =
      BigInt(totalOnchainBalance) >= BigInt(liabilities)
        ? subAtomic(totalOnchainBalance, liabilities)
        : `-${subAtomic(liabilities, totalOnchainBalance)}`;

    const leaves: MerkleLeaf[] = users.map((user) =>
      createLeaf({
        user_id: user.id,
        user_id_hash: user.userIdHash,
        asset_symbol: "MockUSDT",
        available_balance: user.availableBalance,
        frozen_balance: user.frozenBalance
      })
    );
    const merkleRoot = buildMerkleRoot(leaves.map((leaf) => leaf.leaf_hash));
    const snapshotHash = makeSnapshotHash({
      total_user_balance: totalUserBalance,
      total_frozen_balance: totalFrozenBalance,
      hot_wallet_balance: hotWalletBalance,
      cold_wallet_balance: coldWalletBalance,
      deposit_wallet_balance: depositWalletBalanceString,
      total_onchain_balance: totalOnchainBalance,
      merkle_root: merkleRoot
    });

    const { auditAnchor } = contractsWithSigner();
    const tx = await auditAnchor.anchorSnapshot(snapshotHash, merkleRoot, `local://reports/${snapshotHash}`);
    const receipt = await tx.wait();
    await this.events.recordReceipt(receipt);

    const status = diff === "0" ? "ANCHORED" : "MISMATCHED";
    const report = await this.reports.create({
      id: randomId("rec"),
      totalUserBalance,
      totalFrozenBalance,
      hotWalletBalance,
      coldWalletBalance,
      depositWalletBalance: depositWalletBalanceString,
      totalOnchainBalance,
      diff,
      reserveRatio: ratioDecimal(totalOnchainBalance, liabilities),
      merkleRoot,
      snapshotHash,
      anchorTxHash: receipt?.hash ?? tx.hash,
      status,
      proofJson: JSON.stringify(leaves)
    });

    return this.reportResponse(report);
  }

  async latest() {
    const report = await this.reports.latest();
    if (!report) {
      throw errors.reconciliation("尚未生成对账报告");
    }
    return this.reportResponse(report);
  }

  async proofForUser(userId: string) {
    const [user, report] = await Promise.all([this.users.findById(userId), this.reports.latest()]);
    if (!user) {
      throw errors.userNotFound(userId);
    }
    if (!report) {
      throw errors.reconciliation("尚未生成储备金证明");
    }
    const leaves = JSON.parse(report.proofJson) as MerkleLeaf[];
    const leaf = leaves.find((item) => item.user_id === user.id);
    if (!leaf) {
      throw errors.reconciliation("当前用户不在最新储备金证明中");
    }
    const allLeaves = leaves.map((item) => item.leaf_hash);
    const proof = buildProof(allLeaves, leaf.leaf_hash);
    return {
      user_id: user.id,
      user_id_hash: user.userIdHash,
      asset_symbol: "MockUSDT",
      available_balance: user.availableBalance,
      frozen_balance: user.frozenBalance,
      leaf_hash: leaf.leaf_hash,
      merkle_root: report.merkleRoot,
      proof,
      snapshot_hash: report.snapshotHash,
      verified: verifyProof(leaf.leaf_hash, proof, report.merkleRoot)
    };
  }

  private reportResponse(report: Awaited<ReturnType<ReconciliationRepository["latest"]>>) {
    if (!report) {
      throw errors.reconciliation("对账报告不存在");
    }
    return {
      report_id: report.id,
      total_user_balance: report.totalUserBalance,
      total_frozen_balance: report.totalFrozenBalance,
      hot_wallet_balance: report.hotWalletBalance,
      cold_wallet_balance: report.coldWalletBalance,
      deposit_wallet_balance: report.depositWalletBalance,
      total_onchain_balance: report.totalOnchainBalance,
      diff: report.diff,
      reserve_ratio: report.reserveRatio,
      merkle_root: report.merkleRoot,
      snapshot_hash: report.snapshotHash,
      anchor_tx_hash: report.anchorTxHash,
      status: report.status,
      created_at: report.createdAt.toISOString()
    };
  }
}
