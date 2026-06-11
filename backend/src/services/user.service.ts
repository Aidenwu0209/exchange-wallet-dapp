import { contractsWithSigner } from "../core/contracts.js";
import { config } from "../core/config.js";
import { prisma } from "../core/prisma.js";
import type { Log, LogDescription } from "ethers";
import { DepositRepository } from "../repositories/deposit.repository.js";
import { UserRepository } from "../repositories/user.repository.js";
import { normalizeAddress } from "../utils/address.js";
import { userHash } from "../utils/hash.js";
import { randomId } from "../utils/id.js";
import { errors } from "../core/errors.js";
import { OnchainEventService } from "./onchain-event.service.js";

export class UserService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly deposits = new DepositRepository(),
    private readonly events = new OnchainEventService()
  ) {}

  async createUser(input: { username: string; wallet_address: string }) {
    const walletAddress = normalizeAddress(input.wallet_address);
    const existing = (await this.users.findByWallet(walletAddress)) ?? (await this.users.findByUsername(input.username));
    if (existing) {
      const address = await this.deposits.findAddressByUser(existing.id);
      return {
        user_id: existing.id,
        username: existing.username,
        wallet_address: existing.walletAddress,
        deposit_address: address?.address ?? "",
        user_id_hash: existing.userIdHash,
        created_tx_hash: address?.createdTxHash ?? null
      };
    }

    const userId = randomId("u");
    const userIdHash = userHash(userId);
    const { factory } = contractsWithSigner();
    const tx = await factory.createWallet(userIdHash);
    const receipt = await tx.wait();
    await this.events.recordReceipt(receipt);

    const event = receipt?.logs
      .map((log: Log) => {
        try {
          return factory.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find((parsed: LogDescription | null) => parsed?.name === "DepositWalletCreated");

    const depositAddress = event?.args.wallet as string | undefined;
    if (!depositAddress) {
      throw errors.txBroadcast("未能从 DepositWalletCreated 事件读取充值地址");
    }

    await prisma.$transaction(async (txClient) => {
      const userRepo = new UserRepository(txClient);
      const depositRepo = new DepositRepository(txClient);
      await userRepo.create({
        id: userId,
        username: input.username,
        walletAddress,
        userIdHash
      });
      await depositRepo.createAddress({
        id: randomId("da"),
        userId,
        chainId: config.chainId,
        assetSymbol: "MockUSDT",
        address: normalizeAddress(depositAddress),
        createdTxHash: receipt?.hash
      });
    });

    return {
      user_id: userId,
      username: input.username,
      wallet_address: walletAddress,
      deposit_address: normalizeAddress(depositAddress),
      user_id_hash: userIdHash,
      created_tx_hash: receipt?.hash ?? null
    };
  }

  async getAssets(userId: string) {
    const user = await this.users.findById(userId);
    if (!user) {
      throw errors.userNotFound(userId);
    }
    return {
      user_id: user.id,
      asset_symbol: "MockUSDT",
      available_balance: user.availableBalance,
      frozen_balance: user.frozenBalance,
      total_deposit: user.totalDeposit,
      total_withdrawal: user.totalWithdrawal,
      decimals: 18
    };
  }

  async getDepositAddress(userId: string) {
    const address = await this.deposits.findAddressByUser(userId);
    if (!address) {
      throw errors.depositAddressNotFound(userId);
    }
    return {
      user_id: userId,
      chain_id: address.chainId,
      asset_symbol: address.assetSymbol,
      deposit_address: address.address,
      qr_payload: `ethereum:${address.address}`
    };
  }
}
