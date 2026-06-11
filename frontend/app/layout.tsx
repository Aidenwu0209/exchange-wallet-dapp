import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "@/src/components/layout/Providers";
import { AppShell } from "@/src/components/layout/AppShell";

export const metadata: Metadata = {
  title: "选题二：交易所钱包系统 DApp 开发",
  description: "Exchange wallet DApp with deposit scanning, risk control, multisig, reconciliation and Proof of Reserve"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
