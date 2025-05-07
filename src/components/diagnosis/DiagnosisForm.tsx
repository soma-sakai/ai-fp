'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ProgressBar from '../ui/ProgressBar';
import PrivacyPolicyStep from './PrivacyPolicyStep';
import BasicInfoStep from './BasicInfoStep';
import DetailedInfoStep from './DetailedInfoStep';
import ChatbotStep from './ChatbotStep';
import ResultStep from './ResultStep';
import { DiagnosisStep, DiagnosisFormData, BudgetDiagnosisResult } from '@/types';
import { generateBudgetDiagnosis } from '@/lib/budgetCalculator';
import { generatePDF } from '@/lib/pdfGenerator';
import { supabase, saveData, getChatbotProgressByEmail } from '@/lib/supabase';
import { getJSTTimestamp } from '@/lib/dateUtils';

// 初期フォームデータ
const initialFormData: DiagnosisFormData = {
  name: '',
  email: '',
  age: '',
  familySize: '',
  annualIncome: '',
  savings: '',
  mortgageLoanBalance: '',
  monthlyMortgagePayment: '',
  otherDebts: '',
  agreeToPrivacyPolicy: false,
};

// 初期エラー状態
const initialErrors = {
  name: '',
  email: '',
  age: '',
  familySize: '',
  annualIncome: '',
  savings: '',
  mortgageLoanBalance: '',
  monthlyMortgagePayment: '',
  otherDebts: '',
};

// ステップのテキスト
const stepLabels = ['同意', '基本情報', 'チャットボット', '結果'];

// メールアドレスによる途中保存データ復元のためのコンポーネント
const EmailRestorationForm: React.FC<{
  onRestore: (userId: string) => void;
  onCancel: () => void;
}> = ({ onRestore, onCancel }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      if (!email.trim()) {
        setError('メールアドレスを入力してください');
        return;
      }
      
      // メールアドレスからデータを取得
      const { data, error, userId } = await getChatbotProgressByEmail(email);
      
      if (error) {
        console.error('データ取得エラー:', error);
        setError('データの取得中にエラーが発生しました');
        return;
      }
      
      if (!data || !userId) {
        setError('指定されたメールアドレスの保存データが見つかりませんでした');
        return;
      }
      
      // 見つかったユーザーIDで復元処理を実行
      onRestore(userId);
    } catch (err) {
      console.error('復元処理中にエラーが発生しました:', err);
      setError('予期せぬエラーが発生しました');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-xl font-bold mb-4">以前の回答データを復元</h2>
      <p className="mb-4">以前に診断を途中まで行ったメールアドレスを入力してください。</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="例: example@example.com"
          />
        </div>
        
        {error && (
          <div className="mb-4 text-red-500 text-sm">
            {error}
          </div>
        )}
        
        <div className="flex justify-between">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700"
          >
            キャンセル
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md"
            disabled={isLoading}
          >
            {isLoading ? '確認中...' : 'データを復元'}
          </button>
        </div>
      </form>
    </div>
  );
};

const DiagnosisForm: React.FC = () => {
  const router = useRouter();
  const [formData, setFormData] = useState<DiagnosisFormData>(initialFormData);
  const [errors, setErrors] = useState(initialErrors);
  const [currentStep, setCurrentStep] = useState<DiagnosisStep>(DiagnosisStep.PRIVACY_POLICY);
  const [stepIndex, setStepIndex] = useState(0);
  const [diagnosisResult, setDiagnosisResult] = useState<BudgetDiagnosisResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [showRestorationForm, setShowRestorationForm] = useState(false);

  // ステップのインデックスを更新
  useEffect(() => {
    switch (currentStep) {
      case DiagnosisStep.PRIVACY_POLICY:
        setStepIndex(0);
        break;
      case DiagnosisStep.BASIC_INFO:
        setStepIndex(1);
        break;
      case DiagnosisStep.CHATBOT:
        setStepIndex(2);
        break;
      case DiagnosisStep.RESULT:
        setStepIndex(3);
        break;
      default:
        setStepIndex(0);
    }
  }, [currentStep]);

  // フォーム入力処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    
    // エラーをクリア
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  // フォームのバリデーション
  const validateBasicInfo = (): boolean => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    if (!formData.name) {
      newErrors.name = 'お名前は必須です';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'メールアドレスは必須です';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = '有効なメールアドレスを入力してください';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateDetailedInfo = (): boolean => {
    const newErrors = { ...initialErrors };
    let isValid = true;

    if (!formData.savings && formData.savings !== 0) {
      newErrors.savings = '貯金額は必須です';
      isValid = false;
    } else if (Number(formData.savings) < 0) {
      newErrors.savings = '貯金額は0以上で入力してください';
      isValid = false;
    }

    if (formData.mortgageLoanBalance && Number(formData.mortgageLoanBalance) < 0) {
      newErrors.mortgageLoanBalance = '住宅ローン残高は0以上で入力してください';
      isValid = false;
    }

    if (formData.monthlyMortgagePayment && Number(formData.monthlyMortgagePayment) < 0) {
      newErrors.monthlyMortgagePayment = '住宅ローン月額返済額は0以上で入力してください';
      isValid = false;
    }

    if (formData.otherDebts && Number(formData.otherDebts) < 0) {
      newErrors.otherDebts = 'その他負債額は0以上で入力してください';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // ユーザー情報をusersテーブルに保存
  const saveUserToSupabase = async (userData: { name: string; email: string }) => {
    try {
      console.log('ユーザー情報をusersテーブルに保存中...');
      
      // usersテーブルに保存するデータを準備
      const userRecord = {
        name: userData.name,
        email: userData.email,
        created_at: getJSTTimestamp(),
        last_login: getJSTTimestamp()
      };
      
      // 保存前にデータをコンソールに出力（デバッグ用）
      console.log('保存するユーザーデータ:', userRecord);
      
      // 保存関数を呼び出し
      const { data, error } = await saveData('users', userRecord);
      
      if (error) {
        console.error('ユーザー情報の保存中にエラーが発生しました:', error);
        console.error('エラーの詳細:', JSON.stringify(error));
        return { success: false, userId: null };
      }
      
      // データから安全にIDを取得
      console.log('保存結果データ:', data);
      const userId = Array.isArray(data) && data.length > 0 
        ? data[0]?.id 
        : (data as any)?.id || null;
        
      console.log('ユーザー情報が正常に保存されました。ユーザーID:', userId);
      return { success: true, userId };
    } catch (error) {
      console.error('ユーザー情報の保存処理中に例外が発生しました:', error);
      return { success: false, userId: null };
    }
  };

  // ステップの移動処理
  const handlePrivacyPolicyNext = () => {
    if (formData.agreeToPrivacyPolicy) {
      setCurrentStep(DiagnosisStep.BASIC_INFO);
    }
  };

  const handleBasicInfoNext = async () => {
    if (validateBasicInfo()) {
      try {
        // ユーザー情報をusersテーブルに保存
        const { success, userId: newUserId } = await saveUserToSupabase({
          name: formData.name,
          email: formData.email
        });
        
        if (success && newUserId) {
          console.log('ユーザー情報が保存されました。ユーザーID:', newUserId);
          // 保存されたユーザーIDを状態に保存
          setUserId(newUserId);
        } else {
          console.warn('ユーザー情報の保存に問題が発生しましたが、診断は続行します');
        }
        
        // 次のステップへ進む
        setCurrentStep(DiagnosisStep.CHATBOT);
      } catch (error) {
        console.error('ユーザー情報の保存中にエラーが発生しました:', error);
        // エラーが発生しても次のステップへ進む
        setCurrentStep(DiagnosisStep.CHATBOT);
      }
    }
  };

  const handleBasicInfoBack = () => {
    setCurrentStep(DiagnosisStep.PRIVACY_POLICY);
  };

  const handleDetailedInfoNext = () => {
    if (validateDetailedInfo()) {
      setCurrentStep(DiagnosisStep.CHATBOT);
    }
  };

  const handleDetailedInfoBack = () => {
    setCurrentStep(DiagnosisStep.BASIC_INFO);
  };

  // Supabaseに診断結果を保存
  const saveResultToSupabase = async (formData: any, result: BudgetDiagnosisResult) => {
    try {
      console.log('診断結果をデータベースに保存中...');
      
      // フォームデータからチャットボットデータを取り出す
      const { chatbotData, ...restFormData } = formData;
      
      // 基本情報を準備
      const userData = {
        name: restFormData.name,
        email: restFormData.email,
        user_id: userId, // ユーザーIDとの紐付け
        
        // 基本情報
        age: typeof restFormData.age === 'string' && restFormData.age ? parseInt(restFormData.age) : null,
        family_size: typeof restFormData.familySize === 'string' && restFormData.familySize
          ? parseInt(restFormData.familySize.replace(/[^0-9]/g, '')) 
          : null,
        annual_income: typeof restFormData.annualIncome === 'string' 
          ? parseAmountFromString(restFormData.annualIncome)
          : (typeof restFormData.annualIncome === 'number' ? restFormData.annualIncome : null),
        savings: typeof restFormData.savings === 'string'
          ? parseAmountFromString(restFormData.savings)
          : (typeof restFormData.savings === 'number' ? restFormData.savings : null),
        mortgage_loan_balance: restFormData.mortgageLoanBalance 
          ? (typeof restFormData.mortgageLoanBalance === 'string'
            ? parseAmountFromString(restFormData.mortgageLoanBalance)
            : restFormData.mortgageLoanBalance)
          : null,
        monthly_mortgage_payment: restFormData.monthlyMortgagePayment
          ? (typeof restFormData.monthlyMortgagePayment === 'string'
            ? parseAmountFromString(restFormData.monthlyMortgagePayment)
            : restFormData.monthlyMortgagePayment)
          : null,
        other_debts: restFormData.otherDebts
          ? (typeof restFormData.otherDebts === 'string'
            ? parseAmountFromString(restFormData.otherDebts)
            : restFormData.otherDebts)
          : null,
        
        // 診断結果
        max_budget: result.maxBudget,
        recommendation: result.recommendation,
        
        // チャットボットからの追加データ - 整理して型を適切に処理
        head_of_household_age: chatbotData?.headOfHouseholdAge || null,
        has_spouse: chatbotData?.hasSpouse || null,
        spouse_age: chatbotData?.spouseAge || null,
        spouse_income: chatbotData?.spouseIncome 
          ? parseAmountFromString(chatbotData.spouseIncome) 
          : null,
        children_count: chatbotData?.childrenCount 
          ? parseInt(chatbotData.childrenCount.replace(/[^0-9]/g, '')) || null
          : null,
        children_ages: chatbotData?.childrenAges || null,
        plan_more_children: chatbotData?.planToHaveMoreChildren || null,
        maternity_leave_plan: chatbotData?.maternityLeavePlan || null,
        
        // 資産関連情報
        financial_assets: chatbotData?.financialAssets 
          ? parseAmountFromString(chatbotData.financialAssets) 
          : null,
        has_retirement_bonus: chatbotData?.hasRetirementBonus || null,
        retirement_bonus_amount: chatbotData?.retirementBonusAmount 
          ? parseAmountFromString(chatbotData.retirementBonusAmount) 
          : null,
        
        // 投資関連情報 - 新規追加
        initial_investment: chatbotData?.initialInvestment 
          ? parseAmountFromString(chatbotData.initialInvestment)
          : null,
        monthly_contribution: chatbotData?.monthlyContribution 
          ? parseAmountFromString(chatbotData.monthlyContribution)
          : null,
        investment_yield: chatbotData?.investmentYield 
          ? parseFloat(chatbotData.investmentYield.replace(/[^0-9.]/g, ''))
          : null,
        
        // 支出関連情報
        plan_to_sell_house: chatbotData?.planToSellHouse || null,
        current_rent: chatbotData?.currentRent 
          ? parseAmountFromString(chatbotData.currentRent) 
          : null,
        current_insurance: chatbotData?.currentInsurance 
          ? parseAmountFromString(chatbotData.currentInsurance) 
          : null,
        monthly_living_expenses: chatbotData?.monthlyLivingExpenses 
          ? parseAmountFromString(chatbotData.monthlyLivingExpenses) 
          : null,
        hobby_expenses: chatbotData?.hobbyExpenses 
          ? parseAmountFromString(chatbotData.hobbyExpenses) 
          : null,
        travel_frequency: chatbotData?.travelFrequency || null,
        
        // 教育・退職関連
        education_policy: chatbotData?.educationPolicy || null,
        retirement_age: chatbotData?.retirementAge || null,
        
        // ローン関連
        loan_years: chatbotData?.loanYears 
          ? parseInt(chatbotData.loanYears.replace(/[^0-9]/g, '')) || null
          : null,
        expected_interest_rate: chatbotData?.expectedInterestRate 
          ? parseFloat(chatbotData.expectedInterestRate.replace(/[^0-9.]/g, '')) || null
          : null,
        
        // 追加データをJSONBフィールドにも保存
        additional_data: {
          chatbot_data: chatbotData,
          original_form_data: restFormData,
          processed_data: {
            // 前処理済みデータ - デバッグ用
            annual_income: typeof restFormData.annualIncome === 'string' 
              ? parseAmountFromString(restFormData.annualIncome)
              : (typeof restFormData.annualIncome === 'number' ? restFormData.annualIncome : null),
            savings: typeof restFormData.savings === 'string'
              ? parseAmountFromString(restFormData.savings)
              : (typeof restFormData.savings === 'number' ? restFormData.savings : null),
          }
        },
        
        // 保存日時（日本時間）
        created_at: getJSTTimestamp()
      };
      
      // 保存前にデータをコンソールに出力（デバッグ用）
      console.log('保存するデータ:', userData);
      
      // 保存関数を呼び出し
      const { data, error } = await saveData('diagnosis_results', userData);
      
      if (error) {
        console.error('データ保存中にエラーが発生しました:', error);
        console.error('エラーの詳細:', JSON.stringify(error));
        return { success: false, resultId: null };
      }
      
      console.log('診断データが正常に保存されました:', data);
      
      // 診断結果IDを取得
      const resultId = Array.isArray(data) && data.length > 0 
        ? data[0]?.id 
        : (data as any)?.id || null;
      
      if (resultId) {
        console.log('保存された診断結果ID:', resultId);
      }
      
      return { success: true, resultId };
    } catch (error) {
      console.error('データ保存処理中に例外が発生しました:', error);
      // エラーを通知するが処理は続行
      return { success: false, resultId: null };
    }
  };

  const handleChatbotNext = async (chatbotData: Record<string, any>) => {
    try {
      setIsProcessing(true);
      
      // チャットボットから得られたデータを詳細にログ出力
      console.log('チャットボットから受け取ったデータ:', chatbotData);
      console.log('現在のフォームデータ:', formData);
      
      // 入力データに必要なフィールドを統合
      const budgetInputData = {
        ...formData,
        ...chatbotData,
        // 文字列の数値変換
        age: Number(formData.age || chatbotData.age || 30),
        familySize: Number(formData.familySize || chatbotData.familySize || 1),
        annualIncome: chatbotData.annualIncome || formData.annualIncome || '5000000',
        savings: chatbotData.savings || formData.savings || '5000000',
        mortgageLoanBalance: formData.mortgageLoanBalance || undefined,
        monthlyMortgagePayment: formData.monthlyMortgagePayment || undefined,
        otherDebts: formData.otherDebts || undefined,
      };
      
      console.log('診断に使用する統合データ:', budgetInputData);
      
      // 文字列の場合の処理方法をチェック
      if (typeof budgetInputData.annualIncome === 'string') {
        console.log('年収の数値変換:', parseAmountFromString(budgetInputData.annualIncome));
      }
      if (typeof budgetInputData.savings === 'string') {
        console.log('貯蓄額の数値変換:', parseAmountFromString(budgetInputData.savings));
      }

      // 診断結果を計算
      const result = generateBudgetDiagnosis(budgetInputData);
      console.log('計算された診断結果:', result);

      // Supabaseに結果を保存
      const { success, resultId } = await saveResultToSupabase({
        ...budgetInputData,
        chatbotData // チャットボットデータを個別に保存
      }, result);
      
      if (success) {
        console.log('診断データが正常に保存されました。診断ID:', resultId);
        // 診断結果にIDを追加
        result.diagnosisResultId = resultId;
        console.log('診断結果にIDを設定しました:', result);
      } else {
        console.warn('診断データの保存に問題が発生しました。シミュレーションが制限されます。');
      }
      
      // 診断結果をステートに保存
      setDiagnosisResult(result);
      console.log('最終的な診断結果(withID):', result);

      // 次のステップへ
      setCurrentStep(DiagnosisStep.RESULT);
    } catch (error) {
      console.error('診断結果の生成中にエラーが発生しました:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatbotBack = () => {
    setCurrentStep(DiagnosisStep.BASIC_INFO);
  };

  // PDF ダウンロード処理
  const handleDownloadPdf = () => {
    if (diagnosisResult && formData) {
      const numericFormData = {
        ...formData,
        age: Number(formData.age || 0),
        familySize: Number(formData.familySize || 0),
        annualIncome: Number(formData.annualIncome || 0),
        savings: Number(formData.savings || 0),
        mortgageLoanBalance: formData.mortgageLoanBalance ? Number(formData.mortgageLoanBalance) : 0,
        monthlyMortgagePayment: formData.monthlyMortgagePayment ? Number(formData.monthlyMortgagePayment) : 0,
        otherDebts: formData.otherDebts ? Number(formData.otherDebts) : 0,
      };

      const pdfBlob = generatePDF(numericFormData, diagnosisResult);
      const url = URL.createObjectURL(pdfBlob);
      
      // ダウンロードリンクを作成
      const a = document.createElement('a');
      a.href = url;
      a.download = `住宅予算診断結果_${formData.name}.pdf`;
      document.body.appendChild(a);
      a.click();
      
      // クリーンアップ
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  };

  // FP相談の日程調整ページへ遷移
  const handleScheduleMeeting = () => {
    // 別のページや外部サービスへのリンク
    window.open('https://calendly.com/example/fp-consultation', '_blank');
  };

  // 診断をリセットして最初から始める
  const handleRestart = () => {
    setFormData(initialFormData);
    setErrors(initialErrors);
    setCurrentStep(DiagnosisStep.PRIVACY_POLICY);
    setDiagnosisResult(null);
  };

  // メールによる復元ボタンを表示する関数を追加
  const showEmailRestoration = () => {
    setShowRestorationForm(true);
  };
  
  // 復元処理
  const handleRestoration = (restoredUserId: string) => {
    // ユーザーIDを設定
    setUserId(restoredUserId);
    // 復元フォームを非表示
    setShowRestorationForm(false);
    // チャットボットステップに移動
    setCurrentStep(DiagnosisStep.CHATBOT);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ProgressBar steps={stepLabels} currentStep={stepIndex} />
      
      {currentStep === DiagnosisStep.PRIVACY_POLICY && (
        <>
          <PrivacyPolicyStep
            agreeToPrivacyPolicy={formData.agreeToPrivacyPolicy}
            onAgreeChange={handleInputChange}
            onNext={handlePrivacyPolicyNext}
          />
          
          {/* メールアドレスによる復元リンク */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={showEmailRestoration}
              className="text-blue-600 hover:underline text-sm"
            >
              以前の診断データを復元する
            </button>
          </div>
        </>
      )}
      
      {/* メールアドレス復元フォーム */}
      {showRestorationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EmailRestorationForm
            onRestore={handleRestoration}
            onCancel={() => setShowRestorationForm(false)}
          />
        </div>
      )}
      
      {currentStep === DiagnosisStep.BASIC_INFO && (
        <BasicInfoStep
          formData={{
            name: formData.name,
            email: formData.email
          }}
          onChange={handleInputChange}
          onNext={handleBasicInfoNext}
          onBack={handleBasicInfoBack}
          errors={errors}
        />
      )}
      
      {currentStep === DiagnosisStep.CHATBOT && (
        <ChatbotStep
          userName={formData.name || 'ゲスト'}
          userId={userId}
          onComplete={(chatbotData) => handleChatbotNext(chatbotData)}
          onBack={handleChatbotBack}
        />
      )}
      
      {currentStep === DiagnosisStep.RESULT && diagnosisResult && (
        <ResultStep
          formData={{
            ...formData,
            age: Number(formData.age || 0),
            familySize: Number(formData.familySize || 0),
            annualIncome: Number(formData.annualIncome || 0),
            savings: Number(formData.savings || 0),
            mortgageLoanBalance: formData.mortgageLoanBalance ? Number(formData.mortgageLoanBalance) : undefined,
            monthlyMortgagePayment: formData.monthlyMortgagePayment ? Number(formData.monthlyMortgagePayment) : undefined,
            otherDebts: formData.otherDebts ? Number(formData.otherDebts) : undefined,
          }}
          result={diagnosisResult}
          onDownloadPdf={handleDownloadPdf}
          onScheduleMeeting={handleScheduleMeeting}
          onRestart={handleRestart}
        />
      )}
      
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p className="text-lg">診断結果を計算中...</p>
          </div>
        </div>
      )}
    </div>
  );
};

// 金額文字列からの変換関数をコンポーネント内で定義
function parseAmountFromString(amountStr: string): number | null {
  if (!amountStr) return null;
  
  try {
    // 「万円」表記の処理
    if (amountStr.includes('万円')) {
      const numPart = amountStr.replace(/[^0-9０-９.～〜-]/g, '');
      
      // 範囲表記の場合は平均値を取る
      if (numPart.includes('～') || numPart.includes('〜') || numPart.includes('-')) {
        const parts = numPart.split(/[～〜-]/);
        if (parts.length === 2) {
          const min = parseFloat(parts[0]);
          const max = parseFloat(parts[1]);
          if (!isNaN(min) && !isNaN(max)) {
            return ((min + max) / 2) * 10000;
          }
        }
      }
      
      const num = parseFloat(numPart);
      return !isNaN(num) ? num * 10000 : null;
    }
    
    // 「なし」の処理
    if (amountStr === 'なし') {
      return 0;
    }
    
    // それ以外は単純に数値に変換
    const numericValue = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    return !isNaN(numericValue) ? numericValue : null;
  } catch (err) {
    console.error('金額変換エラー:', err);
    return null;
  }
}

export default DiagnosisForm; 