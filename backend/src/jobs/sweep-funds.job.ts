import { SweepService } from "../services/sweep.service.js";

export async function sweepFundsJob() {
  return new SweepService().sweep({ deposit_address: "ALL" });
}
