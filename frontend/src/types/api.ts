export type ApiError = {
  code: string;
  message: string;
  details: Record<string, unknown>;
};

export type ApiResponse<T> = {
  success: boolean;
  data: T | null;
  error: ApiError | null;
  meta: {
    request_id: string;
    timestamp: string;
  };
};

export type PageResult<T> = {
  items: T[];
  page: number;
  page_size: number;
  total: number;
};

export type UserAssets = {
  user_id: string;
  asset_symbol: string;
  available_balance: string;
  frozen_balance: string;
  total_deposit: string;
  total_withdrawal: string;
  decimals: number;
};

export type DepositAddress = {
  user_id: string;
  chain_id: number;
  asset_symbol: string;
  deposit_address: string;
  qr_payload: string;
};

export type DepositHistoryItem = {
  deposit_id: string;
  from_address: string;
  deposit_address: string;
  amount: string;
  tx_hash: string;
  log_index: number;
  detected_block: number;
  confirmed_block: number | null;
  confirmations: number;
  status: string;
  created_at: string;
};

export type WithdrawalItem = {
  withdrawal_id: string;
  user_id: string;
  to_address: string;
  amount: string;
  asset_symbol: string;
  status: string;
  risk_level: string;
  risk_reason: string | null;
  tx_hash: string | null;
  multisig_request_id: string | null;
  created_at: string;
};

export type Dashboard = {
  hot_wallet: { address: string; balance: string };
  cold_wallet: { address: string; balance: string };
  deposit_wallets: { count: number; total_uncollected_balance: string };
  ledger: { total_user_available: string; total_user_frozen: string };
  pending_multisig_count: number;
  risk_event_count: number;
};

export type ReconciliationReport = {
  report_id: string;
  total_user_balance: string;
  total_frozen_balance: string;
  hot_wallet_balance: string;
  cold_wallet_balance: string;
  deposit_wallet_balance: string;
  total_onchain_balance: string;
  diff: string;
  reserve_ratio: string;
  merkle_root: string;
  snapshot_hash: string;
  anchor_tx_hash: string | null;
  status: string;
  created_at: string;
};
