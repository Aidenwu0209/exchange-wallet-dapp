// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title MultiSigColdWallet
/// @notice 2-of-3 style cold wallet for large withdrawals. Owners approve on-chain before execution.
contract MultiSigColdWallet {
    struct WithdrawalRequest {
        bytes32 businessId;
        address token;
        address to;
        uint256 amount;
        uint256 approvals;
        bool executed;
    }

    mapping(address => bool) public isOwner;
    address[] public owners;
    uint256 public immutable threshold;
    uint256 public nextRequestId;

    mapping(uint256 => WithdrawalRequest) public requests;
    mapping(uint256 => mapping(address => bool)) public approvedBy;
    mapping(bytes32 => uint256) public requestIdByBusinessId;

    event WithdrawalSubmitted(
        uint256 indexed requestId,
        bytes32 indexed businessId,
        address indexed to,
        address token,
        uint256 amount
    );
    event WithdrawalApproved(uint256 indexed requestId, address indexed approver, uint256 approvals, uint256 threshold);
    event WithdrawalExecuted(uint256 indexed requestId, address indexed executor, address indexed to, address token, uint256 amount);

    error InvalidOwners();
    error InvalidThreshold();
    error OnlyOwner();
    error ZeroAddress();
    error DuplicateBusinessId();
    error RequestNotFound();
    error AlreadyApproved();
    error AlreadyExecuted();
    error ThresholdNotMet();

    constructor(address[] memory owners_, uint256 threshold_) {
        if (owners_.length == 0) revert InvalidOwners();
        if (threshold_ == 0 || threshold_ > owners_.length) revert InvalidThreshold();

        for (uint256 i = 0; i < owners_.length; i++) {
            address owner_ = owners_[i];
            if (owner_ == address(0) || isOwner[owner_]) revert InvalidOwners();
            isOwner[owner_] = true;
            owners.push(owner_);
        }

        threshold = threshold_;
    }

    modifier onlyOwner() {
        if (!isOwner[msg.sender]) revert OnlyOwner();
        _;
    }

    function submitWithdrawal(
        bytes32 businessId,
        address token,
        address to,
        uint256 amount
    ) external onlyOwner returns (uint256 requestId) {
        if (businessId == bytes32(0) || token == address(0) || to == address(0)) revert ZeroAddress();
        if (requestIdByBusinessId[businessId] != 0) revert DuplicateBusinessId();

        requestId = ++nextRequestId;
        requestIdByBusinessId[businessId] = requestId;
        requests[requestId] = WithdrawalRequest({
            businessId: businessId,
            token: token,
            to: to,
            amount: amount,
            approvals: 0,
            executed: false
        });

        emit WithdrawalSubmitted(requestId, businessId, to, token, amount);
    }

    function approve(uint256 requestId) external onlyOwner {
        WithdrawalRequest storage request = requests[requestId];
        if (request.businessId == bytes32(0)) revert RequestNotFound();
        if (request.executed) revert AlreadyExecuted();
        if (approvedBy[requestId][msg.sender]) revert AlreadyApproved();

        approvedBy[requestId][msg.sender] = true;
        request.approvals += 1;
        emit WithdrawalApproved(requestId, msg.sender, request.approvals, threshold);
    }

    function execute(uint256 requestId) external onlyOwner {
        WithdrawalRequest storage request = requests[requestId];
        if (request.businessId == bytes32(0)) revert RequestNotFound();
        if (request.executed) revert AlreadyExecuted();
        if (request.approvals < threshold) revert ThresholdNotMet();

        request.executed = true;
        bool ok = IERC20(request.token).transfer(request.to, request.amount);
        require(ok, "TRANSFER_FAILED");
        emit WithdrawalExecuted(requestId, msg.sender, request.to, request.token, request.amount);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }
}
