// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title DepositWallet
/// @notice A per-user deposit wallet. It can receive ERC20 transfers and sweep funds to a hot wallet.
contract DepositWallet {
    address public immutable factory;
    bytes32 public immutable userIdHash;

    event Swept(
        address indexed token,
        address indexed to,
        uint256 amount,
        bytes32 indexed userIdHash
    );

    error OnlyFactory();
    error ZeroAddress();
    error NothingToSweep();

    constructor(address factory_, bytes32 userIdHash_) {
        if (factory_ == address(0)) revert ZeroAddress();
        factory = factory_;
        userIdHash = userIdHash_;
    }

    modifier onlyFactory() {
        if (msg.sender != factory) revert OnlyFactory();
        _;
    }

    /// @notice Sweep the entire token balance to the hot wallet. Only the factory can call it.
    function sweep(address token, address to) external onlyFactory returns (uint256 amount) {
        if (token == address(0) || to == address(0)) revert ZeroAddress();
        amount = IERC20(token).balanceOf(address(this));
        if (amount == 0) revert NothingToSweep();
        bool ok = IERC20(token).transfer(to, amount);
        require(ok, "TRANSFER_FAILED");
        emit Swept(token, to, amount, userIdHash);
    }
}
