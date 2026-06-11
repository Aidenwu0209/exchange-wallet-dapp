import { apiClient } from "./api-client";
import type {
  Dashboard,
  DepositAddress,
  DepositHistoryItem,
  MultisigApprovalTypedDataResponse,
  PageResult,
  ReconciliationReport,
  UserAssets,
  WithdrawalItem
} from "@/src/types/api";

export function createUser(input: { username: string; wallet_address: string }) {
  return apiClient.post<{
    user_id: string;
    username: string;
    wallet_address: string;
    deposit_address: string;
    user_id_hash: string;
    created_tx_hash: string | null;
  }>("/api/v1/users", input);
}

export function getUserAssets(userId: string) {
  return apiClient.get<UserAssets>(`/api/v1/users/${userId}/assets`);
}

export function getDepositAddress(userId: string) {
  return apiClient.get<DepositAddress>(`/api/v1/users/${userId}/deposit-address`);
}

export function faucetMockUsdt(input: { to_address: string; amount: string }) {
  return apiClient.post<{ tx_hash: string; to_address: string; amount: string }>("/api/v1/faucet/mock-usdt", input);
}

export function scanDeposits() {
  return apiClient.post<{ scanned_from: number; scanned_to: number; detected_events: number; created_deposits: number; duplicate_events: number }>(
    "/api/v1/deposits/scan",
    { to_block: "latest" }
  );
}

export function confirmDeposits() {
  return apiClient.post<{ confirmed_count: number; pending_count: number; required_confirmations: number }>("/api/v1/deposits/confirm");
}

export function getDepositHistory(userId: string) {
  return apiClient.get<PageResult<DepositHistoryItem>>(`/api/v1/deposits/${userId}/history?page=1&page_size=20`);
}

export function createWithdrawal(input: { user_id: string; to_address: string; amount: string; asset_symbol: "MockUSDT" }) {
  return apiClient.post<WithdrawalItem>("/api/v1/withdrawals", input);
}

export function getWithdrawalHistory(userId: string) {
  return apiClient.get<PageResult<WithdrawalItem>>(`/api/v1/withdrawals/${userId}/history?page=1&page_size=20`);
}

export function getDashboard() {
  return apiClient.get<Dashboard>("/api/v1/admin/dashboard");
}

export function sweepFunds(depositAddress: string) {
  return apiClient.post<{ sweep_count: number; tx_hashes: string[]; total_amount: string }>("/api/v1/admin/sweep", {
    deposit_address: depositAddress
  });
}

export function addBlacklist(input: { address: string; reason: string }) {
  return apiClient.post<{ address: string; reason: string; created_at: string }>("/api/v1/admin/blacklist", input);
}

export function getRiskEvents() {
  return apiClient.get<PageResult<Record<string, unknown>>>("/api/v1/admin/risk-events?page=1&page_size=20");
}

export function getPendingWithdrawals() {
  return apiClient.get<PageResult<WithdrawalItem>>("/api/v1/admin/pending-withdrawals?page=1&page_size=20");
}

export function getApprovalTypedData(withdrawalId: string, approverAddress: string) {
  const encodedAddress = encodeURIComponent(approverAddress);
  return apiClient.get<MultisigApprovalTypedDataResponse>(
    `/api/v1/admin/withdrawals/${withdrawalId}/approval-typed-data?approver_address=${encodedAddress}`
  );
}

export function approveWithdrawal(withdrawalId: string, approverAddress: string, signature?: string, deadline?: string) {
  return apiClient.post<{
    withdrawal_id: string;
    multisig_request_id: string;
    approved_count: number;
    threshold: number;
    can_execute: boolean;
    approval_tx_hash: string;
    eip712_verified: boolean;
  }>(
    `/api/v1/admin/withdrawals/${withdrawalId}/approve`,
    { approver_address: approverAddress, signature, deadline }
  );
}

export function executeWithdrawal(withdrawalId: string, approverAddress: string) {
  return apiClient.post<{ withdrawal_id: string; status: string; tx_hash: string }>(`/api/v1/admin/withdrawals/${withdrawalId}/execute`, {
    approver_address: approverAddress
  });
}

export function reconcile() {
  return apiClient.post<ReconciliationReport>("/api/v1/admin/reconcile");
}

export function getLatestReconciliation() {
  return apiClient.get<ReconciliationReport>("/api/v1/admin/reconcile/latest");
}

export function getProofOfReserve(userId: string) {
  return apiClient.get<Record<string, unknown>>(`/api/v1/users/${userId}/proof-of-reserve`);
}

export function getOnchainEvents(eventType = "ALL") {
  return apiClient.get<PageResult<Record<string, unknown>>>(`/api/v1/admin/onchain-events?event_type=${eventType}&page=1&page_size=50`);
}

export function getBlockScanState() {
  return apiClient.get<Record<string, unknown>>("/api/v1/admin/block-scan-state");
}
