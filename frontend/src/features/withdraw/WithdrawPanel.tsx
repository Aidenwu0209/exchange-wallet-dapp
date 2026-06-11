"use client";

import { Send } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { EmptyState, ErrorState } from "@/src/components/feedback/States";
import { useActiveUser } from "@/src/hooks/useActiveUser";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { createWithdrawal } from "@/src/services/wallet-api";

export function WithdrawPanel() {
  const { userId, hasUser } = useActiveUser();
  const [toAddress, setToAddress] = useState("");
  const [amount, setAmount] = useState("1000000000000000000");
  const mutation = useApiMutation(createWithdrawal);

  async function submit() {
    await mutation.mutate({
      user_id: userId,
      to_address: toAddress,
      amount,
      asset_symbol: "MockUSDT"
    });
  }

  return (
    <section className="page">
      <PageHeader title="提现申请" subtitle="普通提现由热钱包执行；大额提现进入链上多签审批；黑名单和余额不足会被后端风控拦截。" />
      {!hasUser ? <EmptyState>请先创建用户</EmptyState> : null}
      <div className="grid two">
        <Card title="提交提现">
          <div className="form">
            <div className="field">
              <label>目标地址</label>
              <input className="input mono" value={toAddress} onChange={(event) => setToAddress(event.target.value)} placeholder="0x..." />
            </div>
            <div className="field">
              <label>金额 atomic unit</label>
              <input className="input mono" value={amount} onChange={(event) => setAmount(event.target.value)} />
            </div>
            <Button icon={<Send size={16} />} disabled={!hasUser || mutation.loading || !toAddress || !amount} onClick={submit}>
              发起提现
            </Button>
            {mutation.error ? <ErrorState error={mutation.error} /> : null}
          </div>
        </Card>
        <Card title="处理结果">
          {mutation.data ? (
            <div className="grid">
              <div><StatusBadge value={mutation.data.status} /></div>
              <div>风险等级：<StatusBadge value={mutation.data.risk_level} /></div>
              <div>原因：{mutation.data.risk_reason ?? "无"}</div>
              <div>txHash：<TxHashLink txHash={mutation.data.tx_hash} /></div>
              <div>multisig_request_id：<span className="mono">{mutation.data.multisig_request_id ?? "-"}</span></div>
            </div>
          ) : (
            <EmptyState>提交后会显示提现状态、风控结果和 txHash</EmptyState>
          )}
        </Card>
      </div>
    </section>
  );
}
