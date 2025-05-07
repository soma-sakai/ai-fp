interface BudgetInputs {
  age?: number;
  annualIncome: number | string;
  familySize: number | string;
  savings: number | string;
  mortgageLoanBalance?: number | string;
  monthlyMortgagePayment?: number | string;
  otherDebts?: number | string;
  [key: string]: any; // チャットボットから収集した追加データ
}

/**
 * 住宅予算のMAXラインを計算する関数
 * 要件に基づいて計算ロジックを実装
 */
export function calculateMaxBudget(inputs: BudgetInputs): number {
  // 数値に変換
  const annualIncome = typeof inputs.annualIncome === 'string' 
    ? parseAmountFromString(inputs.annualIncome) 
    : inputs.annualIncome;
  const familySize = typeof inputs.familySize === 'string' 
    ? parseInt(inputs.familySize) 
    : inputs.familySize;
  const savings = typeof inputs.savings === 'string' 
    ? parseAmountFromString(inputs.savings) 
    : inputs.savings;
  const mortgageLoanBalance = inputs.mortgageLoanBalance 
    ? (typeof inputs.mortgageLoanBalance === 'string' 
      ? parseAmountFromString(inputs.mortgageLoanBalance) 
      : inputs.mortgageLoanBalance)
    : 0;
  const monthlyMortgagePayment = inputs.monthlyMortgagePayment 
    ? (typeof inputs.monthlyMortgagePayment === 'string'
      ? parseAmountFromString(inputs.monthlyMortgagePayment)
      : inputs.monthlyMortgagePayment)
    : 0;
  const otherDebts = inputs.otherDebts 
    ? (typeof inputs.otherDebts === 'string'
      ? parseAmountFromString(inputs.otherDebts)
      : inputs.otherDebts)
    : 0;
  
  console.log('予算計算に使用する値:', {
    annualIncome,
    familySize,
    savings,
    mortgageLoanBalance,
    monthlyMortgagePayment,
    otherDebts
  });
  
  // 1. 基本計算: 年収の3〜5倍を基準にする
  const lowerLimit = annualIncome * 3;
  const upperLimit = annualIncome * 5;
  
  // 2. 家族構成による調整
  let maxLine = upperLimit;
  if (familySize >= 4) {
    maxLine = annualIncome * 3.5;
  }
  
  // 3. 既存ローン残高の控除
  maxLine = maxLine - mortgageLoanBalance;
  
  // 4. 返済負担率の計算と調整
  const annualMortgagePayment = monthlyMortgagePayment * 12;
  const debtPaymentRatio = annualIncome > 0 ? annualMortgagePayment / annualIncome : 0;
  
  // 返済負担率が30%を超える場合、MAXラインを下げる
  if (debtPaymentRatio > 0.3) {
    maxLine = maxLine - Math.max(500 * 10000, Math.min(1000 * 10000, (debtPaymentRatio - 0.3) * annualIncome * 10000));
  }
  
  // 5. 負債状況による調整
  const totalDebt = otherDebts;
  const debtToIncomeRatio = annualIncome > 0 ? totalDebt / annualIncome : 0;
  
  // 負債が年収の40%を超える場合、MAXラインを下げる
  if (debtToIncomeRatio > 0.4) {
    maxLine = maxLine - Math.max(500 * 10000, Math.min(1000 * 10000, (debtToIncomeRatio - 0.4) * annualIncome * 10000));
  }
  
  // 6. 貯金額による調整
  if (savings >= annualIncome) {
    // 貯金が年収以上ある場合、MAXラインを使用
    return Math.floor(maxLine / 100000) * 100000;
  } else {
    // 貯金が年収未満の場合、中間値を使用
    return Math.floor((lowerLimit + maxLine) / 2 / 100000) * 100000;
  }
}

/**
 * 住宅予算診断の結果を生成する関数
 */
export function generateBudgetDiagnosis(inputs: BudgetInputs): {
  maxBudget: number;
  recommendation: string;
  diagnosisResultId?: string; // 診断結果ID（オプショナル）
} {
  const maxBudget = calculateMaxBudget(inputs);
  const annualIncome = typeof inputs.annualIncome === 'string' 
    ? parseAmountFromString(inputs.annualIncome) 
    : inputs.annualIncome;
  
  // 推奨事項の生成
  let recommendation = '';
  
  if (maxBudget > annualIncome * 4.5) {
    recommendation = '予算の上限に近い設定です。ライフスタイルや将来の収入変動を考慮して慎重に計画を立てることをおすすめします。';
  } else if (maxBudget < annualIncome * 3) {
    recommendation = '堅実な予算設定です。この範囲内であれば、将来の収入変動にも対応しやすく、安定した返済が可能でしょう。';
  } else {
    recommendation = 'バランスの取れた予算設定です。この予算内で理想的な物件を探しながら、余裕資金も確保することをおすすめします。';
  }
  
  return {
    maxBudget,
    recommendation
  };
}

/**
 * 金額表記の文字列から数値を抽出する補助関数
 * 例: "500万円" → 5000000
 */
export function parseAmountFromString(amountStr: string): number {
  if (!amountStr) return 0;
  
  // 単位を含む表記から数値部分を抽出するパターン
  if (typeof amountStr === 'string') {
    // 「万円」表記の処理
    if (amountStr.includes('万円')) {
      const numPart = amountStr.replace(/[^0-9０-９.～〜-]/g, '');
      
      // 範囲表記の場合は平均値を取る
      if (numPart.includes('～') || numPart.includes('〜') || numPart.includes('-')) {
        const [min, max] = numPart.split(/[～〜-]/).map(Number);
        return ((min + max) / 2) * 10000;
      }
      
      return parseFloat(numPart) * 10000;
    }
    
    // 「なし」の処理
    if (amountStr === 'なし') {
      return 0;
    }
    
    // それ以外は単純に数値に変換
    const numericValue = parseFloat(amountStr.replace(/[^0-9.]/g, ''));
    return isNaN(numericValue) ? 0 : numericValue;
  }
  
  return 0;
} 