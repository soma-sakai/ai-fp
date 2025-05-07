import React from 'react';
import Link from 'next/link';
import Button from '../ui/Button';

const CtaSection: React.FC = () => {
  return (
    <section className="py-20 bg-blue-600">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-white mb-6">
          今すぐあなたの理想の住宅予算を診断してみませんか？
        </h2>
        <p className="text-xl text-white mb-8 max-w-3xl mx-auto">
          たった1分であなたにぴったりの住宅予算がわかります。
          無料で利用できる簡単な診断ツールで、マイホーム計画の第一歩を踏み出しましょう。
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link href="/diagnosis">
            <Button size="lg" variant="primary" className="bg-white text-blue-600 hover:bg-gray-100">
              無料で診断を始める
            </Button>
          </Link>
          <Link href="/fp-consultation">
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-blue-700">
              FP相談を予約する
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CtaSection; 