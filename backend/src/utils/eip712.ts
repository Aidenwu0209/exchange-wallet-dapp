import { getAddress, verifyTypedData, type TypedDataDomain, type TypedDataField } from "ethers";

export const MULTISIG_APPROVAL_PRIMARY_TYPE = "MultisigApproval" as const;
export const MULTISIG_APPROVAL_ACTION = "APPROVE_WITHDRAWAL" as const;

export type MultisigApprovalMessage = {
  withdrawal_id: string;
  multisig_request_id: string;
  approver: string;
  token: string;
  to: string;
  amount: string;
  deadline: string;
  action: typeof MULTISIG_APPROVAL_ACTION;
};

export type MultisigApprovalTypedData = {
  domain: TypedDataDomain;
  types: Record<typeof MULTISIG_APPROVAL_PRIMARY_TYPE, TypedDataField[]>;
  primaryType: typeof MULTISIG_APPROVAL_PRIMARY_TYPE;
  message: MultisigApprovalMessage;
};

export type BuildMultisigApprovalTypedDataInput = {
  chainId: number;
  verifyingContract: string;
  token: string;
  withdrawalId: string;
  multisigRequestId: string;
  approverAddress: string;
  toAddress: string;
  amount: string;
  deadline: string;
};

export function buildMultisigApprovalTypedData(input: BuildMultisigApprovalTypedDataInput): MultisigApprovalTypedData {
  return {
    domain: {
      name: "ExchangeWalletMultisigApproval",
      version: "1",
      chainId: input.chainId,
      verifyingContract: getAddress(input.verifyingContract)
    },
    types: {
      MultisigApproval: [
        { name: "withdrawal_id", type: "string" },
        { name: "multisig_request_id", type: "uint256" },
        { name: "approver", type: "address" },
        { name: "token", type: "address" },
        { name: "to", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "deadline", type: "uint256" },
        { name: "action", type: "string" }
      ]
    },
    primaryType: MULTISIG_APPROVAL_PRIMARY_TYPE,
    message: {
      withdrawal_id: input.withdrawalId,
      multisig_request_id: input.multisigRequestId,
      approver: getAddress(input.approverAddress),
      token: getAddress(input.token),
      to: getAddress(input.toAddress),
      amount: input.amount,
      deadline: input.deadline,
      action: MULTISIG_APPROVAL_ACTION
    }
  };
}

export function recoverMultisigApprovalSigner(typedData: MultisigApprovalTypedData, signature: string) {
  return getAddress(verifyTypedData(typedData.domain, typedData.types, typedData.message, signature));
}

export function isApprovalExpired(deadline: string, nowSeconds = Math.floor(Date.now() / 1000)) {
  return BigInt(deadline) < BigInt(nowSeconds);
}
