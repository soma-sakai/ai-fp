import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const HeroSection: React.FC = () => {
  return (
    <section className="bg-gradient-to-r from-blue-50 to-indigo-50 py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-10 md:mb-0">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">
              AI住宅予算診断で<br />
              <span className="text-blue-600">理想の家づくり</span>を叶える
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              たった1分であなたにぴったりの住宅予算がわかります。<br />
              複雑な計算は必要ありません。簡単な質問に答えるだけ。
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/diagnosis">
                <Button size="lg">無料で診断を始める</Button>
              </Link>
              <Link href="/fp-consultation">
                <Button variant="outline" size="lg">FP相談を予約する</Button>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <div className="bg-white p-6 rounded-xl shadow-lg">
              <div className="bg-blue-100 p-4 rounded-lg mb-4">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">1分でわかる住宅予算診断</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">1</span>
                    <span>簡単な質問に答えるだけで診断開始</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">2</span>
                    <span>AIがあなたの最適な住宅予算を計算</span>
                  </li>
                  <li className="flex items-start">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center mr-2">3</span>
                    <span>診断結果がすぐにわかる</span>
                  </li>
                </ul>
              </div>
              <div className="text-center">
                <Link href="/diagnosis">
                  <Button fullWidth>今すぐ診断する</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 