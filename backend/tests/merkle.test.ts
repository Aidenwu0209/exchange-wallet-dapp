import { describe, expect, it } from "vitest";
import { buildMerkleRoot, buildProof, createLeaf, verifyProof } from "../src/utils/merkle.js";

describe("proof of reserve merkle tree", () => {
  it("builds and verifies a user proof", () => {
    const leaves = [
      createLeaf({
        user_id: "u_001",
        user_id_hash: "0x1111111111111111111111111111111111111111111111111111111111111111",
        asset_symbol: "MockUSDT",
        available_balance: "100",
        frozen_balance: "0"
      }),
      createLeaf({
        user_id: "u_002",
        user_id_hash: "0x2222222222222222222222222222222222222222222222222222222222222222",
        asset_symbol: "MockUSDT",
        available_balance: "50",
        frozen_balance: "10"
      })
    ];
    const hashes = leaves.map((leaf) => leaf.leaf_hash);
    const root = buildMerkleRoot(hashes);
    const proof = buildProof(hashes, leaves[0].leaf_hash);
    expect(verifyProof(leaves[0].leaf_hash, proof, root)).toBe(true);
  });
});
