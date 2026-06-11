import type { ReactNode } from "react";

export function LoadingState() {
  return <div className="state">加载中...</div>;
}

export function EmptyState({ children = "暂无数据" }: { children?: ReactNode }) {
  return <div className="state">{children}</div>;
}

export function ErrorState({ error }: { error: Error }) {
  return <div className="state">请求失败：{error.message}</div>;
}

export function PermissionState({ children = "当前钱包没有权限执行该操作" }: { children?: ReactNode }) {
  return <div className="state">{children}</div>;
}
