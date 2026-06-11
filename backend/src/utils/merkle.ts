import { keccak256, solidityPacked } from "ethers";
import { combineHashes } from "./hash.js";

export type MerkleLeaf = {
  user_id: string;
  user_id_hash: string;
  asset_symbol: string;
  available_balance: string;
  frozen_balance: string;
  leaf_hash: string;
};

export function createLeaf(input: Omit<MerkleLeaf, "leaf_hash">): MerkleLeaf {
  return {
    ...input,
    leaf_hash: keccak256(
      solidityPacked(
        ["bytes32", "string", "string", "string"],
        [input.user_id_hash, input.asset_symbol, input.available_balance, input.frozen_balance]
      )
    )
  };
}

export function buildMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) {
    return keccak256(new Uint8Array());
  }
  let level = [...leaves].sort();
  while (level.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] ?? left;
      next.push(combineHashes(left, right));
    }
    level = next;
  }
  return level[0];
}

export function buildProof(leaves: string[], targetLeaf: string): string[] {
  let index = [...leaves].sort().findIndex((leaf) => leaf === targetLeaf);
  if (index === -1) {
    return [];
  }

  let level = [...leaves].sort();
  const proof: string[] = [];
  while (level.length > 1) {
    const pairIndex = index % 2 === 0 ? index + 1 : index - 1;
    proof.push(level[pairIndex] ?? level[index]);

    const next: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(combineHashes(level[i], level[i + 1] ?? level[i]));
    }
    index = Math.floor(index / 2);
    level = next;
  }
  return proof;
}

export function verifyProof(leaf: string, proof: string[], root: string): boolean {
  let computed = leaf;
  for (const sibling of proof) {
    computed = combineHashes(computed, sibling);
  }
  return computed.toLowerCase() === root.toLowerCase();
}
