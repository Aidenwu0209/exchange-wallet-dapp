"use client";

import { CheckCircle2, PlayCircle } from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { PermissionGuard } from "@/src/components/feedback/PermissionGuard";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { useWalletStatus } from "@/src/hooks/useWalletStatus";
import { signMultisigApproval } from "@/src/services/eip712-signing";
import { approveWithdrawal, executeWithdrawal, getApprovalTypedData, getPendingWithdrawals } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function MultisigPanel() {
  const wallet = useWalletStatus();
  const pending = useApiQuery(getPendingWithdrawals, []);
  const approve = useApiMutation(async (input: { id: string; address: string }) => {
    const approval = await getApprovalTypedData(input.id, input.address);
    const signature = await signMultisigApproval(approval.typed_data, input.address);
    return approveWithdrawal(input.id, input.address, signature, approval.deadline);
  });
  const execute = useApiMutation((input: { id: string; address: string }) => executeWithdrawal(input.id, input.address));

  return (
    <section className="page">
      <PageHeader title="大额提现多签审批" subtitle="大额提现在冷钱包多签合约中提交，2/3 审批后才能执行。" />
      <PermissionGuard>
        <Card title="待审批提现">
          {pending.loading ? <LoadingState /> : null}
          {pending.error ? <ErrorState error={pending.error} /> : null}
          {pending.data?.items.length === 0 ? <EmptyState /> : null}
          {pending.data?.items.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>状态</th><th>金额</th><th>风险</th><th>requestId</th><th>操作</th></tr></thead>
                <tbody>
                  {pending.data.items.map((item) => (
                    <tr key={item.withdrawal_id}>
                      <td><StatusBadge value={item.status} /></td>
                      <td>{formatAtomic(item.amount)}</td>
                      <td><StatusBadge value={item.risk_level} /></td>
                      <td className="mono">{item.multisig_request_id}</td>
                      <td>
                        <div className="button-row">
                          <Button
                            variant="secondary"
                            icon={<CheckCircle2 size={16} />}
                            disabled={!wallet.address || !wallet.isMultisigApprover || approve.loading}
                            onClick={() => {
                              if (wallet.address) {
                                approve.mutate({ id: item.withdrawal_id, address: wallet.address }).catch(() => undefined);
                              }
                            }}
                          >
                            签名审批
                          </Button>
                          <Button
                            icon={<PlayCircle size={16} />}
                            disabled={!wallet.address || !wallet.isMultisigApprover || execute.loading}
                            onClick={() => {
                              if (wallet.address) {
                                execute.mutate({ id: item.withdrawal_id, address: wallet.address }).catch(() => undefined);
                              }
                            }}
                          >
                            执行
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
          {approve.data ? <div className="state">审批数：{approve.data.approved_count}/{approve.data.threshold}；链上审批：<TxHashLink txHash={approve.data.approval_tx_hash} /></div> : null}
          {execute.data ? <div className="state">执行 txHash：<TxHashLink txHash={execute.data.tx_hash} /></div> : null}
          {approve.error ? <ErrorState error={approve.error} /> : null}
          {execute.error ? <ErrorState error={execute.error} /> : null}
        </Card>
      </PermissionGuard>
    </section>
  );
}
