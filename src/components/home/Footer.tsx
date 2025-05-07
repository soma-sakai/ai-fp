import React from 'react';
import Link from 'next/link';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-gray-800 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-lg font-semibold mb-4">住宅予算AI診断</h3>
            <p className="text-gray-400">
              AI技術を活用したシンプルな住宅予算診断ツールで、あなたの理想の住まいづくりをサポートします。
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">サービス</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/diagnosis" className="text-gray-400 hover:text-white">
                  AI予算診断
                </Link>
              </li>
              <li>
                <Link href="/fp-consultation" className="text-gray-400 hover:text-white">
                  FP相談
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">会社情報</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-gray-400 hover:text-white">
                  会社概要
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-gray-400 hover:text-white">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-gray-400 hover:text-white">
                  利用規約
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-4">お問い合わせ</h3>
            <address className="text-gray-400 not-italic">
              <p>〒000-0000</p>
              <p>東京都千代田区〇〇町1-1-1</p>
              <p className="mt-2">Email: info@example.com</p>
              <p>TEL: 03-1234-5678</p>
            </address>
          </div>
        </div>
        
        <div className="border-t border-gray-700 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; {currentYear} 住宅予算AI診断. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 