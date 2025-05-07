'use client';

import React from 'react';
import Link from 'next/link';
import Header from '@/components/home/Header';
import Footer from '@/components/home/Footer';
import Button from '@/components/ui/Button';

const FPConsultationPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="py-16">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-center mb-8">ファイナンシャルプランナー相談</h1>
          
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-semibold mb-4">住宅購入のプロがあなたをサポートします</h2>
            
            <p className="text-gray-600 mb-6">
              AI診断で算出された予算をもとに、さらに詳細な住宅購入計画をプロのファイナンシャルプランナーと相談しませんか？
              以下のような内容を詳しくアドバイスいたします。
            </p>
            
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">✓</span>
                <span>具体的な住宅ローンプランの提案と比較</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">✓</span>
                <span>将来のライフプランを考慮した資金計画</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">✓</span>
                <span>税金や補助金制度の活用方法</span>
              </li>
              <li className="flex items-start">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">✓</span>
                <span>住宅購入のリスク管理と保険の見直し</span>
              </li>
            </ul>
            
            <div className="text-center">
              <a href="https://calendly.com/example/fp-consultation" target="_blank" rel="noopener noreferrer">
                <Button size="lg">今すぐ相談日程を調整する</Button>
              </a>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-semibold mb-4">FP相談の流れ</h2>
            
            <ol className="space-y-6 mb-8">
              <li className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 font-bold">1</span>
                <div>
                  <h3 className="font-medium text-lg">日程調整</h3>
                  <p className="text-gray-600">Calendlyから希望の日時を選択し、簡単な質問にお答えください。</p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 font-bold">2</span>
                <div>
                  <h3 className="font-medium text-lg">事前準備</h3>
                  <p className="text-gray-600">メールで送られる準備資料に目を通し、必要情報をご用意ください。</p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 font-bold">3</span>
                <div>
                  <h3 className="font-medium text-lg">オンライン面談（約60分）</h3>
                  <p className="text-gray-600">Zoomで専門家と詳細な住宅購入計画について相談します。</p>
                </div>
              </li>
              
              <li className="flex">
                <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center mr-3 font-bold">4</span>
                <div>
                  <h3 className="font-medium text-lg">提案書の受け取り</h3>
                  <p className="text-gray-600">面談後、詳細な提案書を受け取り、具体的な行動計画を進めます。</p>
                </div>
              </li>
            </ol>
            
            <div className="bg-gray-100 p-4 rounded-lg">
              <p className="text-center text-gray-700">
                まだ診断を受けていませんか？ AI診断で、まずは住宅予算の目安を確認しましょう。
              </p>
              <div className="text-center mt-4">
                <Link href="/diagnosis">
                  <Button variant="outline">AI診断を受ける</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default FPConsultationPage; 