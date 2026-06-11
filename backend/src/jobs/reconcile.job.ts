import { ReconciliationService } from "../services/reconciliation.service.js";

export async function reconcileJob() {
  return new ReconciliationService().reconcile();
}
