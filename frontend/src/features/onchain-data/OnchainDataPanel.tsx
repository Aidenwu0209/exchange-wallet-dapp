"use client";

import { RefreshCcw } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { getBlockScanState, getOnchainEvents } from "@/src/services/wallet-api";

const eventTypes = ["ALL", "TRANSFER", "DEPOSIT_WALLET_CREATED", "SWEPT", "WITHDRAWAL_SUBMITTED", "WITHDRAWAL_APPROVED", "WITHDRAWAL_EXECUTED", "AUDIT_ANCHORED"];

export function OnchainDataPanel() {
  const [eventType, setEventType] = useState("ALL");
  const events = useApiQuery(() => getOnchainEvents(eventType), [eventType]);
  const scan = useApiQuery(getBlockScanState, []);

  return (
    <section className="page">
      <PageHeader
        title="链上数据中心"
        subtitle="集中展示关键链上事件、txHash、区块高度、扫描状态和确认数设置。"
        actions={<Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={() => { events.reload(); scan.reload(); }}>刷新</Button>}
      />
      <div className="grid two">
        <Card title="区块扫描状态">
          {scan.loading ? <LoadingState /> : null}
          {scan.error ? <ErrorState error={scan.error} /> : null}
          {scan.data ? <pre className="state mono">{JSON.stringify(scan.data, null, 2)}</pre> : null}
        </Card>
        <Card title="事件过滤">
          <div className="field">
            <label>event_type</label>
            <select className="input" value={eventType} onChange={(event) => setEventType(event.target.value)}>
              {eventTypes.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </Card>
      </div>
      <div style={{ height: 16 }} />
      <Card title="链上事件">
        {events.loading ? <LoadingState /> : null}
        {events.error ? <ErrorState error={events.error} /> : null}
        {events.data?.items.length === 0 ? <EmptyState /> : null}
        {events.data?.items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead><tr><th>类型</th><th>区块</th><th>txHash</th><th>logIndex</th><th>参数</th></tr></thead>
              <tbody>
                {events.data.items.map((item, index) => (
                  <tr key={`${String(item.tx_hash)}-${index}`}>
                    <td><StatusBadge value={String(item.event_type)} /></td>
                    <td>{String(item.block_number)}</td>
                    <td><TxHashLink txHash={String(item.tx_hash)} /></td>
                    <td>{String(item.log_index)}</td>
                    <td><pre className="mono" style={{ margin: 0 }}>{JSON.stringify(item.args, null, 0)}</pre></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </Card>
    </section>
  );
}
