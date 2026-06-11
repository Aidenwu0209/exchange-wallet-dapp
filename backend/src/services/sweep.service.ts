import { Contract } from "ethers";
import { config } from "../core/config.js";
import { contractsReadOnly, contractsWithSigner, erc20Abi } from "../core/contracts.js";
import { DepositRepository } from "../repositories/deposit.repository.js";
import { normalizeAddress } from "../utils/address.js";
import { OnchainEventService } from "./onchain-event.service.js";

export class SweepService {
  constructor(
    private readonly deposits = new DepositRepository(),
    private readonly events = new OnchainEventService()
  ) {}

  async sweep(input: { deposit_address: string }) {
    const addresses =
      input.deposit_address === "ALL"
        ? await this.deposits.listAddresses()
        : [await this.deposits.findAddress(normalizeAddress(input.deposit_address))].filter(Boolean);

    const readOnly = contractsReadOnly();
    const { factory } = contractsWithSigner();
    let totalAmount = 0n;
    const txHashes: string[] = [];
    let sweepCount = 0;

    for (const address of addresses) {
      if (!address) {
        continue;
      }
      const balance = (await readOnly.token.balanceOf(address.address)) as bigint;
      if (balance === 0n) {
        continue;
      }
      const tx = await factory.sweepWallet(address.address, config.mockUsdtAddress, config.hotWalletAddress);
      const receipt = await tx.wait();
      await this.events.recordReceipt(receipt);
      txHashes.push(receipt?.hash ?? tx.hash);
      totalAmount += balance;
      sweepCount += 1;
    }

    return {
      sweep_count: sweepCount,
      tx_hashes: txHashes,
      total_amount: totalAmount.toString()
    };
  }

  async uncollectedBalance() {
    const addresses = await this.deposits.listAddresses();
    const token = new Contract(config.mockUsdtAddress, erc20Abi, contractsReadOnly().token.runner);
    let total = 0n;
    for (const address of addresses) {
      total += (await token.balanceOf(address.address)) as bigint;
    }
    return {
      count: addresses.length,
      total_uncollected_balance: total.toString()
    };
  }
}
