"use client";

import { RefreshCcw } from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { AddressText } from "@/src/components/ui/AddressText";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { getDashboard } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function AdminDashboardPanel() {
  const dashboard = useApiQuery(getDashboard, []);
  return (
    <section className="page">
      <PageHeader
        title="管理员看板"
        subtitle="展示热钱包、冷钱包、未归集充值钱包、本地账本、待审批和风控事件。"
        actions={<Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={() => dashboard.reload()}>刷新</Button>}
      />
      {dashboard.loading ? <LoadingState /> : null}
      {dashboard.error ? <ErrorState error={dashboard.error} /> : null}
      {dashboard.data ? (
        <div className="grid three">
          <Card title="热钱包">
            <div className="metric"><AddressText address={dashboard.data.hot_wallet.address} /><span className="metric-value">{formatAtomic(dashboard.data.hot_wallet.balance)}</span></div>
          </Card>
          <Card title="冷钱包多签合约">
            <div className="metric"><AddressText address={dashboard.data.cold_wallet.address} /><span className="metric-value">{formatAtomic(dashboard.data.cold_wallet.balance)}</span></div>
          </Card>
          <Card title="充值钱包未归集">
            <div className="metric"><span className="metric-value">{formatAtomic(dashboard.data.deposit_wallets.total_uncollected_balance)}</span><span className="metric-label">{dashboard.data.deposit_wallets.count} 个地址</span></div>
          </Card>
          <Card title="本地用户可用资产"><div className="metric"><span className="metric-value">{formatAtomic(dashboard.data.ledger.total_user_available)}</span></div></Card>
          <Card title="冻结资产"><div className="metric"><span className="metric-value">{formatAtomic(dashboard.data.ledger.total_user_frozen)}</span></div></Card>
          <Card title="风险与审批"><div className="metric"><span className="metric-value">{dashboard.data.pending_multisig_count} / {dashboard.data.risk_event_count}</span><span className="metric-label">待多签 / 风控事件</span></div></Card>
        </div>
      ) : <EmptyState />}
    </section>
  );
}
