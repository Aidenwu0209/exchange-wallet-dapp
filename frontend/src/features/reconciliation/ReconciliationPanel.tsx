"use client";

import { Anchor, RefreshCcw } from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { PermissionGuard } from "@/src/components/feedback/PermissionGuard";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { getLatestReconciliation, reconcile } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function ReconciliationPanel() {
  const latest = useApiQuery(getLatestReconciliation, []);
  const run = useApiMutation(reconcile);
  const report = run.data ?? latest.data;

  return (
    <section className="page">
      <PageHeader
        title="资产对账"
        subtitle="统计本地用户负债、热/冷/充值钱包链上余额，生成 Merkle Root 并锚定到 AuditAnchor。"
        actions={<Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={() => latest.reload()}>刷新报告</Button>}
      />
      <PermissionGuard>
        <Button icon={<Anchor size={16} />} disabled={run.loading} onClick={() => run.mutate(undefined)}>
          生成对账报告并上链
        </Button>
      </PermissionGuard>
      <div style={{ height: 16 }} />
      {latest.loading ? <LoadingState /> : null}
      {latest.error && !run.data ? <EmptyState>尚未生成对账报告</EmptyState> : null}
      {run.error ? <ErrorState error={run.error} /> : null}
      {report ? (
        <div className="grid three">
          <Card title="状态"><div className="metric"><StatusBadge value={report.status} /><span className="metric-label">差额 {formatAtomic(report.diff)}</span></div></Card>
          <Card title="本地负债"><div className="metric"><span className="metric-value">{formatAtomic(report.total_user_balance)}</span><span className="metric-label">冻结 {formatAtomic(report.total_frozen_balance)}</span></div></Card>
          <Card title="链上储备"><div className="metric"><span className="metric-value">{formatAtomic(report.total_onchain_balance)}</span><span className="metric-label">储备率 {report.reserve_ratio}</span></div></Card>
          <Card title="热钱包"><div className="metric"><span className="metric-value">{formatAtomic(report.hot_wallet_balance)}</span></div></Card>
          <Card title="冷钱包"><div className="metric"><span className="metric-value">{formatAtomic(report.cold_wallet_balance)}</span></div></Card>
          <Card title="未归集充值钱包"><div className="metric"><span className="metric-value">{formatAtomic(report.deposit_wallet_balance)}</span></div></Card>
          <Card title="Merkle Root"><div className="state mono">{report.merkle_root}</div></Card>
          <Card title="Snapshot Hash"><div className="state mono">{report.snapshot_hash}</div></Card>
          <Card title="AuditAnchor txHash"><TxHashLink txHash={report.anchor_tx_hash} /></Card>
        </div>
      ) : null}
    </section>
  );
}
