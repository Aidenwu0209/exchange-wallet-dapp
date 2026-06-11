import { Wallet } from "ethers";
import { describe, expect, it } from "vitest";
import {
  buildMultisigApprovalTypedData,
  isApprovalExpired,
  recoverMultisigApprovalSigner
} from "../src/utils/eip712.js";

describe("multisig EIP-712 approval signatures", () => {
  it("recovers the approver from typed approval data", async () => {
    const approver = Wallet.createRandom();
    const typedData = buildMultisigApprovalTypedData({
      chainId: 31337,
      verifyingContract: "0x0000000000000000000000000000000000001000",
      token: "0x0000000000000000000000000000000000002000",
      withdrawalId: "wd_001",
      multisigRequestId: "7",
      approverAddress: approver.address,
      toAddress: "0x0000000000000000000000000000000000003000",
      amount: "1000000000000000000",
      deadline: "4102444800"
    });

    const signature = await approver.signTypedData(typedData.domain, typedData.types, typedData.message);

    expect(recoverMultisigApprovalSigner(typedData, signature)).toBe(approver.address);
  });

  it("changes the recovered signer when approval data is tampered", async () => {
    const approver = Wallet.createRandom();
    const typedData = buildMultisigApprovalTypedData({
      chainId: 31337,
      verifyingContract: "0x0000000000000000000000000000000000001000",
      token: "0x0000000000000000000000000000000000002000",
      withdrawalId: "wd_001",
      multisigRequestId: "7",
      approverAddress: approver.address,
      toAddress: "0x0000000000000000000000000000000000003000",
      amount: "1000000000000000000",
      deadline: "4102444800"
    });
    const signature = await approver.signTypedData(typedData.domain, typedData.types, typedData.message);

    const tampered = {
      ...typedData,
      message: { ...typedData.message, amount: "2000000000000000000" }
    };

    expect(recoverMultisigApprovalSigner(tampered, signature)).not.toBe(approver.address);
  });

  it("detects expired approval deadlines", () => {
    expect(isApprovalExpired("99", 100)).toBe(true);
    expect(isApprovalExpired("100", 100)).toBe(false);
  });
});
