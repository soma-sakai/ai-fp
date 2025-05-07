'use client';

import React from 'react';
import DiagnosisForm from '@/components/diagnosis/DiagnosisForm';
import { useRouter } from 'next/navigation';

const DiagnosisPage: React.FC = () => {
  const router = useRouter();
  
  const handleRefresh = () => {
    // ページを強制的にリロード
    window.location.reload();
  };
  
  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-center mb-4">AI住宅予算診断</h1>
      
      <p className="text-center mb-8">
        簡単な質問に答えて、あなたの理想的な住宅予算を診断します。<br />
        あなたの状況に合わせた最適なMAX予算ラインを算出します。
      </p>
      
      <div className="flex justify-end mb-4">
        <button 
          onClick={handleRefresh}
          className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          診断をやり直す
        </button>
      </div>
      
      <DiagnosisForm />
    </div>
  );
};

export default DiagnosisPage; 