import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import clsx from "clsx";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap"
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  title: "工作记录追踪器",
  description: "记录件数、单价和月度收益的工作追踪工具"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html className="light" lang="zh-CN">
      <body className={clsx(inter.variable, manrope.variable, "font-body antialiased")}>
        {children}
      </body>
    </html>
  );
}
