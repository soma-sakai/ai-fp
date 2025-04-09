-- Supabaseのスキーマ設定
-- 安心予算AI診断＆シミュレーションチャットボットツール用データベース構造

-- プロファイル情報テーブル
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
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
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- チャットの対話ログテーブル
CREATE TABLE IF NOT EXISTS public.chat_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  message TEXT NOT NULL,
  is_from_user BOOLEAN NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- 診断結果テーブル
CREATE TABLE IF NOT EXISTS public.diagnosis_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  monthly_salary INTEGER NOT NULL,
  monthly_expenses INTEGER NOT NULL,
  savings INTEGER NOT NULL,
  has_investment BOOLEAN NOT NULL,
  risk_level TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- FP相談予約テーブル
CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  preferred_date_1 DATE NOT NULL,
  preferred_date_2 DATE,
  preferred_date_3 DATE,
  preferred_time TEXT NOT NULL,
  consultation_type TEXT NOT NULL,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- ユーザーアクション記録テーブル
CREATE TABLE IF NOT EXISTS public.user_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  action TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- セキュリティポリシーの設定

-- プロファイル テーブルのセキュリティポリシー
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "プロファイルの参照は全ユーザー可能" ON public.profiles 
  FOR SELECT USING (true);

CREATE POLICY "自分のプロファイルのみ変更可能" ON public.profiles 
  FOR UPDATE USING (auth.uid() = id);

-- チャットログ テーブルのセキュリティポリシー
ALTER TABLE public.chat_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のチャットログのみ参照可能" ON public.chat_logs 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分のチャットログのみ追加可能" ON public.chat_logs 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 診断結果 テーブルのセキュリティポリシー
ALTER TABLE public.diagnosis_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の診断結果のみ参照可能" ON public.diagnosis_results 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分の診断結果のみ追加可能" ON public.diagnosis_results 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 相談予約 テーブルのセキュリティポリシー
ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分の相談予約のみ参照可能" ON public.consultation_requests 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分の相談予約のみ追加可能" ON public.consultation_requests 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "自分の相談予約のみ更新可能" ON public.consultation_requests 
  FOR UPDATE USING (auth.uid() = user_id);

-- ユーザーアクション テーブルのセキュリティポリシー
ALTER TABLE public.user_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "自分のアクションログのみ参照可能" ON public.user_actions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "自分のアクションログのみ追加可能" ON public.user_actions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- インデックスの作成
CREATE INDEX idx_chat_logs_user_id ON public.chat_logs(user_id);
CREATE INDEX idx_diagnosis_results_user_id ON public.diagnosis_results(user_id);
CREATE INDEX idx_consultation_requests_user_id ON public.consultation_requests(user_id);
CREATE INDEX idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX idx_user_actions_user_id ON public.user_actions(user_id);
CREATE INDEX idx_user_actions_action ON public.user_actions(action); 