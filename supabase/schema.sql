-- 既存のテーブルをクリーンアップする（依存関係も含めて削除）
DROP TABLE IF EXISTS fp_consultation_requests CASCADE;
DROP TABLE IF EXISTS fp_consultations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS diagnosis_details CASCADE;
DROP TABLE IF EXISTS household_expenses CASCADE;
DROP TABLE IF EXISTS loan_preferences CASCADE;
DROP TABLE IF EXISTS diagnosis_results CASCADE;
DROP TABLE IF EXISTS diagnosis_basic_info CASCADE;
DROP TABLE IF EXISTS chatbot_progress CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- UUID拡張機能を有効にする
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 会員登録データベース（ユーザー情報を保存）
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  last_login TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 診断結果を保存するテーブル（改善版）
CREATE TABLE diagnosis_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  email TEXT,
  
  -- 基本情報（すべて数値型に統一）
  age INT,
  family_size INT,
  annual_income NUMERIC,
  savings NUMERIC,
  mortgage_loan_balance NUMERIC,
  monthly_mortgage_payment NUMERIC,
  other_debts NUMERIC,
  
  -- 診断結果
  max_budget NUMERIC NOT NULL DEFAULT 0,
  recommendation TEXT,
  
  -- 家族情報（文字列・選択肢型）
  head_of_household_age TEXT,
  has_spouse TEXT,
  spouse_age TEXT,
  children_count INT,  -- 整数型に変更
  children_ages TEXT,
  plan_more_children TEXT,
  
  -- 収入情報（数値型）
  spouse_income NUMERIC,  -- 数値型に変更
  maternity_leave_plan TEXT,
  
  -- 資産関連情報（数値型）
  financial_assets NUMERIC,  -- 数値型に変更
  has_retirement_bonus TEXT,
  retirement_bonus_amount NUMERIC,  -- 数値型に変更
  
  -- 投資関連情報（新規追加）
  initial_investment NUMERIC,
  monthly_contribution NUMERIC,
  investment_yield NUMERIC,  -- 年利（%）
  
  -- 支出関連情報（数値型）
  plan_to_sell_house TEXT,
  current_rent NUMERIC,  -- 数値型に変更
  current_insurance NUMERIC,  -- 数値型に変更
  monthly_living_expenses NUMERIC,  -- 数値型に変更
  hobby_expenses NUMERIC,  -- 数値型に変更
  travel_frequency TEXT,
  
  -- 教育・退職関連
  education_policy TEXT,
  retirement_age TEXT,
  
  -- ローン関連
  loan_years INT,  -- 整数型に変更
  expected_interest_rate NUMERIC,  -- 数値型に変更
  
  -- 拡張可能性のためのJSONフィールド
  additional_data JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- FP相談リクエストテーブル
CREATE TABLE fp_consultation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  diagnosis_result_id UUID REFERENCES diagnosis_results(id) ON DELETE SET NULL,
  preferred_date TIMESTAMP WITH TIME ZONE,
  preferred_time TEXT,
  consultation_type TEXT, -- 'online' または 'office'
  specific_questions TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'confirmed', 'completed', 'cancelled'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- FP相談の記録を保存するテーブル
CREATE TABLE fp_consultations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  consultation_request_id UUID REFERENCES fp_consultation_requests(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  fp_id TEXT, -- FP識別子
  consultation_date TIMESTAMP WITH TIME ZONE,
  summary TEXT,
  recommendations TEXT,
  follow_up_actions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- チャットメッセージを保存するテーブル
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES fp_consultations(id) ON DELETE CASCADE,
  sender TEXT NOT NULL, -- 'user', 'bot', または 'fp'
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- チャットボットの途中経過を保存するテーブル
CREATE TABLE chatbot_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  progress_data JSONB NOT NULL, -- 現在の回答データや状態を保存
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 更新日時を自動設定するための関数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 更新日時自動更新トリガー
CREATE TRIGGER update_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_diagnosis_results_updated_at
BEFORE UPDATE ON diagnosis_results
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fp_consultation_requests_updated_at
BEFORE UPDATE ON fp_consultation_requests
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fp_consultations_updated_at
BEFORE UPDATE ON fp_consultations
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Row Level Securityを有効にする
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnosis_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_consultation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE fp_consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_progress ENABLE ROW LEVEL SECURITY;

-- 認証なしモード用のポリシー（開発中のみ使用）
CREATE POLICY "anon_can_do_everything" ON users FOR ALL USING (true);
CREATE POLICY "anon_can_do_everything" ON diagnosis_results FOR ALL USING (true);
CREATE POLICY "anon_can_do_everything" ON fp_consultation_requests FOR ALL USING (true);
CREATE POLICY "anon_can_do_everything" ON fp_consultations FOR ALL USING (true);
CREATE POLICY "anon_can_do_everything" ON chat_messages FOR ALL USING (true);
CREATE POLICY "anon_can_do_everything" ON chatbot_progress FOR ALL USING (true);

-- トリガー関数：診断結果自動補完（データ型の一貫性を確保）
CREATE OR REPLACE FUNCTION process_diagnosis_result()
RETURNS TRIGGER AS $$
BEGIN
  -- 文字列形式の金額をNUMERIC型に変換する処理
  -- 年収
  IF NEW.annual_income IS NULL AND NEW.additional_data->'chatbot_data'->'annualIncome' IS NOT NULL THEN
    BEGIN
      NEW.annual_income := process_amount_text(NEW.additional_data->'chatbot_data'->>'annualIncome');
    EXCEPTION
      WHEN OTHERS THEN
        -- エラー時はデフォルト値
        NEW.annual_income := 5000000;
    END;
  END IF;
  
  -- 貯蓄残高
  IF NEW.savings IS NULL AND NEW.additional_data->'chatbot_data'->'savings' IS NOT NULL THEN
    BEGIN
      NEW.savings := process_amount_text(NEW.additional_data->'chatbot_data'->>'savings');
    EXCEPTION
      WHEN OTHERS THEN
        -- エラー時はデフォルト値
        NEW.savings := 5000000;
    END;
  END IF;
  
  -- 簡易計算の実行（max_budgetが設定されていない場合）
  IF NEW.max_budget IS NULL OR NEW.max_budget = 0 THEN
    -- 年収データがあれば簡易計算
    IF NEW.annual_income IS NOT NULL AND NEW.annual_income > 0 THEN
      NEW.max_budget := NEW.annual_income * 7; -- 年収の7倍を仮の最大予算とする
    ELSE
      NEW.max_budget := 50000000; -- デフォルト値（5000万円）
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 金額文字列処理ヘルパー関数
CREATE OR REPLACE FUNCTION process_amount_text(amount_text TEXT) RETURNS NUMERIC AS $$
DECLARE
  numeric_part TEXT;
  result NUMERIC;
BEGIN
  IF amount_text IS NULL OR amount_text = '' THEN
    RETURN NULL;
  END IF;
  
  -- 「なし」の処理
  IF amount_text = 'なし' THEN
    RETURN 0;
  END IF;
  
  -- 万円表記処理
  IF amount_text LIKE '%万円%' THEN
    -- 数値部分の抽出
    numeric_part := regexp_replace(amount_text, '[^0-9０-９.～〜-]', '', 'g');
    
    -- 範囲表記の処理
    IF numeric_part LIKE '%～%' OR numeric_part LIKE '%〜%' OR numeric_part LIKE '%-%' THEN
      -- 範囲の平均値を計算
      DECLARE
        parts TEXT[];
        min_val NUMERIC;
        max_val NUMERIC;
      BEGIN
        parts := regexp_split_to_array(numeric_part, '[～〜-]');
        IF array_length(parts, 1) >= 2 THEN
          min_val := parts[1]::NUMERIC;
          max_val := parts[2]::NUMERIC;
          result := ((min_val + max_val) / 2) * 10000;
          RETURN result;
        END IF;
      END;
    END IF;
    
    -- 単一値の処理
    result := numeric_part::NUMERIC * 10000;
    RETURN result;
  END IF;
  
  -- その他の数値表記
  numeric_part := regexp_replace(amount_text, '[^0-9.]', '', 'g');
  IF numeric_part = '' THEN
    RETURN NULL;
  END IF;
  
  RETURN numeric_part::NUMERIC;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Error converting amount text: %', amount_text;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 診断結果挿入時のトリガー
CREATE TRIGGER before_insert_diagnosis_result
BEFORE INSERT ON diagnosis_results
FOR EACH ROW
EXECUTE FUNCTION process_diagnosis_result();

-- インデックスを追加して検索パフォーマンスを向上
CREATE INDEX idx_diagnosis_results_user_id ON diagnosis_results(user_id);
CREATE INDEX idx_diagnosis_results_annual_income ON diagnosis_results(annual_income);
CREATE INDEX idx_diagnosis_results_savings ON diagnosis_results(savings);
CREATE INDEX idx_diagnosis_results_max_budget ON diagnosis_results(max_budget);
CREATE INDEX idx_fp_consultation_requests_user_id ON fp_consultation_requests(user_id);
CREATE INDEX idx_fp_consultations_user_id ON fp_consultations(user_id);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);
CREATE INDEX idx_chatbot_progress_user_id ON chatbot_progress(user_id); 