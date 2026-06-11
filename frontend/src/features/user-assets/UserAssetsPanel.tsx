"use client";

import { PlusCircle, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { AddressText } from "@/src/components/ui/AddressText";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { useActiveUser } from "@/src/hooks/useActiveUser";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { useWalletStatus } from "@/src/hooks/useWalletStatus";
import { createUser, getDepositAddress, getUserAssets } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function UserAssetsPanel() {
  const wallet = useWalletStatus();
  const { userId, setUserId, hasUser } = useActiveUser();
  const [username, setUsername] = useState("alice");
  const createMutation = useApiMutation(createUser);
  const assets = useApiQuery(() => getUserAssets(userId), [userId]);
  const address = useApiQuery(() => getDepositAddress(userId), [userId]);

  useEffect(() => {
    if (createMutation.data?.user_id) {
      setUserId(createMutation.data.user_id);
    }
  }, [createMutation.data, setUserId]);

  async function handleCreate() {
    if (!wallet.address) return;
    await createMutation.mutate({ username, wallet_address: wallet.address });
  }

  return (
    <section className="page">
      <PageHeader
        title="用户资产"
        subtitle="用户余额只从后端本地账本读取，充值确认和提现扣减都会写入 ledger_entries。"
        actions={
          <Button variant="secondary" icon={<RefreshCcw size={16} />} onClick={() => assets.reload()}>
            刷新资产
          </Button>
        }
      />

      <div className="grid two">
        <Card title="创建或绑定演示用户">
          <div className="form">
            <div className="field">
              <label>用户名</label>
              <input className="input" value={username} onChange={(event) => setUsername(event.target.value)} />
            </div>
            <div className="field">
              <label>连接钱包</label>
              {wallet.address ? <AddressText address={wallet.address} full /> : <EmptyState>请先连接 MetaMask</EmptyState>}
            </div>
            <Button disabled={!wallet.address || createMutation.loading} icon={<PlusCircle size={16} />} onClick={handleCreate}>
              创建用户并分配充值地址
            </Button>
            {createMutation.error ? <ErrorState error={createMutation.error} /> : null}
            {createMutation.data ? (
              <div className="state">
                用户 ID：<span className="mono">{createMutation.data.user_id}</span>
                <br />
                创建 txHash：<TxHashLink txHash={createMutation.data.created_tx_hash} />
              </div>
            ) : null}
          </div>
        </Card>

        <Card title="当前用户">
          {hasUser ? (
            <div className="grid">
              <div className="metric">
                <span className="metric-label">user_id</span>
                <span className="metric-value mono">{userId}</span>
              </div>
              {address.loading ? <LoadingState /> : null}
              {address.error ? <ErrorState error={address.error} /> : null}
              {address.data ? (
                <div className="metric">
                  <span className="metric-label">独立充值地址</span>
                  <AddressText address={address.data.deposit_address} full />
                </div>
              ) : null}
            </div>
          ) : (
            <EmptyState>还没有绑定本地用户</EmptyState>
          )}
        </Card>
      </div>

      <div style={{ height: 16 }} />
      {assets.loading ? <LoadingState /> : null}
      {assets.error ? <ErrorState error={assets.error} /> : null}
      {assets.data ? (
        <div className="grid three">
          <Card title="可用余额">
            <div className="metric">
              <span className="metric-value">{formatAtomic(assets.data.available_balance)} MockUSDT</span>
              <span className="metric-label mono">{assets.data.available_balance}</span>
            </div>
          </Card>
          <Card title="冻结余额">
            <div className="metric">
              <span className="metric-value">{formatAtomic(assets.data.frozen_balance)} MockUSDT</span>
              <span className="metric-label mono">{assets.data.frozen_balance}</span>
            </div>
          </Card>
          <Card title="累计充值 / 提现">
            <div className="metric">
              <span className="metric-value">
                {formatAtomic(assets.data.total_deposit)} / {formatAtomic(assets.data.total_withdrawal)}
              </span>
              <span className="metric-label">MockUSDT</span>
            </div>
          </Card>
        </div>
      ) : null}
    </section>
  );
}
