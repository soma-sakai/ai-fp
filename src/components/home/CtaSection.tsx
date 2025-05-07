import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const CtaSection: React.FC = () => {
  return (
    <section className="py-20 bg-gray-800">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          あなたの理想の住まいを無理なく実現する第一歩
        </h2>
        <p className="text-xl text-gray-200 mb-8 max-w-3xl mx-auto">
          AIによる診断とシミュレーションで、家計に合った最適な住宅予算を把握しましょう。
          たった1分で完了します。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/diagnosis">
            <Button size="lg" variant="primary" className="bg-white text-gray-800 hover:bg-gray-100">
              無料診断を始める
            </Button>
          </Link>
          <Link href="/fp-consultation">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-gray-700">
              FP相談を予約する
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 