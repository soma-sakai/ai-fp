/**
 * 家計シミュレーションエンジン
 * 複数のシナリオに基づいて将来の資産推移をシミュレーションする
 */

export interface SimulationInput {
  // 基本情報
  age: number;               // 年齢
  monthlySalary: number;     // 月収 (手取り)
  monthlyExpenses: number;   // 月間支出
  currentSavings: number;    // 現在の貯蓄額
  hasInvestment: boolean;    // 投資経験の有無
  
  // 追加情報
  expectedRetirementAge?: number;  // 想定退職年齢（デフォルト65歳）
  monthlyInvestment?: number;      // 月々の投資額
  investmentReturnRate?: number;   // 想定運用利回り（年率）
  inflationRate?: number;          // インフレ率（年率）
  expectedLifespan?: number;       // 想定寿命（デフォルト90歳）
  hasMortgage?: boolean;           // 住宅ローンの有無
  monthlyMortgage?: number;        // 月々の住宅ローン返済額
  remainingMortgageYears?: number; // 住宅ローン残年数
}

export interface YearlySimulation {
  age: number;               // 年齢
  year: number;              // 西暦
  savings: number;           // 預金残高
  investments: number;       // 投資残高
  totalAssets: number;       // 総資産
  yearlyIncome: number;      // 年間収入
  yearlyExpenses: number;    // 年間支出
  yearlyBalance: number;     // 年間収支
}

export interface SimulationResult {
  baseScenario: YearlySimulation[];      // 現状維持シナリオ
  savingScenario: YearlySimulation[];    // 貯蓄増額シナリオ
  investmentScenario: YearlySimulation[];// 投資シナリオ
  summaryText: string;                   // 分析サマリーテキスト
  riskLevel: string;                     // リスクレベル（安全・注意・危険）
  advicePoints: string[];                // アドバイスポイント
}

/**
 * 現状のまま推移した場合のシミュレーション
 */
function calculateBaseScenario(input: SimulationInput): YearlySimulation[] {
  const {
    age,
    monthlySalary,
    monthlyExpenses,
    currentSavings,
    expectedRetirementAge = 65,
    expectedLifespan = 90,
    inflationRate = 0.01,  // デフォルト1%
    hasMortgage = false,
    monthlyMortgage = 0,
    remainingMortgageYears = 0
  } = input;

  const result: YearlySimulation[] = [];
  let currentAge = age;
  const currentYear = new Date().getFullYear();
  let currentSavingsAmount = currentSavings;
  let currentInvestments = 0;
  
  // 毎月の収支差額（収入 - 支出）は計算のみで参照されない
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const monthlySaving = monthlySalary - monthlyExpenses - (hasMortgage ? monthlyMortgage : 0);
  
  // 現在から想定寿命までシミュレーション
  while (currentAge <= expectedLifespan) {
    const yearsPassed = currentAge - age;
    const simulationYear = currentYear + yearsPassed;
    
    // 収入計算（退職後は年金想定）
    const yearlyIncome = currentAge < expectedRetirementAge 
      ? monthlySalary * 12
      : monthlySalary * 0.6 * 12; // 退職後は現役時代の60%と仮定
    
    // 支出計算（インフレ考慮）
    let yearlyExpense = monthlyExpenses * 12 * Math.pow(1 + inflationRate, yearsPassed);
    
    // 住宅ローンがある場合
    if (hasMortgage && yearsPassed < remainingMortgageYears) {
      yearlyExpense += monthlyMortgage * 12;
    }
    
    // 年間収支
    const yearlyBalance = yearlyIncome - yearlyExpense;
    
    // 貯蓄残高の更新
    currentSavingsAmount += yearlyBalance;
    
    // マイナスにはならないよう調整（投資を取り崩す想定）
    if (currentSavingsAmount < 0 && currentInvestments > 0) {
      currentInvestments += currentSavingsAmount; // 負の値を足す（＝減らす）
      if (currentInvestments < 0) currentInvestments = 0;
      currentSavingsAmount = 0;
    }
    
    // 年間の結果を格納
    result.push({
      age: currentAge,
      year: simulationYear,
      savings: Math.max(0, currentSavingsAmount),
      investments: currentInvestments,
      totalAssets: Math.max(0, currentSavingsAmount) + currentInvestments,
      yearlyIncome,
      yearlyExpenses: yearlyExpense,
      yearlyBalance
    });
    
    // 年齢を1つ進める
    currentAge++;
  }
  
  return result;
}

/**
 * 貯蓄額を増やした場合のシミュレーション
 */
function calculateSavingScenario(input: SimulationInput): YearlySimulation[] {
  // 支出を10%削減したシナリオ
  const reducedExpenses = input.monthlyExpenses * 0.9;
  
  return calculateBaseScenario({
    ...input,
    monthlyExpenses: reducedExpenses
  });
}

/**
 * 投資を始めた場合のシミュレーション
 */
function calculateInvestmentScenario(input: SimulationInput): YearlySimulation[] {
  const {
    age,
    monthlySalary,
    monthlyExpenses,
    currentSavings,
    monthlyInvestment = monthlySalary * 0.1, // デフォルトは月収の10%
    investmentReturnRate = 0.04, // デフォルト年利4%
    expectedRetirementAge = 65,
    expectedLifespan = 90,
    inflationRate = 0.01,
    hasMortgage = false,
    monthlyMortgage = 0,
    remainingMortgageYears = 0
  } = input;

  const result: YearlySimulation[] = [];
  let currentAge = age;
  const currentYear = new Date().getFullYear();
  let currentSavingsAmount = currentSavings;
  let currentInvestments = 0;
  
  // 毎月の収支差額（収入 - 支出 - 投資）は計算のみで参照されない
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const monthlySaving = monthlySalary - monthlyExpenses - monthlyInvestment - (hasMortgage ? monthlyMortgage : 0);
  
  // 現在から想定寿命までシミュレーション
  while (currentAge <= expectedLifespan) {
    const yearsPassed = currentAge - age;
    const simulationYear = currentYear + yearsPassed;
    
    // 収入計算（退職後は年金想定）
    const yearlyIncome = currentAge < expectedRetirementAge 
      ? monthlySalary * 12
      : monthlySalary * 0.6 * 12; // 退職後は現役時代の60%と仮定
    
    // 支出計算（インフレ考慮）
    let yearlyExpense = monthlyExpenses * 12 * Math.pow(1 + inflationRate, yearsPassed);
    
    // 住宅ローンがある場合
    if (hasMortgage && yearsPassed < remainingMortgageYears) {
      yearlyExpense += monthlyMortgage * 12;
    }
    
    // 年間の投資額
    const yearlyInvestment = currentAge < expectedRetirementAge ? monthlyInvestment * 12 : 0;
    
    // 年間収支（投資額を含む）
    const yearlyBalance = yearlyIncome - yearlyExpense - yearlyInvestment;
    
    // 投資残高の更新（リターン + 新規投資）
    currentInvestments = currentInvestments * (1 + investmentReturnRate) + yearlyInvestment;
    
    // 貯蓄残高の更新
    currentSavingsAmount += yearlyBalance;
    
    // マイナスにはならないよう調整（投資を取り崩す想定）
    if (currentSavingsAmount < 0) {
      // 貯蓄がマイナスになる場合、投資から取り崩す
      currentInvestments += currentSavingsAmount; // 負の値を足す（＝減らす）
      if (currentInvestments < 0) currentInvestments = 0;
      currentSavingsAmount = 0;
    }
    
    // 年間の結果を格納
    result.push({
      age: currentAge,
      year: simulationYear,
      savings: currentSavingsAmount,
      investments: currentInvestments,
      totalAssets: currentSavingsAmount + currentInvestments,
      yearlyIncome,
      yearlyExpenses: yearlyExpense + yearlyInvestment,
      yearlyBalance
    });
    
    // 年齢を1つ進める
    currentAge++;
  }
  
  return result;
}

/**
 * シミュレーション結果からリスクレベルを判定
 */
function calculateRiskLevel(baseScenario: YearlySimulation[]): string {
  // 資産がマイナスになる年を探す
  const bankruptYear = baseScenario.findIndex(year => year.totalAssets <= 0);
  
  if (bankruptYear >= 0) {
    return '危険'; // 資産が枯渇するケース
  } else if (baseScenario[baseScenario.length - 1].yearlyBalance < 0) {
    return '注意'; // 最終年で赤字になるケース
  } else {
    return '安全'; // 最後まで資産が残るケース
  }
}

/**
 * シミュレーション結果からアドバイスを生成
 */
function generateAdvice(input: SimulationInput, baseScenario: YearlySimulation[], savingScenario: YearlySimulation[], investmentScenario: YearlySimulation[]): string[] {
  const advice: string[] = [];
  
  // 毎月の収支がマイナスの場合
  if (input.monthlySalary < input.monthlyExpenses) {
    advice.push('毎月の収支がマイナスです。支出の見直しが必要です。');
  }
  
  // 貯蓄が少ない場合
  if (input.currentSavings < input.monthlyExpenses * 6) {
    advice.push('緊急資金として最低でも生活費6ヶ月分（' + (input.monthlyExpenses * 6).toLocaleString() + '円）の貯蓄を目指しましょう。');
  }
  
  // 投資をしていない場合
  if (!input.hasInvestment) {
    advice.push('長期的な資産形成のために、投資の検討をおすすめします。投資を行うことで、' + 
      (investmentScenario[investmentScenario.length - 1].totalAssets - baseScenario[baseScenario.length - 1].totalAssets).toLocaleString() + 
      '円の資産増加が見込まれます。');
  }
  
  // 支出削減の効果
  const savingEffect = savingScenario[savingScenario.length - 1].totalAssets - baseScenario[baseScenario.length - 1].totalAssets;
  if (savingEffect > 0) {
    advice.push('月々の支出を10%削減すると、生涯で約' + savingEffect.toLocaleString() + '円の資産増加が見込まれます。');
  }
  
  return advice;
}

/**
 * シミュレーション結果のサマリーテキストを生成
 */
function generateSummary(input: SimulationInput, baseScenario: YearlySimulation[], savingScenario: YearlySimulation[], investmentScenario: YearlySimulation[]): string {
  const { age, expectedRetirementAge = 65 } = input;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const yearsToRetirement = expectedRetirementAge - age;
  
  const baseEndAssets = baseScenario[baseScenario.length - 1].totalAssets;
  const investmentEndAssets = investmentScenario[investmentScenario.length - 1].totalAssets;
  const assetDifference = investmentEndAssets - baseEndAssets;
  
  let summary = `現在の収支状況が続いた場合、`;
  
  if (baseEndAssets <= 0) {
    const bankruptYear = baseScenario.findIndex(year => year.totalAssets <= 0);
    summary += `${bankruptYear + age}歳（${baseScenario[bankruptYear].year}年）頃に資産が底をつく可能性があります。`;
  } else {
    summary += `生涯にわたって約${Math.floor(baseEndAssets / 10000)}万円の資産を確保できる見込みです。`;
  }
  
  summary += `\n\n月々の支出を10%削減すると、約${Math.floor((savingScenario[savingScenario.length - 1].totalAssets - baseEndAssets) / 10000)}万円の資産増加が見込まれます。`;
  
  if (assetDifference > 0) {
    summary += `\n\n毎月の収入の一部を投資に回すことで、生涯で約${Math.floor(assetDifference / 10000)}万円の資産増加が期待できます。`;
  }
  
  return summary;
}

/**
 * メインのシミュレーション実行関数
 */
export function runSimulation(input: SimulationInput): SimulationResult {
  // 各シナリオの計算
  const baseScenario = calculateBaseScenario(input);
  const savingScenario = calculateSavingScenario(input);
  const investmentScenario = calculateInvestmentScenario(input);
  
  // リスクレベルの計算
  const riskLevel = calculateRiskLevel(baseScenario);
  
  // アドバイスの生成
  const advicePoints = generateAdvice(input, baseScenario, savingScenario, investmentScenario);
  
  // サマリーの生成
  const summaryText = generateSummary(input, baseScenario, savingScenario, investmentScenario);
  
  return {
    baseScenario,
    savingScenario,
    investmentScenario,
    summaryText,
    riskLevel,
    advicePoints
  };
} 