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
  onDownloadPdf: () => Promise<void>;
  onScheduleMeeting: () => void;
  onRestart: () => void;
  isLoading?: boolean;
}

const ResultStep: React.FC<ResultStepProps> = ({
  formData,
  result,
  onDownloadPdf,
  onScheduleMeeting,
  onRestart,
  isLoading = false
}) => {
  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold mb-2">診断結果</h2>
        <p className="text-gray-600">以下があなたの住宅予算診断結果です</p>
      </div>
      
      <div className="mb-8 p-6 border-2 border-primary rounded-lg bg-light">
        <h3 className="text-xl font-semibold mb-4 text-center">MAX予算ライン</h3>
        <p className="text-4xl font-bold text-accent text-center">
          {result.maxBudget.toLocaleString()}円
        </p>
      </div>
      
      <div className="mb-8">
        <div className="p-4 bg-light border border-gray-light rounded">
          <p className="text-sm text-gray-700">{result.recommendation}</p>
        </div>
      </div>
      
      {/* シミュレーショングラフセクション */}
      <div className="mb-8 relative">
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
        <Button onClick={onDownloadPdf} variant="primary" fullWidth={false} disabled={isLoading}>
          {isLoading ? 
            <span className="flex items-center gap-2">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              PDF生成中...
            </span> 
            : '診断結果をPDFでダウンロード'
          }
        </Button>
        <Button variant="secondary" onClick={onRestart} disabled={isLoading}>
          もう一度診断する
        </Button>
      </div>
    </div>
  );
};

export default ResultStep; 