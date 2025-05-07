export interface DiagnosisFormData {
  name: string;
  email: string;
  age: number | string;
  familySize: number | string;
  annualIncome: number | string;
  savings: number | string;
  mortgageLoanBalance?: number | string;
  monthlyMortgagePayment?: number | string;
  otherDebts?: number | string;
  agreeToPrivacyPolicy: boolean;
}

export interface BudgetDiagnosisResult {
  maxBudget: number;
  recommendation: string;
  diagnosisResultId?: string;
}

// 診断ステップの定義
export enum DiagnosisStep {
  PRIVACY_POLICY = 'PRIVACY_POLICY',
  BASIC_INFO = 'BASIC_INFO',
  DETAILED_INFO = 'DETAILED_INFO',
  CHATBOT = 'CHATBOT',
  RESULT = 'RESULT'
}

// Supabase テーブル用のタイプ定義
export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface DiagnosisResult {
  id: string;
  user_id: string;
  max_budget: number;
  recommendation: string;
  diagnosis_data: DiagnosisFormData;
  created_at: string;
} 