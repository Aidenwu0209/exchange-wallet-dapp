// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {DepositWallet} from "./DepositWallet.sol";

/// @title DepositWalletFactory
/// @notice Creates deterministic per-user deposit wallets and exposes a restricted sweep entrypoint.
contract DepositWalletFactory is Ownable {
    address public sweepOperator;

    mapping(bytes32 => address) public walletOfUserHash;
    mapping(address => bytes32) public userHashOfWallet;
    address[] private wallets;

    event DepositWalletCreated(bytes32 indexed userIdHash, address indexed wallet, address indexed operator);
    event SweepOperatorUpdated(address indexed previousOperator, address indexed newOperator);

    error ZeroAddress();
    error WalletAlreadyExists();
    error WalletNotRegistered();
    error OnlySweepOperator();

    constructor(address initialOwner, address sweepOperator_) Ownable(initialOwner) {
        if (sweepOperator_ == address(0)) revert ZeroAddress();
        sweepOperator = sweepOperator_;
    }

    modifier onlySweepOperator() {
        if (msg.sender != sweepOperator && msg.sender != owner()) revert OnlySweepOperator();
        _;
    }

    function setSweepOperator(address newOperator) external onlyOwner {
        if (newOperator == address(0)) revert ZeroAddress();
        emit SweepOperatorUpdated(sweepOperator, newOperator);
        sweepOperator = newOperator;
    }

    /// @notice Create one wallet per user id hash.
    function createWallet(bytes32 userIdHash) external onlyOwner returns (address wallet) {
        if (userIdHash == bytes32(0)) revert ZeroAddress();
        if (walletOfUserHash[userIdHash] != address(0)) revert WalletAlreadyExists();

        bytes32 salt = keccak256(abi.encodePacked(userIdHash));
        wallet = address(new DepositWallet{salt: salt}(address(this), userIdHash));
        walletOfUserHash[userIdHash] = wallet;
        userHashOfWallet[wallet] = userIdHash;
        wallets.push(wallet);

        emit DepositWalletCreated(userIdHash, wallet, msg.sender);
    }

    /// @notice Sweep a registered deposit wallet to the configured hot wallet.
    function sweepWallet(address wallet, address token, address hotWallet) external onlySweepOperator returns (uint256 amount) {
        if (userHashOfWallet[wallet] == bytes32(0)) revert WalletNotRegistered();
        amount = DepositWallet(payable(wallet)).sweep(token, hotWallet);
    }

    function getWallets() external view returns (address[] memory) {
        return wallets;
    }

    function walletsCount() external view returns (uint256) {
        return wallets.length;
    }
}
