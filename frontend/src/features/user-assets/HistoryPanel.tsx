"use client";

import { RefreshCcw } from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { useActiveUser } from "@/src/hooks/useActiveUser";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { getDepositHistory, getWithdrawalHistory } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function HistoryPanel() {
  const { userId, hasUser } = useActiveUser();
  const deposits = useApiQuery(() => getDepositHistory(userId), [userId]);
  const withdrawals = useApiQuery(() => getWithdrawalHistory(userId), [userId]);

  return (
    <section className="page">
      <PageHeader
        title="充值和提现历史"
        subtitle="历史记录来自后端 deposits、withdrawals 和 ledger_entries 的业务状态。"
        actions={
          <Button
            variant="secondary"
            icon={<RefreshCcw size={16} />}
            onClick={() => {
              deposits.reload();
              withdrawals.reload();
            }}
          >
            刷新
          </Button>
        }
      />
      {!hasUser ? <EmptyState>请先创建用户</EmptyState> : null}
      <div className="grid two">
        <Card title="充值历史">
          {deposits.loading ? <LoadingState /> : null}
          {deposits.error ? <ErrorState error={deposits.error} /> : null}
          {deposits.data?.items.length === 0 ? <EmptyState /> : null}
          {deposits.data?.items.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>状态</th><th>金额</th><th>txHash</th><th>时间</th></tr>
                </thead>
                <tbody>
                  {deposits.data.items.map((item) => (
                    <tr key={item.deposit_id}>
                      <td><StatusBadge value={item.status} /></td>
                      <td>{formatAtomic(item.amount)}</td>
                      <td><TxHashLink txHash={item.tx_hash} /></td>
                      <td>{new Date(item.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
        <Card title="提现历史">
          {withdrawals.loading ? <LoadingState /> : null}
          {withdrawals.error ? <ErrorState error={withdrawals.error} /> : null}
          {withdrawals.data?.items.length === 0 ? <EmptyState /> : null}
          {withdrawals.data?.items.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr><th>状态</th><th>金额</th><th>风险</th><th>txHash</th></tr>
                </thead>
                <tbody>
                  {withdrawals.data.items.map((item) => (
                    <tr key={item.withdrawal_id}>
                      <td><StatusBadge value={item.status} /></td>
                      <td>{formatAtomic(item.amount)}</td>
                      <td><StatusBadge value={item.risk_level} /></td>
                      <td><TxHashLink txHash={item.tx_hash} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </Card>
      </div>
    </section>
  );
}
