import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI簡易住宅予算診断ツール | 理想の家づくりをサポート",
  description: "たった1分であなたにぴったりの住宅予算がわかります。年収や家族構成に合わせた最適な住宅予算を無料で診断します。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
