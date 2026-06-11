// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title AuditAnchor
/// @notice Anchors reconciliation snapshots and Proof of Reserve Merkle roots on-chain.
contract AuditAnchor is Ownable {
    struct Snapshot {
        bytes32 snapshotHash;
        bytes32 merkleRoot;
        string reportUri;
        uint256 anchoredAt;
        address anchoredBy;
    }

    mapping(bytes32 => Snapshot) public snapshots;
    bytes32[] private snapshotHashes;

    event AuditAnchored(
        bytes32 indexed snapshotHash,
        bytes32 indexed merkleRoot,
        string reportUri,
        address indexed anchoredBy
    );

    error EmptyHash();
    error SnapshotAlreadyAnchored();

    constructor(address initialOwner) Ownable(initialOwner) {}

    function anchorSnapshot(bytes32 snapshotHash, bytes32 merkleRoot, string calldata reportUri) external onlyOwner {
        if (snapshotHash == bytes32(0) || merkleRoot == bytes32(0)) revert EmptyHash();
        if (snapshots[snapshotHash].anchoredAt != 0) revert SnapshotAlreadyAnchored();

        snapshots[snapshotHash] = Snapshot({
            snapshotHash: snapshotHash,
            merkleRoot: merkleRoot,
            reportUri: reportUri,
            anchoredAt: block.timestamp,
            anchoredBy: msg.sender
        });
        snapshotHashes.push(snapshotHash);

        emit AuditAnchored(snapshotHash, merkleRoot, reportUri, msg.sender);
    }

    function snapshotCount() external view returns (uint256) {
        return snapshotHashes.length;
    }

    function snapshotHashAt(uint256 index) external view returns (bytes32) {
        return snapshotHashes[index];
    }
}
