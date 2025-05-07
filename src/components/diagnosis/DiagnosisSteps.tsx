'use client';

import React, { useState } from 'react';
import BasicInfoStep from './BasicInfoStep';
import ResultStep from './ResultStep';
import ChatbotStep from './ChatbotStep';

// 独自の型定義（既存のものとの互換性のため）
interface DiagnosisFormData {
  name: string;
  email: string;
  age?: number | string;
  familySize?: number | string;
  annualIncome?: number | string;
  savings?: number | string;
  mortgageLoanBalance?: number | string;
  monthlyMortgagePayment?: number | string;
  otherDebts?: number | string;
  agreeToPrivacyPolicy: boolean; // 必須フィールド
  [key: string]: any; // チャットボットからの追加フィールド用
}

interface BudgetDiagnosisResult {
  maxBudget: number;
  recommendation: string;
  // 内部で使用する追加のフィールド
  recommendedBudget?: number;
  maxLoanAmount?: number;
  monthlyPayment?: number;
  explanation?: string;
}

// 診断ステップの定義
type Step = 'basicInfo' | 'chatbot' | 'result';

// ステップのタイトル
const stepTitles: Record<Step, string> = {
  basicInfo: '基本情報',
  chatbot: '詳細情報',
  result: '診断結果',
};

// ユーザー情報の型定義
interface UserInfo {
  name: string;
  email: string;
}

// 詳細情報の型定義
type DetailedInfo = Record<string, any>;

// 診断結果の型定義
interface DiagnosisResult {
  recommendedBudget: number;
  maxLoanAmount: number;
  monthlyPayment: number;
  explanation: string;
}

const DiagnosisSteps: React.FC = () => {
  // 現在のステップ
  const [currentStep, setCurrentStep] = useState<Step>('basicInfo');
  
  // 各ステップのデータ
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [detailedInfo, setDetailedInfo] = useState<DetailedInfo | null>(null);
  const [diagnosisResult, setDiagnosisResult] = useState<DiagnosisResult | null>(null);

  // フォームエラー
  const [errors, setErrors] = useState<{
    name: string;
    email: string;
    [key: string]: string;
  }>({
    name: '',
    email: '',
  });

  // フォームデータ
  const [formData, setFormData] = useState<{
    name: string;
    email: string;
    [key: string]: any;
  }>({
    name: '',
    email: '',
  });

  // 入力変更ハンドラ
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // エラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // 基本情報入力完了時の処理
  const handleBasicInfoNext = () => {
    // 基本的なバリデーション
    const newErrors = {
      name: formData.name ? '' : 'お名前を入力してください',
      email: formData.email ? '' : 'メールアドレスを入力してください',
    };
    
    // エラーがあれば更新して処理を中断
    if (newErrors.name || newErrors.email) {
      setErrors(newErrors);
      return;
    }
    
    setUserInfo({
      name: formData.name,
      email: formData.email,
    });
    setCurrentStep('chatbot');
  };

  // 基本情報入力の前に戻る（現在はトップページに戻る処理なし）
  const handleBasicInfoBack = () => {
    // ここではなにもしない
  };

  // チャットボット情報入力完了時の処理
  const handleChatbotComplete = (data: DetailedInfo) => {
    setDetailedInfo(data);
    
    // ここで診断ロジックを実行
    const result = calculateDiagnosis(data);
    setDiagnosisResult(result);
    
    setCurrentStep('result');
  };

  // 基本情報入力に戻る
  const handleBackToBasicInfo = () => {
    setCurrentStep('basicInfo');
  };

  // チャットボット入力に戻る
  const handleBackToChatbot = () => {
    setCurrentStep('chatbot');
  };

  // PDF生成処理
  const handleDownloadPdf = async () => {
    // PDF生成は別の実装で対応
    console.log('PDFをダウンロードします');
  };

  // ミーティング予約処理
  const handleScheduleMeeting = () => {
    // ミーティング予約は別の実装で対応
    console.log('ミーティングを予約します');
  };

  // 最初からやり直す処理
  const handleRestart = () => {
    setCurrentStep('basicInfo');
    setUserInfo(null);
    setDetailedInfo(null);
    setDiagnosisResult(null);
    setFormData({
      name: '',
      email: '',
    });
  };

  // 診断ロジックの計算（簡易版）
  const calculateDiagnosis = (data: DetailedInfo): DiagnosisResult => {
    // 所得から推定予算を計算
    const income = data.headOfHouseholdIncome || 0;
    const spouseIncome = data.spouseIncome || 0;
    const totalIncome = income + spouseIncome;
    
    // 基本予算計算: 年収の5倍を目安
    let recommendedBudget = totalIncome * 5;
    
    // 貯蓄がある場合は加算
    const assets = data.financialAssets || 0;
    recommendedBudget += assets;
    
    // 子供の数に応じて調整
    const childrenCount = data.childrenCount || 0;
    if (childrenCount > 0) {
      // 子供一人あたり200万円減額
      recommendedBudget -= childrenCount * 200;
    }
    
    // 予算下限を設定
    recommendedBudget = Math.max(recommendedBudget, 2000);
    
    // 最大借入可能額（年収の7倍を上限）
    const maxLoanAmount = Math.min(totalIncome * 7, recommendedBudget * 0.9);
    
    // 月々の返済額（金利2%、35年返済と仮定）
    const monthlyPayment = calculateMonthlyPayment(maxLoanAmount, 2, data.loanYears || 35);
    
    // 説明文
    const explanation = generateExplanation(recommendedBudget, maxLoanAmount, monthlyPayment, data);
    
    return {
      recommendedBudget,
      maxLoanAmount,
      monthlyPayment,
      explanation,
    };
  };

  // 月々の返済額を計算
  const calculateMonthlyPayment = (principal: number, interestRate: number, years: number): number => {
    const monthlyRate = interestRate / 100 / 12;
    const payments = years * 12;
    
    if (monthlyRate === 0) return principal / payments;
    
    const x = Math.pow(1 + monthlyRate, payments);
    return (principal * monthlyRate * x) / (x - 1);
  };

  // 説明文を生成
  const generateExplanation = (
    budget: number, 
    loan: number, 
    monthly: number, 
    data: DetailedInfo
  ): string => {
    return `
あなたの状況を分析した結果、適正な住宅購入予算は約${Math.round(budget / 100) * 100}万円と診断しました。
最大借入可能額は約${Math.round(loan / 100) * 100}万円で、月々の返済額は約${Math.round(monthly / 1000) * 1000}円になります。

【分析ポイント】
・世帯年収: ${(data.headOfHouseholdIncome || 0) + (data.spouseIncome || 0)}万円
・貯蓄額: ${data.financialAssets || 0}万円
・お子様の人数: ${data.childrenCount || 0}人
・教育方針: ${data.educationPolicy || '未設定'}

金利が上昇した場合や、今後のライフイベントによって支出が増える可能性も考慮し、
余裕を持った住宅予算計画をおすすめします。
詳しいアドバイスについては、専門家への相談をご検討ください。
    `;
  };

  // 現在のステップに応じてコンポーネントを表示
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'basicInfo':
        return (
          <BasicInfoStep
            formData={formData}
            onChange={handleInputChange}
            onNext={handleBasicInfoNext}
            onBack={handleBasicInfoBack}
            errors={errors}
          />
        );
      case 'chatbot':
        return userInfo ? (
          <ChatbotStep 
            userName={userInfo.name} 
            userId={null}
            onComplete={handleChatbotComplete} 
            onBack={handleBackToBasicInfo} 
          />
        ) : (
          <div>エラーが発生しました。最初からやり直してください。</div>
        );
      case 'result':
        return diagnosisResult && userInfo && detailedInfo ? (
          <ResultStep 
            formData={{ 
              name: userInfo.name, 
              email: userInfo.email, 
              agreeToPrivacyPolicy: true, // 暗黙的に同意したものとする
              age: '',
              familySize: '',
              annualIncome: '',
              savings: '',
              ...detailedInfo 
            }}
            result={{
              maxBudget: diagnosisResult.recommendedBudget,
              recommendation: diagnosisResult.explanation
            }}
            onDownloadPdf={handleDownloadPdf}
            onScheduleMeeting={handleScheduleMeeting}
            onRestart={handleRestart}
          />
        ) : (
          <div>エラーが発生しました。最初からやり直してください。</div>
        );
      default:
        return <div>不明なステップです。</div>;
    }
  };

  // ステッププログレスバーのレンダリング
  const renderStepProgress = () => {
    const steps: Step[] = ['basicInfo', 'chatbot', 'result'];
    const currentIndex = steps.indexOf(currentStep);
    
    return (
      <div className="mb-8">
        <div className="flex justify-between">
          {steps.map((step, index) => (
            <div 
              key={step} 
              className={`text-center flex-1 ${index > 0 ? 'ml-2' : ''}`}
            >
              <div 
                className={`rounded-full h-8 w-8 flex items-center justify-center mx-auto mb-2 
                  ${index <= currentIndex ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
              >
                {index + 1}
              </div>
              <div className={`text-sm ${index <= currentIndex ? 'text-blue-600 font-medium' : 'text-gray-500'}`}>
                {stepTitles[step]}
              </div>
            </div>
          ))}
        </div>
        <div className="flex mt-2">
          {steps.map((step, index) => (
            <React.Fragment key={`line-${step}`}>
              {index > 0 && (
                <div 
                  className={`h-1 flex-1 ${index <= currentIndex ? 'bg-blue-600' : 'bg-gray-200'}`}
                />
              )}
              {index < steps.length - 1 && (
                <div className="w-8" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      {renderStepProgress()}
      {renderCurrentStep()}
    </div>
  );
};

export default DiagnosisSteps; 