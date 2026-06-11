"use client";

import { ShieldAlert } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { PermissionGuard } from "@/src/components/feedback/PermissionGuard";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { addBlacklist, getRiskEvents } from "@/src/services/wallet-api";

export function RiskPanel() {
  const [address, setAddress] = useState("");
  const [reason, setReason] = useState("课程演示黑名单地址");
  const events = useApiQuery(getRiskEvents, []);
  const add = useApiMutation(addBlacklist);
  return (
    <section className="page">
      <PageHeader title="风控记录和黑名单" subtitle="提现风控命中会写入 risk_events，黑名单地址提现会被拦截。" />
      <div className="grid two">
        <PermissionGuard>
          <Card title="新增黑名单">
            <div className="form">
              <div className="field"><label>地址</label><input className="input mono" value={address} onChange={(event) => setAddress(event.target.value)} /></div>
              <div className="field"><label>原因</label><input className="input" value={reason} onChange={(event) => setReason(event.target.value)} /></div>
              <Button icon={<ShieldAlert size={16} />} disabled={add.loading || !address} onClick={() => add.mutate({ address, reason })}>加入黑名单</Button>
              {add.error ? <ErrorState error={add.error} /> : null}
              {add.data ? <div className="state">已加入：{add.data.address}</div> : null}
            </div>
          </Card>
        </PermissionGuard>
        <Card title="风控事件">
          {events.loading ? <LoadingState /> : null}
          {events.error ? <ErrorState error={events.error} /> : null}
          {events.data?.items.length === 0 ? <EmptyState /> : null}
          {events.data?.items.length ? (
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>等级</th><th>代码</th><th>消息</th><th>时间</th></tr></thead>
                <tbody>
                  {events.data.items.map((item, index) => (
                    <tr key={String(item.risk_event_id ?? index)}>
                      <td><StatusBadge value={String(item.risk_level)} /></td>
                      <td>{String(item.code)}</td>
                      <td>{String(item.message)}</td>
                      <td>{String(item.created_at)}</td>
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
