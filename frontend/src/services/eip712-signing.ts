import type { MultisigApprovalTypedData } from "@/src/types/api";

export async function signMultisigApproval(typedData: MultisigApprovalTypedData, approverAddress: string) {
  if (!window.ethereum) {
    throw new Error("未检测到 MetaMask 钱包");
  }
  const signature = await window.ethereum.request({
    method: "eth_signTypedData_v4",
    params: [approverAddress, JSON.stringify(typedData)]
  });
  return signature as string;
}
