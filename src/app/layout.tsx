import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "跨產業生涯與專案任務步驟",
  description: "以 Japandi 極簡美學呈現跨產業任務時間軸與進度管理的單頁式應用程式。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
