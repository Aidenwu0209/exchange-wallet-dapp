PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  wallet_address TEXT NOT NULL UNIQUE,
  user_id_hash TEXT NOT NULL UNIQUE,
  available_balance TEXT NOT NULL DEFAULT '0',
  frozen_balance TEXT NOT NULL DEFAULT '0',
  total_deposit TEXT NOT NULL DEFAULT '0',
  total_withdrawal TEXT NOT NULL DEFAULT '0',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS deposit_addresses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  asset_symbol TEXT NOT NULL DEFAULT 'MockUSDT',
  address TEXT NOT NULL UNIQUE,
  created_tx_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS deposits (
  deposit_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  chain_id INTEGER NOT NULL,
  from_address TEXT NOT NULL,
  deposit_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  log_index INTEGER NOT NULL,
  detected_block INTEGER NOT NULL,
  confirmed_block INTEGER,
  confirmations INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE,
  UNIQUE(chain_id, tx_hash, log_index)
);

CREATE TABLE IF NOT EXISTS ledger_entries (
  ledger_entry_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  business_type TEXT NOT NULL,
  business_id TEXT NOT NULL,
  asset_symbol TEXT NOT NULL DEFAULT 'MockUSDT',
  amount TEXT NOT NULL,
  available_after TEXT NOT NULL,
  frozen_after TEXT NOT NULL,
  tx_hash TEXT,
  log_index INTEGER,
  block_number INTEGER,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS withdrawals (
  withdrawal_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount TEXT NOT NULL,
  asset_symbol TEXT NOT NULL DEFAULT 'MockUSDT',
  status TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  risk_reason TEXT,
  tx_hash TEXT,
  multisig_request_id TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS risk_events (
  risk_event_id TEXT PRIMARY KEY,
  user_id TEXT,
  withdrawal_id TEXT,
  address TEXT,
  risk_level TEXT NOT NULL,
  code TEXT NOT NULL,
  message TEXT NOT NULL,
  details_json TEXT NOT NULL DEFAULT '{}',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS blacklist_addresses (
  id TEXT PRIMARY KEY,
  address TEXT NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS block_scan_state (
  chain_id INTEGER PRIMARY KEY,
  last_scanned_block INTEGER NOT NULL DEFAULT 0,
  last_scanned_block_hash TEXT,
  required_confirmations INTEGER NOT NULL DEFAULT 2,
  scanner_status TEXT NOT NULL DEFAULT 'idle',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reconciliation_reports (
  report_id TEXT PRIMARY KEY,
  total_user_balance TEXT NOT NULL,
  total_frozen_balance TEXT NOT NULL,
  hot_wallet_balance TEXT NOT NULL,
  cold_wallet_balance TEXT NOT NULL,
  deposit_wallet_balance TEXT NOT NULL,
  total_onchain_balance TEXT NOT NULL,
  diff TEXT NOT NULL,
  reserve_ratio TEXT NOT NULL,
  merkle_root TEXT NOT NULL,
  snapshot_hash TEXT NOT NULL UNIQUE,
  anchor_tx_hash TEXT,
  status TEXT NOT NULL,
  proof_json TEXT NOT NULL DEFAULT '[]',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS multisig_approvals (
  id TEXT PRIMARY KEY,
  withdrawal_id TEXT NOT NULL,
  multisig_request_id TEXT NOT NULL,
  approver_address TEXT NOT NULL,
  tx_hash TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(withdrawal_id, approver_address)
);

CREATE TABLE IF NOT EXISTS onchain_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  contract_address TEXT NOT NULL,
  tx_hash TEXT NOT NULL,
  block_number INTEGER NOT NULL,
  log_index INTEGER NOT NULL,
  args_json TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tx_hash, log_index, event_type)
);
