// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title MockUSDT
/// @notice Test ERC20 used only on Anvil/Sepolia demos for the exchange wallet assignment.
contract MockUSDT is ERC20, Ownable {
    event FaucetMinted(address indexed to, uint256 amount);

    constructor(address initialOwner) ERC20("Mock USDT", "MockUSDT") Ownable(initialOwner) {}

    /// @notice Mint test tokens. The owner is the backend/deployer test account.
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        emit FaucetMinted(to, amount);
    }
}
