import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "安心予算AI診断＆シミュレーションツール",
  description: "チャット形式で家計状況を診断し、将来の資産形成をシミュレーションするWebアプリケーション",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} min-h-screen bg-gray-50`}>
        {/* ヘッダー */}
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <Link href="/" className="flex-shrink-0 flex items-center">
                  <span className="text-blue-600 font-bold text-xl">安心予算</span>
                </Link>
                <nav className="ml-6 flex space-x-4">
                  <Link 
                    href="/diagnosis" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    診断
                  </Link>
                  <Link 
                    href="/simulation" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    シミュレーション
                  </Link>
                  <Link 
                    href="/consultation" 
                    className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-100"
                  >
                    FP相談
                  </Link>
                </nav>
              </div>
              <div className="flex items-center">
                <Link 
                  href="/diagnosis" 
                  className="ml-3 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                >
                  診断を始める
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* メインコンテンツ */}
        <main>{children}</main>

        {/* フッター */}
        <footer className="bg-white border-t border-gray-200 mt-12">
          <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="md:flex md:items-center md:justify-between">
              <div className="flex justify-center md:justify-start space-x-6">
                <Link href="/" className="text-gray-400 hover:text-gray-500">
                  トップページ
                </Link>
                <Link href="/about" className="text-gray-400 hover:text-gray-500">
                  サービスについて
                </Link>
                <Link href="/terms" className="text-gray-400 hover:text-gray-500">
                  利用規約
                </Link>
                <Link href="/privacy" className="text-gray-400 hover:text-gray-500">
                  プライバシーポリシー
                </Link>
              </div>
              <div className="mt-8 md:mt-0">
                <p className="text-center md:text-right text-base text-gray-400">
                  &copy; {new Date().getFullYear()} 安心予算AI診断＆シミュレーションツール
                </p>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
