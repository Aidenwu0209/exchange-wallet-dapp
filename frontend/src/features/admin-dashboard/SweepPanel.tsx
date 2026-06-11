"use client";

import { Landmark } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { PermissionGuard } from "@/src/components/feedback/PermissionGuard";
import { EmptyState, ErrorState } from "@/src/components/feedback/States";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { sweepFunds } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function SweepPanel() {
  const [depositAddress, setDepositAddress] = useState("ALL");
  const mutation = useApiMutation((input: { depositAddress: string }) => sweepFunds(input.depositAddress));
  return (
    <section className="page">
      <PageHeader title="资金归集" subtitle="管理员触发 DepositWalletFactory.sweepWallet，把充值地址余额归集到热钱包。" />
      <PermissionGuard>
        <div className="grid two">
          <Card title="归集参数">
            <div className="form">
              <div className="field">
                <label>充值地址或 ALL</label>
                <input className="input mono" value={depositAddress} onChange={(event) => setDepositAddress(event.target.value)} />
              </div>
              <Button icon={<Landmark size={16} />} disabled={mutation.loading} onClick={() => mutation.mutate({ depositAddress })}>
                执行归集
              </Button>
              {mutation.error ? <ErrorState error={mutation.error} /> : null}
            </div>
          </Card>
          <Card title="归集结果">
            {mutation.data ? (
              <div className="grid">
                <div>归集地址数：{mutation.data.sweep_count}</div>
                <div>总金额：{formatAtomic(mutation.data.total_amount)} MockUSDT</div>
                <div className="button-row">{mutation.data.tx_hashes.map((hash) => <TxHashLink key={hash} txHash={hash} />)}</div>
              </div>
            ) : (
              <EmptyState>执行后显示归集 txHash</EmptyState>
            )}
          </Card>
        </div>
      </PermissionGuard>
    </section>
  );
}
