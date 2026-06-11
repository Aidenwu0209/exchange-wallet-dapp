"use client";

import { QRCodeSVG } from "qrcode.react";
import { Coins, RefreshCcw, SearchCheck } from "lucide-react";
import { useState } from "react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { AddressText } from "@/src/components/ui/AddressText";
import { TxHashLink } from "@/src/components/ui/TxHashLink";
import { StatusBadge } from "@/src/components/ui/StatusBadge";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { useActiveUser } from "@/src/hooks/useActiveUser";
import { useApiMutation } from "@/src/hooks/useApiMutation";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { useWalletStatus } from "@/src/hooks/useWalletStatus";
import { confirmDeposits, faucetMockUsdt, getDepositAddress, getDepositHistory, scanDeposits } from "@/src/services/wallet-api";
import { formatAtomic } from "@/src/utils/format";

export function DepositPanel() {
  const { userId, hasUser } = useActiveUser();
  const wallet = useWalletStatus();
  const [faucetAmount, setFaucetAmount] = useState("1000000000000000000000");
  const address = useApiQuery(() => getDepositAddress(userId), [userId], { enabled: hasUser });
  const history = useApiQuery(() => getDepositHistory(userId), [userId], { enabled: hasUser });
  const faucet = useApiMutation(faucetMockUsdt);
  const scan = useApiMutation(scanDeposits);
  const confirm = useApiMutation(confirmDeposits);

  async function refreshHistory() {
    if (!hasUser) return;
    await history.reload();
  }

  return (
    <section className="page">
      <PageHeader title="充值地址和确认入账" subtitle="每个用户拥有独立 DepositWallet，后端扫描 MockUSDT Transfer 事件并按确认数入账。" />
      {!hasUser ? <EmptyState>请先在用户资产页创建用户</EmptyState> : null}
      {address.loading ? <LoadingState /> : null}
      {address.error ? <ErrorState error={address.error} /> : null}
      {address.data ? (
        <div className="grid two">
          <Card title="独立充值地址">
            <div className="grid">
              <AddressText address={address.data.deposit_address} full />
              <div className="qr-box">
                <QRCodeSVG value={address.data.qr_payload} size={150} />
              </div>
              <div className="muted">Chain ID: {address.data.chain_id}</div>
            </div>
          </Card>
          <Card title="测试币和扫描">
            <div className="form">
              <div className="field">
                <label>Faucet 领取到当前钱包</label>
                <input className="input" value={faucetAmount} onChange={(event) => setFaucetAmount(event.target.value)} />
              </div>
              <div className="button-row">
                <Button
                  icon={<Coins size={16} />}
                  disabled={!wallet.address || faucet.loading}
                  onClick={() => wallet.address && faucet.mutate({ to_address: wallet.address, amount: faucetAmount })}
                >
                  领取 MockUSDT
                </Button>
                <Button
                  variant="secondary"
                  icon={<SearchCheck size={16} />}
                  disabled={scan.loading}
                  onClick={async () => {
                    await scan.mutate(undefined);
                    await refreshHistory();
                  }}
                >
                  扫描区块
                </Button>
                <Button
                  variant="secondary"
                  icon={<RefreshCcw size={16} />}
                  disabled={confirm.loading}
                  onClick={async () => {
                    await confirm.mutate(undefined);
                    await refreshHistory();
                  }}
                >
                  确认入账
                </Button>
              </div>
              {faucet.data ? <div className="state">Faucet txHash：<TxHashLink txHash={faucet.data.tx_hash} /></div> : null}
              {scan.data ? <div className="state">发现 {scan.data.detected_events} 条充值事件，新增 {scan.data.created_deposits} 条。</div> : null}
              {confirm.data ? <div className="state">确认 {confirm.data.confirmed_count} 条，仍待确认 {confirm.data.pending_count} 条。</div> : null}
              {faucet.error ? <ErrorState error={faucet.error} /> : null}
              {scan.error ? <ErrorState error={scan.error} /> : null}
              {confirm.error ? <ErrorState error={confirm.error} /> : null}
            </div>
          </Card>
        </div>
      ) : null}

      <div style={{ height: 16 }} />
      <Card title="充值历史">
        {history.loading ? <LoadingState /> : null}
        {history.error ? <ErrorState error={history.error} /> : null}
        {history.data?.items.length === 0 ? <EmptyState /> : null}
        {history.data?.items.length ? (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>状态</th>
                  <th>金额</th>
                  <th>确认数</th>
                  <th>txHash</th>
                  <th>检测区块</th>
                </tr>
              </thead>
              <tbody>
                {history.data.items.map((item) => (
                  <tr key={item.deposit_id}>
                    <td><StatusBadge value={item.status} /></td>
                    <td>{formatAtomic(item.amount)} MockUSDT</td>
                    <td>{item.confirmations}</td>
                    <td><TxHashLink txHash={item.tx_hash} /></td>
                    <td>{item.detected_block}</td>
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
