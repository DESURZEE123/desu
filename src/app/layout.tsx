import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "工作记录追踪器",
  description: "记录件数、单价和月度收益的工作追踪工具"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="light" lang="zh-CN">
      <body className="font-body antialiased">{children}</body>
    </html>
  );
}
