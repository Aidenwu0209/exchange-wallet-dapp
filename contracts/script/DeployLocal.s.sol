// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script} from "forge-std/Script.sol";
import {MockUSDT} from "../src/MockUSDT.sol";
import {DepositWalletFactory} from "../src/DepositWalletFactory.sol";
import {MultiSigColdWallet} from "../src/MultiSigColdWallet.sol";
import {AuditAnchor} from "../src/AuditAnchor.sol";

/// @notice Deploys the local exchange wallet system and writes a JSON address file.
contract DeployLocal is Script {
    uint256 private constant DEFAULT_INITIAL_HOT_MINT = 1_000_000 ether;
    uint256 private constant DEFAULT_INITIAL_COLD_MINT = 1_000_000 ether;

    function run() external {
        uint256 deployerPrivateKey = vm.envUint("DEPLOYER_PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        address hotWallet = vm.envOr("HOT_WALLET_ADDRESS", deployer);

        address admin1 = vm.envOr("ADMIN_1_ADDRESS", deployer);
        address admin2 = vm.envOr("ADMIN_2_ADDRESS", address(0x2002));
        address admin3 = vm.envOr("ADMIN_3_ADDRESS", address(0x2003));
        string memory network = vm.envOr("DEPLOY_NETWORK", string("anvil"));
        string memory outputPath = vm.envOr("DEPLOYMENT_FILE", string("./deployments/anvil.json"));

        address[] memory owners = new address[](3);
        owners[0] = admin1;
        owners[1] = admin2;
        owners[2] = admin3;

        vm.startBroadcast(deployerPrivateKey);

        MockUSDT token = new MockUSDT(deployer);
        DepositWalletFactory factory = new DepositWalletFactory(deployer, hotWallet);
        MultiSigColdWallet coldWallet = new MultiSigColdWallet(owners, 2);
        AuditAnchor auditAnchor = new AuditAnchor(deployer);

        token.mint(hotWallet, DEFAULT_INITIAL_HOT_MINT);
        token.mint(address(coldWallet), DEFAULT_INITIAL_COLD_MINT);

        vm.stopBroadcast();

        string memory root = "deployment";
        vm.serializeString(root, "project_name", unicode"选题二：交易所钱包系统 DApp 开发");
        vm.serializeString(root, "network", network);
        vm.serializeUint(root, "chain_id", block.chainid);
        vm.serializeString(root, "mock_usdt", vm.toString(address(token)));
        vm.serializeString(root, "deposit_wallet_factory", vm.toString(address(factory)));
        vm.serializeString(root, "multi_sig_cold_wallet", vm.toString(address(coldWallet)));
        vm.serializeString(root, "audit_anchor", vm.toString(address(auditAnchor)));
        vm.serializeString(root, "hot_wallet", vm.toString(hotWallet));
        vm.serializeString(root, "deployer", vm.toString(deployer));
        vm.serializeString(root, "admin_1", vm.toString(admin1));
        vm.serializeString(root, "admin_2", vm.toString(admin2));
        string memory finalJson = vm.serializeString(root, "admin_3", vm.toString(admin3));
        vm.writeJson(finalJson, outputPath);
    }
}
