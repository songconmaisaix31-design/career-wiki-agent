import type { Metadata } from "next";
import { Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale } from "next-intl/server";

import { cn } from "@/lib/utils";

import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Career Wiki Agent | 从岗位匹配到定制简历",
  description: "面向应届生和初入职场人群的求职准备工作台：分析目标 JD、匹配项目、生成证据可信的定制简历，并规划面试冲刺任务。",
  icons: {
    icon: "/brand/lujie-mark.svg",
    shortcut: "/brand/lujie-mark.svg",
    apple: "/brand/lujie-mark.svg",
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={cn("font-sans", geist.variable)}>
      <body><NextIntlClientProvider>{children}</NextIntlClientProvider></body>
    </html>
  );
}
