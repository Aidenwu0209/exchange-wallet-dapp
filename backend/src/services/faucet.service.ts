import { contractsWithSigner } from "../core/contracts.js";
import { normalizeAddress } from "../utils/address.js";
import { OnchainEventService } from "./onchain-event.service.js";

export class FaucetService {
  constructor(private readonly events = new OnchainEventService()) {}

  async mint(input: { to_address: string; amount: string }) {
    const to = normalizeAddress(input.to_address);
    const { token } = contractsWithSigner();
    const tx = await token.mint(to, input.amount);
    const receipt = await tx.wait();
    await this.events.recordReceipt(receipt);
    return {
      tx_hash: receipt?.hash ?? tx.hash,
      to_address: to,
      amount: input.amount
    };
  }
}
