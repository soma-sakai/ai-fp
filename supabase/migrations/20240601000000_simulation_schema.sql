-- シミュレーション関連テーブルの作成
-- 拡張機能の有効化
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- simulation_runs テーブル
CREATE TABLE IF NOT EXISTS simulation_runs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  diagnosis_result_id UUID REFERENCES diagnosis_results(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  parameters JSONB NOT NULL,
  summary JSONB,
  simple_budget_max NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- simulation_yearly_data テーブル
CREATE TABLE IF NOT EXISTS simulation_yearly_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  run_id UUID REFERENCES simulation_runs(id) NOT NULL,
  year INT NOT NULL,
  age INT NOT NULL,
  income_total NUMERIC NOT NULL,
  expense_total NUMERIC NOT NULL,
  cashflow NUMERIC NOT NULL,
  balance_end NUMERIC NOT NULL,
  mortgage_principal NUMERIC NOT NULL DEFAULT 0,
  mortgage_interest NUMERIC NOT NULL DEFAULT 0,
  education_cost NUMERIC NOT NULL DEFAULT 0,
  insurance_cost NUMERIC NOT NULL DEFAULT 0,
  investment_balance NUMERIC NOT NULL DEFAULT 0,
  investment_yield NUMERIC NOT NULL DEFAULT 0,
  pension_income NUMERIC NOT NULL DEFAULT 0,
  other_events JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- インデックスの作成
CREATE INDEX IF NOT EXISTS simulation_runs_user_id_idx ON simulation_runs (user_id);
CREATE INDEX IF NOT EXISTS simulation_yearly_data_run_id_idx ON simulation_yearly_data (run_id);
CREATE INDEX IF NOT EXISTS simulation_yearly_data_year_idx ON simulation_yearly_data (run_id, year);

-- 住宅ローン計算関数
CREATE OR REPLACE FUNCTION fn_calculate_mortgage_schedule(
  principal NUMERIC,
  annual_rate NUMERIC,
  term_years INT,
  repayment_type TEXT,
  extra_payments JSONB DEFAULT '{}'::JSONB
) RETURNS TABLE(
  year INT,
  principal_paid NUMERIC,
  interest_paid NUMERIC,
  balance NUMERIC
) AS $$
DECLARE
  monthly_rate NUMERIC := annual_rate/12/100;
  total_months INT := term_years*12;
  fixed_payment NUMERIC;
  curr_balance NUMERIC := principal;
  curr_year INT := 1;
  year_principal NUMERIC := 0;
  year_interest NUMERIC := 0;
  month_in_year INT := 1;
  month_principal NUMERIC;
  month_interest NUMERIC;
  extra_payment NUMERIC;
  curr_month INT := 1;
BEGIN
  IF repayment_type = 'fixed' OR repayment_type IS NULL THEN
    -- 元利均等返済の場合の月額計算
    fixed_payment := principal * (monthly_rate * power(1+monthly_rate, total_months)) / (power(1+monthly_rate, total_months) - 1);
  ELSE
    -- 元金均等返済の場合（デフォルト）
    fixed_payment := principal / total_months;
  END IF;
  
  -- 月次ループ
  WHILE curr_month <= total_months AND curr_balance > 0 LOOP
    IF repayment_type = 'fixed' OR repayment_type IS NULL THEN
      -- 元利均等返済の場合
      month_interest := curr_balance * monthly_rate;
      month_principal := fixed_payment - month_interest;
    ELSE
      -- 元金均等返済の場合
      month_principal := principal / total_months;
      month_interest := curr_balance * monthly_rate;
    END IF;
    
    -- 繰り上げ返済の適用
    extra_payment := 0;
    IF extra_payments IS NOT NULL AND extra_payments ? (curr_year::text) THEN
      extra_payment := (extra_payments->>curr_year::text)::NUMERIC;
      IF extra_payment > curr_balance THEN
        extra_payment := curr_balance;
      END IF;
    END IF;
    
    -- 残高更新
    month_principal := month_principal + extra_payment;
    IF month_principal > curr_balance THEN
      month_principal := curr_balance;
    END IF;
    curr_balance := curr_balance - month_principal;
    
    -- 年間の集計
    year_principal := year_principal + month_principal;
    year_interest := year_interest + month_interest;
    
    -- 月カウンタ更新
    month_in_year := month_in_year + 1;
    curr_month := curr_month + 1;
    
    -- 1年が終わったら集計結果を出力
    IF month_in_year > 12 OR curr_month > total_months OR curr_balance <= 0 THEN
      year := curr_year;
      principal_paid := year_principal;
      interest_paid := year_interest;
      balance := curr_balance;
      RETURN NEXT;
      
      -- 年ごとの変数リセット
      curr_year := curr_year + 1;
      month_in_year := 1;
      year_principal := 0;
      year_interest := 0;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$ LANGUAGE plpgsql;

-- 収支計算関数
CREATE OR REPLACE FUNCTION fn_calculate_income_expenses(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS JSONB AS $$
DECLARE
  income NUMERIC := 0;
  expense NUMERIC := 0;
  breakdown JSONB := '{}'::JSONB;
  base_salary NUMERIC;
  spouse_salary NUMERIC := 0;
  raise_rate NUMERIC := 0.02; -- 昇給率
  inflation_rate NUMERIC := 0.01; -- インフレ率
  living_expense NUMERIC;
  tax_rate NUMERIC;
  retirement_age INT;
  is_retired BOOLEAN := FALSE;
  age_in_year INT;
BEGIN
  -- 基本パラメータの取得
  base_salary := (params->>'annualIncome')::NUMERIC;
  IF params->>'spouseIncome' IS NOT NULL AND (params->>'hasSpouse')::TEXT = 'はい' THEN
    spouse_salary := (params->>'spouseIncome')::NUMERIC;
  END IF;
  living_expense := COALESCE((params->>'monthlyLivingExpenses')::NUMERIC, 200000) * 12;
  retirement_age := COALESCE((params->>'retirementAge')::NUMERIC, 65);
  
  -- 対象年の年齢計算
  age_in_year := current_age + target_year - 1;
  
  -- 退職判定
  is_retired := age_in_year >= retirement_age;
  
  -- 収入計算
  IF NOT is_retired THEN
    -- 昇給を考慮
    IF age_in_year >= 50 THEN
      -- 50歳以上は年収が110%
      income := base_salary * 1.1 * power(1 + raise_rate, target_year - 1);
    ELSE
      -- 通常の昇給
      income := base_salary * power(1 + raise_rate, target_year - 1);
    END IF;
    
    -- 配偶者収入
    IF spouse_salary > 0 THEN
      IF age_in_year >= retirement_age - 2 THEN -- 配偶者は2歳若いと仮定
        -- 配偶者が退職した場合
        income := income + spouse_salary * 0.6;
      ELSE
        -- 配偶者も昇給
        income := income + spouse_salary * power(1 + raise_rate, target_year - 1);
      END IF;
    END IF;
  ELSE
    -- 退職後は収入が60%に減少
    income := base_salary * 0.6;
    
    -- 配偶者収入（退職後）
    IF spouse_salary > 0 THEN
      income := income + spouse_salary * 0.6;
    END IF;
  END IF;
  
  -- 税率計算（簡易）
  IF income > 10000000 THEN
    tax_rate := 0.33;
  ELSIF income > 6000000 THEN
    tax_rate := 0.23;
  ELSIF income > 3300000 THEN
    tax_rate := 0.2;
  ELSE
    tax_rate := 0.1;
  END IF;
  
  -- 税金計算
  DECLARE
    tax_amount NUMERIC := income * tax_rate;
  BEGIN
    expense := tax_amount;
    breakdown := jsonb_set(breakdown, '{tax}', to_jsonb(tax_amount));
  END;
  
  -- 生活費計算（インフレ考慮）
  DECLARE
    inflated_living NUMERIC := living_expense * power(1 + inflation_rate, target_year - 1);
  BEGIN
    expense := expense + inflated_living;
    breakdown := jsonb_set(breakdown, '{living}', to_jsonb(inflated_living));
  END;
  
  -- その他支出（収入の10%と仮定）
  DECLARE
    other_expense NUMERIC := income * 0.1;
  BEGIN
    expense := expense + other_expense;
    breakdown := jsonb_set(breakdown, '{other}', to_jsonb(other_expense));
  END;
  
  -- イベント費用（params->'events'から）
  IF params->'events' IS NOT NULL AND params->'events' ? target_year::TEXT THEN
    DECLARE
      event_amount NUMERIC := (params->'events'->target_year::TEXT->>'amount')::NUMERIC;
      event_type TEXT := params->'events'->target_year::TEXT->>'type';
    BEGIN
      expense := expense + event_amount;
      breakdown := jsonb_set(breakdown, ARRAY[event_type], to_jsonb(event_amount));
    END;
  END IF;
  
  -- 結果の返却
  RETURN jsonb_build_object(
    'income_total', income,
    'expense_total', expense,
    'breakdown', breakdown
  );
END;
$$ LANGUAGE plpgsql;

-- 教育費計算関数
CREATE OR REPLACE FUNCTION fn_calculate_education_costs(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS NUMERIC AS $$
DECLARE
  total_cost NUMERIC := 0;
  child_ages TEXT[];
  child_age INT;
  child_count INT;
  education_policy TEXT;
  base_expense NUMERIC;
  policy_factor NUMERIC := 1.0;
  inflation_rate NUMERIC := 0.01;
BEGIN
  -- 子供情報の取得
  child_count := COALESCE((params->>'childrenCount')::INT, 0);
  IF child_count = 0 THEN
    RETURN 0;
  END IF;
  
  -- 教育方針の取得
  education_policy := COALESCE(params->>'educationPolicy', '公立中心');
  IF education_policy = '私立中心' THEN
    policy_factor := 1.5;
  ELSIF education_policy = '公私混合' THEN
    policy_factor := 1.2;
  END IF;
  
  -- 子供の年齢情報を解析
  IF params->>'childrenAges' IS NOT NULL THEN
    -- 文字列から子供の年齢情報を取得（シンプルな実装）
    DECLARE
      child_ages_text TEXT := params->>'childrenAges';
      base_child_age INT := 5; -- デフォルト値
    BEGIN
      IF child_ages_text LIKE '%未就学児%' THEN
        base_child_age := 3;
      ELSIF child_ages_text LIKE '%小学生%' THEN
        base_child_age := 9;
      ELSIF child_ages_text LIKE '%中学生%' THEN
        base_child_age := 13;
      ELSIF child_ages_text LIKE '%高校生%' THEN
        base_child_age := 16;
      ELSIF child_ages_text LIKE '%大学生%' THEN
        base_child_age := 20;
      END IF;
      
      -- 子供ごとに計算
      FOR i IN 1..child_count LOOP
        -- 対象年の子供の年齢
        child_age := base_child_age + target_year - 1;
        
        -- 年齢に応じた教育費
        IF child_age < 6 THEN
          -- 未就学児
          base_expense := 3 * 10000 * 12; -- 月3万円
        ELSIF child_age < 12 THEN
          -- 小学生
          base_expense := 5 * 10000 * 12; -- 月5万円
        ELSIF child_age < 15 THEN
          -- 中学生
          base_expense := 8 * 10000 * 12; -- 月8万円
        ELSIF child_age < 18 THEN
          -- 高校生
          base_expense := 12 * 10000 * 12; -- 月12万円
        ELSIF child_age < 22 THEN
          -- 大学生
          base_expense := 15 * 10000 * 12; -- 月15万円
        ELSE
          -- 22歳以上は教育費なし
          base_expense := 0;
        END IF;
        
        -- 教育方針による調整
        base_expense := base_expense * policy_factor;
        
        -- インフレ考慮
        base_expense := base_expense * power(1 + inflation_rate, target_year - 1);
        
        -- 合計に加算
        total_cost := total_cost + base_expense;
      END LOOP;
    END;
  END IF;
  
  RETURN total_cost;
END;
$$ LANGUAGE plpgsql;

-- 保険料計算関数
CREATE OR REPLACE FUNCTION fn_calculate_insurance_costs(
  params JSONB,
  target_year INT
) RETURNS NUMERIC AS $$
DECLARE
  insurance_cost NUMERIC := 120000; -- デフォルト年間保険料
  inflation_rate NUMERIC := 0.01;
BEGIN
  -- 保険料の調整（インフレ考慮）
  RETURN insurance_cost * power(1 + inflation_rate, target_year - 1);
END;
$$ LANGUAGE plpgsql;

-- 資産運用計算関数
CREATE OR REPLACE FUNCTION fn_calculate_investment_growth(
  params JSONB,
  target_year INT,
  previous_balance NUMERIC
) RETURNS JSONB AS $$
DECLARE
  initial_investment NUMERIC := 0;
  monthly_contribution NUMERIC := 0;
  yield_rate NUMERIC := 0.03; -- デフォルト年利3%
  withdrawals NUMERIC := 0;
  new_balance NUMERIC;
  annual_yield NUMERIC;
BEGIN
  -- 初期投資額の設定（初年度のみ）
  IF target_year = 1 AND params->>'initialInvestment' IS NOT NULL THEN
    initial_investment := (params->>'initialInvestment')::NUMERIC;
  ELSE
    initial_investment := 0;
  END IF;
  
  -- 月額積立の設定
  IF params->>'monthlyContribution' IS NOT NULL THEN
    monthly_contribution := (params->>'monthlyContribution')::NUMERIC * 12;
  END IF;
  
  -- 利回り設定
  IF params->>'investmentYield' IS NOT NULL THEN
    yield_rate := (params->>'investmentYield')::NUMERIC / 100;
  END IF;
  
  -- 取り崩し設定
  IF params->'withdrawals' IS NOT NULL AND params->'withdrawals' ? target_year::TEXT THEN
    withdrawals := (params->'withdrawals'->target_year::TEXT)::NUMERIC;
  END IF;
  
  -- 残高計算
  IF target_year = 1 THEN
    new_balance := initial_investment + monthly_contribution;
  ELSE
    new_balance := previous_balance + monthly_contribution;
  END IF;
  
  -- 利息計算（単利で簡略化）
  annual_yield := new_balance * yield_rate;
  new_balance := new_balance + annual_yield;
  
  -- 取り崩し適用
  new_balance := new_balance - withdrawals;
  IF new_balance < 0 THEN
    new_balance := 0;
  END IF;
  
  RETURN jsonb_build_object(
    'balance', new_balance,
    'yield', annual_yield,
    'contribution', monthly_contribution,
    'withdrawals', withdrawals
  );
END;
$$ LANGUAGE plpgsql;

-- 年金収入計算関数
CREATE OR REPLACE FUNCTION fn_calculate_pension_income(
  params JSONB,
  target_year INT,
  current_age INT
) RETURNS NUMERIC AS $$
DECLARE
  pension_amount NUMERIC := 0;
  retirement_age INT := COALESCE((params->>'retirementAge')::INT, 65);
  age_in_year INT := current_age + target_year - 1;
  base_pension NUMERIC := 1200000; -- デフォルト年金額（年120万円）
BEGIN
  -- 年金受給開始年齢の確認
  IF age_in_year >= retirement_age THEN
    -- 年金受給開始
    pension_amount := base_pension;
    
    -- 特定のパラメータがある場合は上書き
    IF params->>'pensionAmount' IS NOT NULL THEN
      pension_amount := (params->>'pensionAmount')::NUMERIC;
    END IF;
  END IF;
  
  RETURN pension_amount;
END;
$$ LANGUAGE plpgsql;

-- AI簡易住宅予算診断関数
CREATE OR REPLACE FUNCTION fn_calculate_simple_budget(params JSONB) RETURNS NUMERIC AS $$
DECLARE
  inc NUMERIC := COALESCE((params->>'annualIncome')::NUMERIC, 0);
  fs INT := COALESCE((params->>'familySize')::INT, 0);
  mb NUMERIC := COALESCE((params->>'mortgageLoanBalance')::NUMERIC, (params->>'existing_mortgage_balance')::NUMERIC, 0);
  mp NUMERIC := COALESCE((params->>'monthlyMortgagePayment')::NUMERIC, 0);
  sv NUMERIC := COALESCE((params->>'savings')::NUMERIC, 0);
  od NUMERIC := COALESCE((params->>'otherDebts')::NUMERIC, 0);
  max_line NUMERIC;
  lower NUMERIC := inc * 3;
  upper NUMERIC := inc * 5;
  annual_pay NUMERIC;
  burden_ratio NUMERIC;
  debt_ratio NUMERIC;
BEGIN
  -- 入力チェック
  IF inc <= 0 THEN
    RETURN 0;
  END IF;
  
  -- 家族構成による調整
  IF fs >= 4 THEN 
    upper := inc * 3.5; 
  END IF;
  
  -- 初期値
  max_line := upper;
  
  -- 既存ローン残高の控除
  max_line := max_line - mb;
  
  -- 返済負担率の計算
  annual_pay := mp * 12;
  burden_ratio := CASE WHEN inc > 0 THEN annual_pay / inc ELSE 0 END;
  
  -- 返済負担率による調整
  IF burden_ratio > 0.3 THEN
    max_line := max_line - GREATEST(500 * 10000, LEAST(1000 * 10000, (burden_ratio - 0.3) * inc * 10000));
  END IF;
  
  -- 負債比率の計算
  debt_ratio := CASE WHEN inc > 0 THEN od / inc ELSE 0 END;
  
  -- 負債比率による調整
  IF debt_ratio > 0.4 THEN
    max_line := max_line - GREATEST(500 * 10000, LEAST(1000 * 10000, (debt_ratio - 0.4) * inc * 10000));
  END IF;
  
  -- 貯金による調整
  IF sv >= inc THEN
    RETURN max_line;
  ELSE
    RETURN (lower + max_line) / 2;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- 統合シミュレーション関数
CREATE OR REPLACE FUNCTION fn_simulate_life_plan(diagnosis_result_id UUID) RETURNS UUID AS $$
DECLARE
  user_id UUID;
  params JSONB;
  result_data JSONB;
  run_id UUID;
  
  -- シミュレーション変数
  current_age INT;
  max_age INT := 90;
  simulation_years INT;
  current_balance NUMERIC := 0;
  mortgage_principal NUMERIC := 0;
  mortgage_interest NUMERIC := 0;
  investment_data JSONB;
  investment_balance NUMERIC := 0;
  simple_budget_max NUMERIC;
  
  -- データ検証用変数
  validated_annual_income NUMERIC;
  validated_savings NUMERIC;
  
  -- 年次データレコード
  year_data RECORD;
BEGIN
  -- 診断結果からデータ取得（改善版）
  SELECT 
    dr.user_id, 
    jsonb_build_object(
      'age', COALESCE(dr.age, dr.head_of_household_age, 30),
      'annualIncome', dr.annual_income,
      'hasSpouse', dr.has_spouse,
      'spouseIncome', dr.spouse_income,
      'savings', dr.savings,
      'mortgageLoanBalance', dr.mortgage_loan_balance,
      'monthlyMortgagePayment', dr.monthly_mortgage_payment,
      'otherDebts', dr.other_debts,
      'childrenCount', dr.children_count,
      'childrenAges', dr.children_ages,
      'retirementAge', dr.retirement_age,
      'monthlyLivingExpenses', dr.monthly_living_expenses,
      'educationPolicy', dr.education_policy,
      -- 投資情報
      'initialInvestment', dr.initial_investment,
      'monthlyContribution', dr.monthly_contribution,
      'investmentYield', dr.investment_yield,
      -- その他情報
      'loanYears', dr.loan_years,
      'expectedInterestRate', dr.expected_interest_rate,
      -- 追加情報
      'additional_data', dr.additional_data
    )
  INTO user_id, params
  FROM diagnosis_results dr
  WHERE dr.id = diagnosis_result_id;
  
  IF user_id IS NULL THEN
    RAISE EXCEPTION 'Diagnosis result not found: %', diagnosis_result_id;
  END IF;
  
  -- データ取得のログ
  RAISE NOTICE 'データベースから取得した診断結果 ID: %', diagnosis_result_id;
  RAISE NOTICE 'User ID: %', user_id;
  
  -- 入力データのログと検証
  RAISE NOTICE 'Simulation input parameters: %', params;
  
  -- 重要な入力データの検証
  validated_annual_income := COALESCE((params->>'annualIncome')::NUMERIC, 0);
  validated_savings := COALESCE((params->>'savings')::NUMERIC, 0);
  
  RAISE NOTICE '取得した年収: %, 貯蓄額: %', validated_annual_income, validated_savings;
  
  IF validated_annual_income <= 0 THEN
    -- 年収がないか無効な場合はchatbotデータから再取得を試みる
    IF params->'additional_data'->'chatbot_data'->'annualIncome' IS NOT NULL THEN
      BEGIN
        validated_annual_income := process_amount_text(params->'additional_data'->'chatbot_data'->>'annualIncome');
        RAISE NOTICE 'Chatbotデータから年収を取得: %', validated_annual_income;
        params := jsonb_set(params, '{annualIncome}', to_jsonb(validated_annual_income));
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Chatbotデータからの年収変換エラー: %', SQLERRM;
      END;
    END IF;
    
    -- それでも無効な場合はデフォルト値
    IF validated_annual_income <= 0 THEN
      RAISE WARNING '年収データが無効です: %. デフォルト値を使用します。', validated_annual_income;
      validated_annual_income := 5000000; -- デフォルト500万円
      params := jsonb_set(params, '{annualIncome}', to_jsonb(validated_annual_income));
    END IF;
  END IF;
  
  IF validated_savings < 0 THEN
    -- 貯蓄額がないか無効な場合はchatbotデータから再取得を試みる
    IF params->'additional_data'->'chatbot_data'->'savings' IS NOT NULL THEN
      BEGIN
        validated_savings := process_amount_text(params->'additional_data'->'chatbot_data'->>'savings');
        RAISE NOTICE 'Chatbotデータから貯蓄額を取得: %', validated_savings;
        params := jsonb_set(params, '{savings}', to_jsonb(validated_savings));
      EXCEPTION
        WHEN OTHERS THEN
          RAISE WARNING 'Chatbotデータからの貯蓄額変換エラー: %', SQLERRM;
      END;
    END IF;
    
    -- それでも無効な場合はデフォルト値
    IF validated_savings < 0 THEN
      RAISE WARNING '貯蓄額データが無効です: %. デフォルト値を使用します。', validated_savings;
      validated_savings := 5000000; -- デフォルト500万円
      params := jsonb_set(params, '{savings}', to_jsonb(validated_savings));
    END IF;
  END IF;
  
  -- 年齢の取得と検証
  BEGIN
    current_age := COALESCE((params->>'age')::INT, 30);
    IF current_age < 20 OR current_age > 80 THEN
      -- chatbotデータの確認
      IF params->'additional_data'->'chatbot_data'->'age' IS NOT NULL THEN
        BEGIN
          current_age := (params->'additional_data'->'chatbot_data'->>'age')::INT;
          RAISE NOTICE 'Chatbotデータから年齢を取得: %', current_age;
        EXCEPTION
          WHEN OTHERS THEN
            RAISE WARNING 'Chatbotデータからの年齢変換エラー: %', SQLERRM;
        END;
      END IF;
      
      -- それでも無効な場合
      IF current_age < 20 OR current_age > 80 THEN
        RAISE WARNING '年齢が範囲外です: %. デフォルト値を使用します。', current_age;
        current_age := 30;
      END IF;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '年齢の解析エラー: %. デフォルト値を使用します。', params->>'age';
    current_age := 30;
  END;
  
  -- シミュレーション期間の計算
  simulation_years := max_age - current_age;
  
  -- 初期貯蓄残高の設定（検証済みの値を使用）
  current_balance := validated_savings;
  
  -- 簡易住宅予算診断の実行
  BEGIN
    simple_budget_max := fn_calculate_simple_budget(params);
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '簡易予算計算エラー: %', SQLERRM;
    simple_budget_max := validated_annual_income * 7; -- 簡易的な計算でフォールバック
  END;
  
  -- シミュレーション実行レコードの作成
  INSERT INTO simulation_runs (
    user_id,
    diagnosis_result_id,
    started_at,
    parameters,
    simple_budget_max
  ) VALUES (
    user_id,
    diagnosis_result_id,
    now(),
    params,
    simple_budget_max
  ) RETURNING id INTO run_id;
  
  -- 確認のための更新
  UPDATE simulation_runs 
  SET summary = jsonb_build_object(
    'input_annual_income', validated_annual_income,
    'input_savings', validated_savings
  )
  WHERE id = run_id;
  
  RAISE NOTICE 'シミュレーションを実行します。Run ID: %, 年収: %, 貯蓄額: %', 
    run_id, validated_annual_income, validated_savings;
  
  -- 年次ループ
  FOR i IN 1..simulation_years LOOP
    BEGIN
      -- 収支計算
      SELECT * FROM fn_calculate_income_expenses(params, i, current_age) INTO result_data;
      
      -- 住宅ローン計算（ローンがある場合のみ）
      IF COALESCE((params->>'mortgageLoanBalance')::NUMERIC, 0) > 0 THEN
        BEGIN
          SELECT principal_paid, interest_paid INTO mortgage_principal, mortgage_interest
          FROM fn_calculate_mortgage_schedule(
            (params->>'mortgageLoanBalance')::NUMERIC,
            COALESCE((params->>'expectedInterestRate')::NUMERIC, 1.0),
            COALESCE((params->>'loanYears')::INT, 35),
            'fixed',
            NULL
          )
          WHERE year = i
          LIMIT 1;
          
          -- NULLチェック
          mortgage_principal := COALESCE(mortgage_principal, 0);
          mortgage_interest := COALESCE(mortgage_interest, 0);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error calculating mortgage for year %: %', i, SQLERRM;
          mortgage_principal := 0;
          mortgage_interest := 0;
        END;
      ELSE
        mortgage_principal := 0;
        mortgage_interest := 0;
      END IF;
      
      -- 教育費計算
      DECLARE
        education_cost NUMERIC := 0;
      BEGIN
        BEGIN
          education_cost := fn_calculate_education_costs(params, i, current_age);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error calculating education costs for year %: %', i, SQLERRM;
          education_cost := 0;
        END;
        
        -- 支出に教育費を追加
        result_data := jsonb_set(result_data, 
                              '{expense_total}', 
                              to_jsonb(COALESCE((result_data->>'expense_total')::NUMERIC, 0) + education_cost));
        result_data := jsonb_set(result_data, 
                              '{breakdown, education}', 
                              to_jsonb(education_cost));
      END;
      
      -- 保険料計算
      DECLARE
        insurance_cost NUMERIC := 0;
      BEGIN
        BEGIN
          insurance_cost := fn_calculate_insurance_costs(params, i);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error calculating insurance costs for year %: %', i, SQLERRM;
          insurance_cost := 120000; -- デフォルト年間12万円
        END;
        
        -- 支出に保険料を追加
        result_data := jsonb_set(result_data, 
                              '{expense_total}', 
                              to_jsonb(COALESCE((result_data->>'expense_total')::NUMERIC, 0) + insurance_cost));
        result_data := jsonb_set(result_data, 
                              '{breakdown, insurance}', 
                              to_jsonb(insurance_cost));
      END;
      
      -- 資産運用計算
      BEGIN
        investment_data := fn_calculate_investment_growth(params, i, investment_balance);
        investment_balance := COALESCE((investment_data->>'balance')::NUMERIC, 0);
      EXCEPTION WHEN OTHERS THEN
        RAISE WARNING 'Error calculating investment growth for year %: %', i, SQLERRM;
        investment_data := jsonb_build_object('balance', investment_balance, 'yield', 0);
      END;
      
      -- 年金収入計算
      DECLARE
        pension_income NUMERIC := 0;
      BEGIN
        BEGIN
          pension_income := fn_calculate_pension_income(params, i, current_age);
        EXCEPTION WHEN OTHERS THEN
          RAISE WARNING 'Error calculating pension income for year %: %', i, SQLERRM;
          -- 65歳以上の場合のみデフォルト年金額を設定
          IF current_age + i - 1 >= 65 THEN
            pension_income := 1200000; -- デフォルト年金額（年120万円）
          END IF;
        END;
        
        -- 収入に年金を追加
        result_data := jsonb_set(result_data, 
                              '{income_total}', 
                              to_jsonb(COALESCE((result_data->>'income_total')::NUMERIC, 0) + pension_income));
        result_data := jsonb_set(result_data, 
                              '{breakdown, pension}', 
                              to_jsonb(pension_income));
      END;
      
      -- 収支計算
      DECLARE
        cashflow NUMERIC := COALESCE((result_data->>'income_total')::NUMERIC, 0) - COALESCE((result_data->>'expense_total')::NUMERIC, 0);
      BEGIN
        -- 残高更新
        current_balance := current_balance + cashflow;
        
        -- 初年度のデータをログ出力（デバッグ用）
        IF i = 1 THEN
          RAISE NOTICE '初年度データ - 年収: %, 支出: %, 収支: %, 貯蓄残高: %', 
            COALESCE((result_data->>'income_total')::NUMERIC, 0),
            COALESCE((result_data->>'expense_total')::NUMERIC, 0),
            cashflow,
            current_balance;
        END IF;
        
        -- 年次データの保存
        INSERT INTO simulation_yearly_data (
          run_id,
          year,
          age,
          income_total,
          expense_total,
          cashflow,
          balance_end,
          mortgage_principal,
          mortgage_interest,
          education_cost,
          insurance_cost,
          investment_balance,
          investment_yield,
          pension_income,
          other_events
        ) VALUES (
          run_id,
          i,
          current_age + i - 1,
          COALESCE((result_data->>'income_total')::NUMERIC, 0),
          COALESCE((result_data->>'expense_total')::NUMERIC, 0),
          cashflow,
          current_balance,
          mortgage_principal,
          mortgage_interest,
          COALESCE((result_data->'breakdown'->>'education')::NUMERIC, 0),
          COALESCE((result_data->'breakdown'->>'insurance')::NUMERIC, 0),
          investment_balance,
          COALESCE((investment_data->>'yield')::NUMERIC, 0),
          COALESCE((result_data->'breakdown'->>'pension')::NUMERIC, 0),
          result_data->'breakdown'
        );
      END;
    EXCEPTION WHEN OTHERS THEN
      -- 年次計算でエラーが発生した場合は警告を出して続行
      RAISE WARNING 'Error processing year %: %', i, SQLERRM;
      
      -- 最小限のデータを挿入
      INSERT INTO simulation_yearly_data (
        run_id, year, age, income_total, expense_total, cashflow, balance_end,
        mortgage_principal, mortgage_interest, education_cost, insurance_cost,
        investment_balance, investment_yield, pension_income
      ) VALUES (
        run_id, i, current_age + i - 1, 0, 0, 0, current_balance, 0, 0, 0, 0, 0, 0, 0
      );
    END;
  END LOOP;
  
  -- サマリーの更新
  UPDATE simulation_runs
  SET 
    finished_at = now(),
    summary = jsonb_build_object(
      'final_balance', current_balance,
      'peak_balance', (
        SELECT MAX(balance_end)
        FROM simulation_yearly_data
        WHERE run_id = run_id
      ),
      'peak_year', (
        SELECT year
        FROM simulation_yearly_data
        WHERE run_id = run_id
        ORDER BY balance_end DESC
        LIMIT 1
      ),
      'negative_year', (
        SELECT MIN(year)
        FROM simulation_yearly_data
        WHERE run_id = run_id AND balance_end < 0
      ),
      'simple_budget_max', simple_budget_max,
      -- 入力データ
      'annual_income', validated_annual_income, 
      'savings', validated_savings
    )
  WHERE id = run_id;
  
  RETURN run_id;
EXCEPTION WHEN OTHERS THEN
  -- 重大なエラーの場合はログを残し、部分的な結果を返す
  RAISE WARNING 'Critical error in simulation: %', SQLERRM;
  
  -- エラーが発生した場合も実行記録を残す
  IF run_id IS NULL THEN
    INSERT INTO simulation_runs (
      user_id,
      diagnosis_result_id,
      started_at,
      finished_at,
      parameters,
      summary
    ) VALUES (
      user_id,
      diagnosis_result_id,
      now(),
      now(),
      params,
      jsonb_build_object('error', SQLERRM)
    ) RETURNING id INTO run_id;
  ELSE
    UPDATE simulation_runs
    SET 
      finished_at = now(),
      summary = jsonb_build_object('error', SQLERRM)
    WHERE id = run_id;
  END IF;
  
  RETURN run_id;
END;
$$ LANGUAGE plpgsql; 