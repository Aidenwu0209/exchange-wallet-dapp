import { DepositService } from "../services/deposit.service.js";

export async function scanBlocksJob() {
  return new DepositService().scan({ to_block: "latest" });
}
