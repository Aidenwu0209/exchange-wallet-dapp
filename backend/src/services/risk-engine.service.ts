import { config } from "../core/config.js";
import { RiskRepository } from "../repositories/risk.repository.js";
import { WithdrawalRepository } from "../repositories/withdrawal.repository.js";
import { gtAtomic, gteAtomic, sumAtomic } from "../utils/amount.js";

export type RiskDecision = {
  action: "APPROVED" | "PENDING_MULTISIG" | "PENDING_REVIEW" | "REJECTED" | "BLOCKED";
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "BLOCKED";
  code: string;
  message: string;
};

export class RiskEngineService {
  constructor(
    private readonly risks = new RiskRepository(),
    private readonly withdrawals = new WithdrawalRepository()
  ) {}

  async evaluate(input: {
    user_id: string;
    to_address: string;
    amount: string;
    available_balance: string;
  }): Promise<RiskDecision> {
    const blacklisted = await this.risks.findBlacklist(input.to_address);
    if (blacklisted) {
      return {
        action: "BLOCKED",
        risk_level: "BLOCKED",
        code: "BLACKLISTED_ADDRESS",
        message: "目标地址在黑名单中"
      };
    }

    if (!gteAtomic(input.available_balance, input.amount)) {
      return {
        action: "REJECTED",
        risk_level: "HIGH",
        code: "INSUFFICIENT_BALANCE",
        message: "可用余额不足"
      };
    }

    if (gtAtomic(input.amount, config.largeWithdrawalThreshold)) {
      return {
        action: "PENDING_MULTISIG",
        risk_level: "HIGH",
        code: "MULTISIG_APPROVAL_REQUIRED",
        message: "单笔提现超过大额阈值，需要多签审批"
      };
    }

    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const recentCount = await this.withdrawals.recentWithdrawals(input.user_id, tenMinutesAgo);
    if (recentCount >= config.frequentWithdrawalLimit) {
      return {
        action: "PENDING_REVIEW",
        risk_level: "MEDIUM",
        code: "WITHDRAWAL_TOO_FREQUENT",
        message: "10 分钟内提现次数超过限制，需要人工复核"
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWithdrawals = await this.withdrawals.dailyWithdrawals(input.user_id, today);
    const todayTotal = sumAtomic(todayWithdrawals.map((item) => item.amount));
    if (gtAtomic((BigInt(todayTotal) + BigInt(input.amount)).toString(), config.dailyWithdrawalLimit)) {
      return {
        action: "PENDING_REVIEW",
        risk_level: "MEDIUM",
        code: "WITHDRAWAL_LIMIT_EXCEEDED",
        message: "当日累计提现超过限额，需要人工复核"
      };
    }

    return {
      action: "APPROVED",
      risk_level: "LOW",
      code: "APPROVED",
      message: "风控通过"
    };
  }
}
