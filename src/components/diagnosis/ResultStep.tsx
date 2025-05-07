'use client';

import React, { Suspense } from 'react';
import Button from '../ui/Button';
import { BudgetDiagnosisResult, DiagnosisFormData } from '@/types';
import dynamic from 'next/dynamic';

// SimulationPanelをダイナミックインポート（クライアントサイドレンダリング用）
const SimulationPanel = dynamic(
  () => import('../simulation/SimulationPanel'),
  { ssr: false, loading: () => <p className="text-center py-4">グラフをロード中...</p> }
);

interface ResultStepProps {
  formData: DiagnosisFormData;
  result: BudgetDiagnosisResult;
  onDownloadPdf: () => void;
  onScheduleMeeting: () => void;
  onRestart: () => void;
}

const ResultStep: React.FC<ResultStepProps> = ({
  formData,
  result,
  onDownloadPdf,
  onScheduleMeeting,
  onRestart,
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">診断結果</h2>
        <p className="text-gray-600">以下があなたの住宅予算診断結果です</p>
      </div>
      
      <div className="mb-8 p-6 border-2 border-blue-500 rounded-lg bg-blue-50">
        <h3 className="text-xl font-semibold mb-4 text-center">MAX予算ライン</h3>
        <p className="text-4xl font-bold text-red-600 text-center">
          {result.maxBudget.toLocaleString()}円
        </p>
      </div>
      
      <div className="mb-8">
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
          <p className="text-sm text-gray-700">{result.recommendation}</p>
        </div>
      </div>
      
      {/* シミュレーショングラフセクション */}
      <div className="mb-8">
        <Suspense fallback={<div className="text-center py-4">シミュレーションをロード中...</div>}>
          <SimulationPanel 
            formData={formData} 
            maxBudget={result.maxBudget} 
            diagnosisResultId={result.diagnosisResultId} 
          />
        </Suspense>
      </div>
      
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-3">次のステップ</h3>
        <p className="text-sm text-gray-600 mb-4">
          より詳細な住宅予算の相談や、理想の住まいについて専門家と話し合いませんか？
          FP相談で、あなたの住宅購入計画を詳しくサポートします。
        </p>
        
        <Button onClick={onScheduleMeeting} fullWidth={true}>
          FP相談の日程を調整する
        </Button>
      </div>
      
      <div className="flex flex-col sm:flex-row gap-4">
        <Button variant="outline" onClick={onDownloadPdf}>
          診断結果をPDFでダウンロード
        </Button>
        <Button variant="secondary" onClick={onRestart}>
          もう一度診断する
        </Button>
      </div>
    </div>
  );
};

export default ResultStep; 