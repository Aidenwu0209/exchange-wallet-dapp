import { AbiCoder, concat, getBytes, keccak256, toUtf8Bytes } from "ethers";

export function userHash(userId: string): string {
  return keccak256(toUtf8Bytes(userId));
}

export function businessHash(businessId: string): string {
  return keccak256(toUtf8Bytes(businessId));
}

export function snapshotHash(input: Record<string, string>): string {
  const coder = AbiCoder.defaultAbiCoder();
  return keccak256(
    coder.encode(
      ["string", "string", "string", "string", "string", "string", "string"],
      [
        input.total_user_balance,
        input.total_frozen_balance,
        input.hot_wallet_balance,
        input.cold_wallet_balance,
        input.deposit_wallet_balance,
        input.total_onchain_balance,
        input.merkle_root
      ]
    )
  );
}

export function combineHashes(left: string, right: string): string {
  const [a, b] = [left, right].sort();
  return keccak256(concat([getBytes(a), getBytes(b)]));
}
