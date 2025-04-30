-- Supabaseのスキーマ設定
-- 安心予算AI診断＆シミュレーションチャットボットツール用データベース構造

-- プロファイル情報テーブル
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- プロファイル自動更新のためのトリガー関数
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 新規ユーザー作成時にプロファイルも作成するトリガー
-- トリガーが存在しない場合のみ作成
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_auth_user_created') THEN
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
  END IF;
END
$$;

-- チャットの対話ログテーブル
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT, -- 同一セッションをグループ化する為のID
  message TEXT, -- メッセージ内容
  sender TEXT, -- 'bot' または 'user'
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 診断結果テーブル
CREATE TABLE IF NOT EXISTS public.diagnosis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  monthly_salary INTEGER, -- 月収
  monthly_expenses INTEGER, -- 月間支出
  savings INTEGER, -- 貯蓄額
  has_investment BOOLEAN, -- 投資経験の有無
  result_summary TEXT, -- 結果サマリー
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- FP相談予約テーブル
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  phone TEXT,
  preferred_date_1 DATE,
  preferred_date_2 DATE,
  preferred_date_3 DATE,
  preferred_time TEXT, -- '午前', '午後早め', '午後遅め', '夕方以降'
  consultation_type TEXT, -- '対面', 'オンライン', '電話'
  message TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'canceled'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ユーザーアクション記録テーブル
CREATE TABLE IF NOT EXISTS public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT, -- 'pdf_download', 'simulation_run', 'book_consultation' など
  details JSONB, -- アクション詳細（任意）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 住宅予算診断結果テーブル（新規追加）
CREATE TABLE IF NOT EXISTS public.budget_diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  input_data JSONB, -- 入力データ全体（家族構成、収入、支出など）をJSON形式で保存
  max_line INTEGER, -- MAXラインの予算額（円）
  reasonable_line INTEGER, -- 妥当ラインの予算額（円）
  safe_line INTEGER, -- 安全ラインの予算額（円）
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- セキュリティポリシーの設定

-- プロファイル テーブルのセキュリティポリシー
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY profiles_select_own ON public.profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY profiles_insert_own ON public.profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_update_own ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- チャットログ テーブルのセキュリティポリシー
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY chat_logs_select_own ON public.chat_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY chat_logs_insert_own ON public.chat_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 診断結果 テーブルのセキュリティポリシー
ALTER TABLE public.diagnosis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY diagnosis_results_select_own ON public.diagnosis_results 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY diagnosis_results_insert_own ON public.diagnosis_results 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 相談予約 テーブルのセキュリティポリシー
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY consultation_requests_select_own ON public.consultation_requests 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY consultation_requests_insert_own ON public.consultation_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY consultation_requests_update_own ON public.consultation_requests 
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーアクション テーブルのセキュリティポリシー
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_actions_select_own ON public.user_actions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_actions_insert_own ON public.user_actions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 住宅予算診断結果テーブルのセキュリティポリシー（新規追加）
ALTER TABLE public.budget_diagnoses ENABLE ROW LEVEL SECURITY;

CREATE POLICY budget_diagnoses_select_own ON public.budget_diagnoses 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY budget_diagnoses_insert_own ON public.budget_diagnoses 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- インデックスの作成（存在しない場合のみ）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_logs_user_id') THEN
    CREATE INDEX idx_chat_logs_user_id ON public.chat_logs(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_diagnosis_results_user_id') THEN
    CREATE INDEX idx_diagnosis_results_user_id ON public.diagnosis_results(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_consultation_requests_user_id') THEN
    CREATE INDEX idx_consultation_requests_user_id ON public.consultation_requests(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_consultation_requests_status') THEN
    CREATE INDEX idx_consultation_requests_status ON public.consultation_requests(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_actions_user_id') THEN
    CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_actions_action') THEN
    CREATE INDEX idx_user_actions_action ON public.user_actions(action);
  END IF;
END
$$; 