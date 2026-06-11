// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {DepositWalletFactory} from "../src/DepositWalletFactory.sol";
import {MultiSigColdWallet} from "../src/MultiSigColdWallet.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";
import {DepositWallet} from "../src/DepositWallet.sol";

contract ExchangeWalletContractsTest is Test {
    MockUSDT private token;
    DepositWalletFactory private factory;
    MultiSigColdWallet private coldWallet;
    AuditAnchor private auditAnchor;

    address private owner = address(0xA11CE);
    address private hotWallet = address(0xBEEF);
    address private admin1 = address(0x1001);
    address private admin2 = address(0x1002);
    address private admin3 = address(0x1003);
    address private userRecipient = address(0xCAFE);

    function setUp() public {
        vm.startPrank(owner);
        token = new MockUSDT(owner);
        factory = new DepositWalletFactory(owner, hotWallet);

        address[] memory owners = new address[](3);
        owners[0] = admin1;
        owners[1] = admin2;
        owners[2] = admin3;
        coldWallet = new MultiSigColdWallet(owners, 2);
        auditAnchor = new AuditAnchor(owner);
        vm.stopPrank();
    }

    function testMockUsdtMintAndTransfer() public {
        vm.prank(owner);
        token.mint(address(this), 100 ether);

        assertTrue(token.transfer(userRecipient, 25 ether));
        assertEq(token.balanceOf(userRecipient), 25 ether);
        assertEq(token.balanceOf(address(this)), 75 ether);
    }

    function testFactoryCreatesWalletAndSweepsWithPermission() public {
        bytes32 userHash = keccak256("u_001");

        vm.prank(owner);
        address wallet = factory.createWallet(userHash);
        assertEq(factory.walletOfUserHash(userHash), wallet);
        assertEq(DepositWallet(wallet).userIdHash(), userHash);

        vm.prank(owner);
        token.mint(wallet, 50 ether);

        vm.prank(address(0xBAD));
        vm.expectRevert(DepositWallet.OnlyFactory.selector);
        DepositWallet(wallet).sweep(address(token), hotWallet);

        vm.prank(owner);
        uint256 swept = factory.sweepWallet(wallet, address(token), hotWallet);
        assertEq(swept, 50 ether);
        assertEq(token.balanceOf(hotWallet), 50 ether);
    }

    function testMultisigPreventsDuplicateApprovalAndExecution() public {
        vm.prank(owner);
        token.mint(address(coldWallet), 100 ether);

        bytes32 businessId = keccak256("wd_001");
        vm.prank(admin1);
        uint256 requestId = coldWallet.submitWithdrawal(businessId, address(token), userRecipient, 40 ether);

        vm.prank(admin1);
        coldWallet.approve(requestId);

        vm.prank(admin1);
        vm.expectRevert(MultiSigColdWallet.AlreadyApproved.selector);
        coldWallet.approve(requestId);

        vm.prank(admin1);
        vm.expectRevert(MultiSigColdWallet.ThresholdNotMet.selector);
        coldWallet.execute(requestId);

        vm.prank(admin2);
        coldWallet.approve(requestId);

        vm.prank(admin3);
        coldWallet.execute(requestId);
        assertEq(token.balanceOf(userRecipient), 40 ether);

        vm.prank(admin2);
        vm.expectRevert(MultiSigColdWallet.AlreadyExecuted.selector);
        coldWallet.execute(requestId);
    }

    function testAuditAnchorRecordsSnapshotAndRejectsDuplicate() public {
        bytes32 snapshotHash = keccak256("snapshot");
        bytes32 merkleRoot = keccak256("root");

        vm.prank(owner);
        auditAnchor.anchorSnapshot(snapshotHash, merkleRoot, "ipfs://local-report");

        (bytes32 savedSnapshotHash, bytes32 savedMerkleRoot, , , address anchoredBy) = auditAnchor.snapshots(snapshotHash);
        assertEq(savedSnapshotHash, snapshotHash);
        assertEq(savedMerkleRoot, merkleRoot);
        assertEq(anchoredBy, owner);

        vm.prank(owner);
        vm.expectRevert(AuditAnchor.SnapshotAlreadyAnchored.selector);
        auditAnchor.anchorSnapshot(snapshotHash, merkleRoot, "ipfs://local-report");
    }
}
