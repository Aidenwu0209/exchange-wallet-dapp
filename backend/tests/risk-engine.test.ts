import { describe, expect, it } from "vitest";
import { config } from "../src/core/config.js";
import { RiskEngineService } from "../src/services/risk-engine.service.js";

describe("risk engine pure paths", () => {
  it("routes large withdrawals to multisig", async () => {
    const risks = { findBlacklist: async () => null } as never;
    const withdrawals = {
      recentWithdrawals: async () => 0,
      dailyWithdrawals: async () => []
    } as never;
    const service = new RiskEngineService(risks, withdrawals);
    const decision = await service.evaluate({
      user_id: "u_001",
      to_address: "0x0000000000000000000000000000000000000001",
      amount: (BigInt(config.largeWithdrawalThreshold) + 1n).toString(),
      available_balance: (BigInt(config.largeWithdrawalThreshold) + 2n).toString()
    });
    expect(decision.action).toBe("PENDING_MULTISIG");
  });

  it("rejects insufficient balance before normal approval", async () => {
    const risks = { findBlacklist: async () => null } as never;
    const withdrawals = {
      recentWithdrawals: async () => 0,
      dailyWithdrawals: async () => []
    } as never;
    const service = new RiskEngineService(risks, withdrawals);
    const decision = await service.evaluate({
      user_id: "u_001",
      to_address: "0x0000000000000000000000000000000000000001",
      amount: "100",
      available_balance: "99"
    });
    expect(decision.code).toBe("INSUFFICIENT_BALANCE");
  });
});
