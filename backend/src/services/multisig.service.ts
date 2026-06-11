import { contractsWithSigner, getAdminSigner } from "../core/contracts.js";
import { errors } from "../core/errors.js";
import { MultisigRepository } from "../repositories/multisig.repository.js";
import { WithdrawalRepository } from "../repositories/withdrawal.repository.js";
import { normalizeAddress } from "../utils/address.js";
import { randomId } from "../utils/id.js";
import { OnchainEventService } from "./onchain-event.service.js";
import { WithdrawalService } from "./withdrawal.service.js";

export class MultisigService {
  constructor(
    private readonly approvals = new MultisigRepository(),
    private readonly withdrawals = new WithdrawalRepository(),
    private readonly withdrawalService = new WithdrawalService(),
    private readonly events = new OnchainEventService()
  ) {}

  async pending(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.withdrawals.listPendingMultisig(skip, pageSize),
      this.withdrawals.countPendingMultisig()
    ]);
    return {
      items: items.map((item) => ({
        withdrawal_id: item.id,
        user_id: item.userId,
        to_address: item.toAddress,
        amount: item.amount,
        status: item.status,
        risk_level: item.riskLevel,
        risk_reason: item.riskReason,
        multisig_request_id: item.multisigRequestId,
        tx_hash: item.txHash,
        created_at: item.createdAt.toISOString()
      })),
      page,
      page_size: pageSize,
      total
    };
  }

  async approve(withdrawalId: string, approverAddressInput: string) {
    const approverAddress = normalizeAddress(approverAddressInput);
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal || !withdrawal.multisigRequestId) {
      throw errors.validation({ withdrawal_id: "withdrawal not pending multisig" });
    }
    const existing = await this.approvals.findApproval(withdrawal.id, approverAddress);
    if (existing) {
      throw errors.multisigAlreadyApproved();
    }

    const signer = getAdminSigner(approverAddress);
    const { multisig } = contractsWithSigner(signer);
    const tx = await multisig.approve(withdrawal.multisigRequestId);
    const receipt = await tx.wait();
    await this.events.recordReceipt(receipt);

    await this.approvals.createApproval({
      id: randomId("msa"),
      withdrawalId: withdrawal.id,
      multisigRequestId: withdrawal.multisigRequestId,
      approverAddress,
      txHash: receipt?.hash ?? tx.hash
    });

    const request = await multisig.requests(withdrawal.multisigRequestId);
    const approvedCount = Number(request.approvals);
    const threshold = Number(await multisig.threshold());
    return {
      withdrawal_id: withdrawal.id,
      multisig_request_id: withdrawal.multisigRequestId,
      approved_count: approvedCount,
      threshold,
      can_execute: approvedCount >= threshold
    };
  }

  async execute(withdrawalId: string, executorAddressInput?: string) {
    const withdrawal = await this.withdrawals.findById(withdrawalId);
    if (!withdrawal || !withdrawal.multisigRequestId) {
      throw errors.validation({ withdrawal_id: "withdrawal not pending multisig" });
    }
    const approver = executorAddressInput ? normalizeAddress(executorAddressInput) : undefined;
    const signer = approver ? getAdminSigner(approver) : undefined;
    const { multisig } = contractsWithSigner(signer);
    const tx = await multisig.execute(withdrawal.multisigRequestId);
    const receipt = await tx.wait();
    await this.events.recordReceipt(receipt);
    const updated = await this.withdrawalService.markWithdrawalExecuted(withdrawal.id, receipt?.hash ?? tx.hash);
    return {
      withdrawal_id: updated.id,
      status: updated.status,
      tx_hash: updated.txHash
    };
  }
}
