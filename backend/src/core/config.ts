import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { getAddress } from "ethers";

dotenv.config();

process.env.DATABASE_URL ||= "file:./dev.db";

type DeploymentFile = {
  chain_id?: number;
  mock_usdt?: string;
  deposit_wallet_factory?: string;
  multi_sig_cold_wallet?: string;
  audit_anchor?: string;
  hot_wallet?: string;
  admin_1?: string;
  admin_2?: string;
  admin_3?: string;
};

function readDeployment(): DeploymentFile {
  const configured = process.env.CONTRACT_ADDRESSES_FILE ?? "../contracts/deployments/anvil.json";
  const filePath = path.resolve(process.cwd(), configured);
  if (!fs.existsSync(filePath)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as DeploymentFile;
}

const deployment = readDeployment();

function envAddress(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    return "";
  }
  return getAddress(value);
}

function optionalPrivateKey(name: string): string | undefined {
  const value = process.env[name];
  if (!value || value.includes("replace_with")) {
    return undefined;
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT ?? 3001),
  chainId: Number(process.env.CHAIN_ID ?? deployment.chain_id ?? 31337),
  rpcUrl: process.env.RPC_URL ?? "http://127.0.0.1:8545",
  requiredConfirmations: Number(process.env.REQUIRED_CONFIRMATIONS ?? 2),
  largeWithdrawalThreshold: process.env.LARGE_WITHDRAWAL_THRESHOLD ?? "1000000000000000000000",
  dailyWithdrawalLimit: process.env.DAILY_WITHDRAWAL_LIMIT ?? "5000000000000000000000",
  frequentWithdrawalLimit: Number(process.env.FREQUENT_WITHDRAWAL_LIMIT ?? 3),
  hotWalletAddress: envAddress("HOT_WALLET_ADDRESS", deployment.hot_wallet),
  mockUsdtAddress: envAddress("MOCK_USDT_ADDRESS", deployment.mock_usdt),
  depositFactoryAddress: envAddress("DEPOSIT_WALLET_FACTORY_ADDRESS", deployment.deposit_wallet_factory),
  multisigColdWalletAddress: envAddress("MULTISIG_COLD_WALLET_ADDRESS", deployment.multi_sig_cold_wallet),
  auditAnchorAddress: envAddress("AUDIT_ANCHOR_ADDRESS", deployment.audit_anchor),
  hotWalletPrivateKey: optionalPrivateKey("HOT_WALLET_PRIVATE_KEY"),
  adminPrivateKeys: [
    optionalPrivateKey("ADMIN_1_PRIVATE_KEY"),
    optionalPrivateKey("ADMIN_2_PRIVATE_KEY"),
    optionalPrivateKey("ADMIN_3_PRIVATE_KEY")
  ].filter(Boolean) as string[],
  adminAddresses: [
    envAddress("ADMIN_1_ADDRESS", deployment.admin_1),
    envAddress("ADMIN_2_ADDRESS", deployment.admin_2),
    envAddress("ADMIN_3_ADDRESS", deployment.admin_3)
  ].filter(Boolean)
};
