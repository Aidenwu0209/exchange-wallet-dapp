"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import {
  Activity,
  Archive,
  BadgeDollarSign,
  BanknoteArrowDown,
  Blocks,
  Gauge,
  History,
  Landmark,
  ShieldAlert,
  Signature,
  WalletCards
} from "lucide-react";
import { WalletStatus } from "@/src/features/wallet-connect/WalletStatus";

const userNav = [
  { href: "/user/assets", label: "用户资产", icon: WalletCards },
  { href: "/user/deposit", label: "充值地址", icon: BanknoteArrowDown },
  { href: "/user/withdraw", label: "提现申请", icon: BadgeDollarSign },
  { href: "/user/history", label: "历史记录", icon: History },
  { href: "/user/proof-of-reserve", label: "储备金证明", icon: Archive }
];

const adminNav = [
  { href: "/admin/dashboard", label: "管理员看板", icon: Gauge },
  { href: "/admin/sweep", label: "资金归集", icon: Landmark },
  { href: "/admin/risk", label: "风控黑名单", icon: ShieldAlert },
  { href: "/admin/multisig", label: "多签审批", icon: Signature },
  { href: "/admin/reconciliation", label: "资产对账", icon: Activity },
  { href: "/admin/onchain-data", label: "链上数据中心", icon: Blocks }
];

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">EW</div>
          <div className="brand-title">选题二：交易所钱包系统 DApp 开发</div>
        </div>
        <nav className="nav-group">
          <div className="nav-label">用户端</div>
          {userNav.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
        <nav className="nav-group">
          <div className="nav-label">管理员端</div>
          {adminNav.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              <item.icon size={17} />
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="main">
        <header className="topbar">
          <div>
            <strong>Exchange Wallet DApp</strong>
            <div className="muted" style={{ fontSize: 13 }}>
              Anvil / Sepolia / Mainnet-ready
            </div>
          </div>
          <WalletStatus />
        </header>
        {children}
      </main>
    </div>
  );
}
