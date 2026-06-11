import { DepositService } from "../services/deposit.service.js";

export async function confirmDepositsJob() {
  return new DepositService().confirmPending();
}
