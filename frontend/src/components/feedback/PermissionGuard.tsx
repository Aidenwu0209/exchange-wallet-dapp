"use client";

import type { ReactNode } from "react";
import { PermissionState } from "./States";
import { useAdminGuard } from "@/src/hooks/useAdminGuard";

export function PermissionGuard({ children }: { children: ReactNode }) {
  const { canOperateAdmin } = useAdminGuard();
  if (!canOperateAdmin) {
    return <PermissionState />;
  }
  return <>{children}</>;
}
