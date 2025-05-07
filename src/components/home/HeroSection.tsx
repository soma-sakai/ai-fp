import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const HeroSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-3xl md:text-5xl font-bold mb-4">
              AIがあなたの<span className="text-gray-800">理想の家づくり</span>を叶える
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8">
              たった1分のチャットで最適な住宅予算とローン計画を診断。<br />
              あなたの家計・収入に合わせた無理のない将来設計をご提案します。
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/diagnosis">
                <Button variant="primary" size="lg">無料診断を始める</Button>
              </Link>
              <Link href="/fp-consultation">
                <Button variant="outline" size="lg">FP相談を予約する</Button>
              </Link>
            </div>
          </div>
          
          {/* Features boxes */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-gray-100 p-4 rounded-lg mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">1分でわかる住宅予算診断</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-2">1</span>
                  <span>チャットで簡単な質問に答えるだけ</span>
                </li>
                <li className="flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-2">2</span>
                  <span>AIが最適な住宅予算を即時診断</span>
                </li>
                <li className="flex items-center">
                  <span className="flex-shrink-0 w-6 h-6 bg-gray-800 text-white rounded-full flex items-center justify-center mr-2">3</span>
                  <span>将来の資産形成シミュレーションを確認</span>
                </li>
              </ul>
            </div>
            
            {/* Other boxes */}
            <div className="bg-white shadow-md p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">複数シナリオの比較</h3>
              <p className="text-gray-600">
                現状維持・借入額調整・支出削減など複数のシナリオを比較し、最適な選択肢を見つけられます。
              </p>
            </div>
            
            <div className="bg-white shadow-md p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">専門家による相談</h3>
              <p className="text-gray-600">
                診断結果をもとにファイナンシャルプランナーに無料相談できます。より詳しいアドバイスが欲しい方に。
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection; 