import { Contract, Interface, JsonRpcProvider, Wallet, type ContractTransactionReceipt, type Log, type TransactionReceipt } from "ethers";
import { config } from "./config.js";
import { errors } from "./errors.js";

export const erc20Abi = [
  "event Transfer(address indexed from,address indexed to,uint256 value)",
  "event FaucetMinted(address indexed to,uint256 amount)",
  "function mint(address to,uint256 amount)",
  "function transfer(address to,uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)"
];

export const factoryAbi = [
  "event DepositWalletCreated(bytes32 indexed userIdHash,address indexed wallet,address indexed operator)",
  "function createWallet(bytes32 userIdHash) returns (address)",
  "function sweepWallet(address wallet,address token,address hotWallet) returns (uint256)",
  "function getWallets() view returns (address[])",
  "function walletOfUserHash(bytes32 userIdHash) view returns (address)"
];

export const depositWalletAbi = [
  "event Swept(address indexed token,address indexed to,uint256 amount,bytes32 indexed userIdHash)",
  "function userIdHash() view returns (bytes32)"
];

export const multisigAbi = [
  "event WithdrawalSubmitted(uint256 indexed requestId,bytes32 indexed businessId,address indexed to,address token,uint256 amount)",
  "event WithdrawalApproved(uint256 indexed requestId,address indexed approver,uint256 approvals,uint256 threshold)",
  "event WithdrawalExecuted(uint256 indexed requestId,address indexed executor,address indexed to,address token,uint256 amount)",
  "function submitWithdrawal(bytes32 businessId,address token,address to,uint256 amount) returns (uint256)",
  "function approve(uint256 requestId)",
  "function execute(uint256 requestId)",
  "function threshold() view returns (uint256)",
  "function requests(uint256 requestId) view returns (bytes32 businessId,address token,address to,uint256 amount,uint256 approvals,bool executed)"
];

export const auditAnchorAbi = [
  "event AuditAnchored(bytes32 indexed snapshotHash,bytes32 indexed merkleRoot,string reportUri,address indexed anchoredBy)",
  "function anchorSnapshot(bytes32 snapshotHash,bytes32 merkleRoot,string reportUri)"
];

export const interfaces = {
  erc20: new Interface(erc20Abi),
  factory: new Interface(factoryAbi),
  depositWallet: new Interface(depositWalletAbi),
  multisig: new Interface(multisigAbi),
  auditAnchor: new Interface(auditAnchorAbi)
};

export const provider = new JsonRpcProvider(config.rpcUrl, config.chainId);

export function requireHotSigner() {
  if (!config.hotWalletPrivateKey) {
    throw errors.txBroadcast("缺少 HOT_WALLET_PRIVATE_KEY，不能广播链上交易");
  }
  return new Wallet(config.hotWalletPrivateKey, provider);
}

export function getAdminSigner(approverAddress: string) {
  const target = approverAddress.toLowerCase();
  for (const privateKey of config.adminPrivateKeys) {
    const wallet = new Wallet(privateKey, provider);
    if (wallet.address.toLowerCase() === target) {
      return wallet;
    }
  }
  throw errors.forbidden();
}

function ensureAddress(address: string, name: string) {
  if (!address) {
    throw errors.chainConnection(`缺少合约地址配置：${name}`);
  }
  return address;
}

export function contractsWithSigner(signer = requireHotSigner()) {
  return {
    token: new Contract(ensureAddress(config.mockUsdtAddress, "MOCK_USDT_ADDRESS"), erc20Abi, signer),
    factory: new Contract(ensureAddress(config.depositFactoryAddress, "DEPOSIT_WALLET_FACTORY_ADDRESS"), factoryAbi, signer),
    multisig: new Contract(ensureAddress(config.multisigColdWalletAddress, "MULTISIG_COLD_WALLET_ADDRESS"), multisigAbi, signer),
    auditAnchor: new Contract(ensureAddress(config.auditAnchorAddress, "AUDIT_ANCHOR_ADDRESS"), auditAnchorAbi, signer)
  };
}

export function contractsReadOnly() {
  return {
    token: new Contract(ensureAddress(config.mockUsdtAddress, "MOCK_USDT_ADDRESS"), erc20Abi, provider),
    factory: new Contract(ensureAddress(config.depositFactoryAddress, "DEPOSIT_WALLET_FACTORY_ADDRESS"), factoryAbi, provider),
    multisig: new Contract(ensureAddress(config.multisigColdWalletAddress, "MULTISIG_COLD_WALLET_ADDRESS"), multisigAbi, provider),
    auditAnchor: new Contract(ensureAddress(config.auditAnchorAddress, "AUDIT_ANCHOR_ADDRESS"), auditAnchorAbi, provider)
  };
}

export async function txMeta(receipt: ContractTransactionReceipt | TransactionReceipt | null) {
  return {
    tx_hash: receipt?.hash ?? "",
    block_number: receipt?.blockNumber ?? 0
  };
}

export function parseKnownLog(log: Log) {
  for (const iface of Object.values(interfaces)) {
    try {
      const parsed = iface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed) {
        return parsed;
      }
    } catch {
      // Try the next contract interface.
    }
  }
  return null;
}
