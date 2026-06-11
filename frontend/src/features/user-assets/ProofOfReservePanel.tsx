"use client";

import { ShieldCheck } from "lucide-react";
import { PageHeader } from "@/src/components/layout/PageHeader";
import { Button } from "@/src/components/ui/Button";
import { Card } from "@/src/components/ui/Card";
import { EmptyState, ErrorState, LoadingState } from "@/src/components/feedback/States";
import { useActiveUser } from "@/src/hooks/useActiveUser";
import { useApiQuery } from "@/src/hooks/useApiQuery";
import { getProofOfReserve } from "@/src/services/wallet-api";

export function ProofOfReservePanel() {
  const { userId, hasUser } = useActiveUser();
  const proof = useApiQuery(() => getProofOfReserve(userId), [userId], { enabled: hasUser });

  return (
    <section className="page">
      <PageHeader
        title="Proof of Reserve 查询"
        subtitle="用户可以查询自己的叶子节点、Merkle Proof、Merkle Root 和 snapshotHash。"
        actions={
          <Button variant="secondary" icon={<ShieldCheck size={16} />} disabled={!hasUser} onClick={() => proof.reload()}>
            验证证明
          </Button>
        }
      />
      {!hasUser ? <EmptyState>请先创建用户</EmptyState> : null}
      {proof.loading ? <LoadingState /> : null}
      {proof.error ? <ErrorState error={proof.error} /> : null}
      {proof.data ? (
        <Card title="储备金证明">
          <pre className="state mono" style={{ overflowX: "auto" }}>
            {JSON.stringify(proof.data, null, 2)}
          </pre>
        </Card>
      ) : null}
    </section>
  );
}
