import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SiteFooter } from "../components/site-footer";
import { SiteHeader } from "../components/site-header";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "AI 驱动知识平台",
    template: "%s | AI 驱动知识平台"
  },
  description: "面向 AI 协作、知识治理与文档运营的知识库站点壳体。",
  keywords: ["AI", "知识库", "文档", "OpenSpec", "内容管理"]
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="site-shell">
          <SiteHeader />
          <main>{children}</main>
          <SiteFooter />
        </div>
      </body>
    </html>
  );
}
