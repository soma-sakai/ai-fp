import { parseAmountFromString } from './budgetCalculator';
import { supabase } from './supabase';

interface SimulationInputs {
  age: number | string;
  annualIncome: number | string;
  spouseIncome?: number | string;
  savings: number | string;
  mortgageLoanBalance?: number | string;
  monthlyMortgagePayment?: number | string;
  otherDebts?: number | string;
  hasSpouse?: string;
  childrenCount?: string;
  childrenAges?: string;
  retirementAge?: string;
  monthlyLivingExpenses?: string;
  educationPolicy?: string;
  loanYears?: string | number;
  expectedInterestRate?: string | number;
  initialInvestment?: string | number;
  monthlyContribution?: string | number;
  investmentYield?: string | number;
  events?: Record<string, { type: string; amount: number }>;
  withdrawals?: Record<string, number>;
  inflationRate?: string | number;
  raiseRate?: string | number;
  [key: string]: any;
}

export interface YearlyBalance {
  age: number;
  year: number;
  income: number;
  expenses: {
    housing: number;
    education: number;
    living: number;
    insurance: number;
    tax: number;
    other: number;
    [key: string]: number;
  };
  totalExpense: number;
  balance: number;
  savings: number;
  investment?: {
    balance: number;
    yield: number;
    contribution: number;
    withdrawals: number;
  };
  pension?: number;
  mortgage?: {
    principal: number;
    interest: number;
    balance: number;
  };
  alerts?: string[];
}

/**
 * 年齢から西暦を計算
 */
function calculateYear(currentAge: number): number {
  // 2025年から始まるようにする
  return 2025 + (currentAge - parseAgeToNumber(currentAge));
}

/**
 * 年齢を数値に変換
 */
function parseAgeToNumber(age: string | number): number {
  if (typeof age === 'number') return age;
  
  if (typeof age === 'string') {
    if (age.includes('代')) {
      // 「30代前半」「40代後半」などの表記を処理
      const baseAge = parseInt(age.match(/\d+/)?.[0] || '0');
      const isLate = age.includes('後半');
      
      return baseAge + (isLate ? 5 : 0);
    }
    
    // 数字のみの抽出
    const numericAge = parseInt(age.replace(/[^0-9]/g, ''));
    return isNaN(numericAge) ? 30 : numericAge; // デフォルト30歳
  }
  
  return 30; // デフォルト値
}

/**
 * 子供の年齢を配列に変換
 */
function parseChildrenAges(childrenCount: string, childrenAges: string): number[] {
  const count = parseInt(childrenCount?.replace(/[^0-9]/g, '') || '0');
  
  if (count === 0) return [];
  
  // 子供の年齢区分に基づいてデフォルトの年齢を設定
  if (childrenAges) {
    if (childrenAges.includes('未就学児')) return Array(count).fill(3);
    if (childrenAges.includes('小学生')) return Array(count).fill(9);
    if (childrenAges.includes('中学生')) return Array(count).fill(13);
    if (childrenAges.includes('高校生')) return Array(count).fill(16);
    if (childrenAges.includes('大学生')) return Array(count).fill(20);
    
    if (childrenAges.includes('複数の年齢層')) {
      // 複数の年齢層の場合は均等に分布
      const ages = [];
      for (let i = 0; i < count; i++) {
        ages.push(3 + (i * 5) % 18); // 3歳から始めて5歳間隔で、最大18歳まで
      }
      return ages;
    }
  }
  
  // デフォルト値
  return Array(count).fill(5);
}

/**
 * 退職年齢を数値に変換
 */
function parseRetirementAge(retirementAge: string): number {
  if (!retirementAge) return 65;
  
  if (retirementAge.includes('まだ決めていない')) return 65;
  if (retirementAge.includes('60歳未満')) return 58;
  if (retirementAge.includes('60歳')) return 60;
  if (retirementAge.includes('65歳')) return 65;
  if (retirementAge.includes('70歳')) return 70;
  if (retirementAge.includes('70歳以上')) return 75;
  
  // 数字だけの場合
  const age = parseInt(retirementAge.replace(/[^0-9]/g, ''));
  return isNaN(age) ? 65 : age;
}

/**
 * 教育方針に基づく教育費の計算
 */
function calculateEducationExpense(childAge: number, policy: string, year: number): number {
  // 子供の年齢に応じた教育費（月額・万円）
  const baseExpense = childAge < 6 ? 3 : // 未就学児
                      childAge < 12 ? 5 : // 小学生
                      childAge < 15 ? 8 : // 中学生
                      childAge < 18 ? 12 : // 高校生
                      childAge < 22 ? 15 : 0; // 大学生
  
  // 教育方針による係数
  const policyFactor = policy?.includes('私立中心') ? 1.5 :
                      policy?.includes('公立中心') ? 1.0 : 1.2;
  
  // インフレ率（年1%と仮定）
  const inflationRate = 0.01;
  const inflationFactor = Math.pow(1 + inflationRate, year - 1);
  
  return baseExpense * policyFactor * 10000 * 12 * inflationFactor; // 年間費用に換算（万円→円）
}

/**
 * 住宅ローンの計算（元利均等返済）
 */
function calculateMortgage(
  principal: number,
  annualRate: number,
  termYears: number,
  year: number
): { principal: number; interest: number; balance: number } {
  // 既に完済している場合
  if (year > termYears) {
    return { principal: 0, interest: 0, balance: 0 };
  }
  
  // 月利計算
  const monthlyRate = annualRate / 12 / 100;
  const totalMonths = termYears * 12;
  
  // 月々の返済額（元利均等返済）
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  // 前年末までの返済回数
  const paymentsMade = (year - 1) * 12;
  
  // 前年末時点の残高
  let balance = principal * (Math.pow(1 + monthlyRate, totalMonths) - Math.pow(1 + monthlyRate, paymentsMade)) /
               (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  // 当年の元金と利息
  let annualPrincipal = 0;
  let annualInterest = 0;
  let currentBalance = balance;
  
  // 当年の12か月分の返済を計算
  for (let i = 0; i < 12; i++) {
    // 月ごとの利息
    const monthlyInterest = currentBalance * monthlyRate;
    // 月ごとの元金
    const monthlyPrincipal = monthlyPayment - monthlyInterest;
    
    annualInterest += monthlyInterest;
    annualPrincipal += monthlyPrincipal;
    
    // 残高更新
    currentBalance -= monthlyPrincipal;
    if (currentBalance < 0) currentBalance = 0;
  }
  
  // 当年末の残高
  balance = currentBalance;
  
  return {
    principal: annualPrincipal,
    interest: annualInterest,
    balance: balance
  };
}

/**
 * 投資運用のシミュレーション
 */
function calculateInvestment(
  previousBalance: number,
  monthlyContribution: number,
  annualYield: number,
  withdrawals: number,
  isFirstYear: boolean,
  initialInvestment: number
): { balance: number; yield: number; contribution: number; withdrawals: number } {
  // 初期投資（初年度のみ）
  let balance = previousBalance;
  if (isFirstYear) {
    balance += initialInvestment;
  }
  
  // 年間積立額
  const annualContribution = monthlyContribution * 12;
  balance += annualContribution;
  
  // 運用利回り計算（複利で計算）
  const yieldAmount = balance * (annualYield / 100);
  balance += yieldAmount;
  
  // 取り崩し
  balance -= withdrawals;
  if (balance < 0) balance = 0;
  
  return {
    balance,
    yield: yieldAmount,
    contribution: annualContribution,
    withdrawals
  };
}

/**
 * 生涯の収支シミュレーションを生成
 */
export function generateLifetimeSimulation(inputs: SimulationInputs): YearlyBalance[] {
  // 基本情報の処理
  const currentAge = parseAgeToNumber(inputs.age);
  const maxSimulationAge = 90; // シミュレーション終了年齢
  const simulationYears = maxSimulationAge - currentAge;
  
  // 収入
  const annualIncome = typeof inputs.annualIncome === 'string' ? 
    parseAmountFromString(inputs.annualIncome as string) : 
    (inputs.annualIncome || 0); // デフォルト値を使わないように変更
  
  const spouseIncome = inputs.hasSpouse === 'はい' && inputs.spouseIncome ? 
    (typeof inputs.spouseIncome === 'string' ? 
      parseAmountFromString(inputs.spouseIncome as string) : inputs.spouseIncome) : 0;
  
  // 退職年齢
  const retirementAge = parseRetirementAge(inputs.retirementAge || '65歳');
  
  // 子供情報
  const childrenAges = parseChildrenAges(
    inputs.childrenCount || '0人', 
    inputs.childrenAges || ''
  );
  
  // 教育方針
  const educationPolicy = inputs.educationPolicy || '公立中心';
  
  // 生活費
  const monthlyLivingExpense = inputs.monthlyLivingExpenses ? 
    (typeof inputs.monthlyLivingExpenses === 'string' ? 
      parseAmountFromString(inputs.monthlyLivingExpenses as string) : 
      inputs.monthlyLivingExpenses) : 200000;
  
  // 住宅ローン
  const monthlyMortgagePayment = inputs.monthlyMortgagePayment ? 
    (typeof inputs.monthlyMortgagePayment === 'string' ? 
      parseAmountFromString(inputs.monthlyMortgagePayment as string) : 
      inputs.monthlyMortgagePayment) : 0;
  
  let mortgageLoanBalance = inputs.mortgageLoanBalance ? 
    (typeof inputs.mortgageLoanBalance === 'string' ? 
      parseAmountFromString(inputs.mortgageLoanBalance as string) : 
      inputs.mortgageLoanBalance) : 0;
  
  // 住宅ローン関連情報
  const loanYears = inputs.loanYears ? 
    (typeof inputs.loanYears === 'string' ? 
      parseInt(inputs.loanYears) : inputs.loanYears) : 35;
  
  const interestRate = inputs.expectedInterestRate ? 
    (typeof inputs.expectedInterestRate === 'string' ? 
      parseFloat(inputs.expectedInterestRate) : inputs.expectedInterestRate) : 1.0;
  
  // 投資運用関連情報
  const initialInvestment = inputs.initialInvestment ? 
    (typeof inputs.initialInvestment === 'string' ? 
      parseAmountFromString(inputs.initialInvestment as string) : 
      inputs.initialInvestment) : 1000000; // デフォルト100万円に設定（以前は200万円）
  
  const monthlyContribution = inputs.monthlyContribution ? 
    (typeof inputs.monthlyContribution === 'string' ? 
      parseAmountFromString(inputs.monthlyContribution as string) : 
      inputs.monthlyContribution) : 20000; // デフォルト月2万円に設定（以前は5万円）
  
  const investmentYield = inputs.investmentYield ? 
    (typeof inputs.investmentYield === 'string' ? 
      parseFloat(inputs.investmentYield as string) : 
      inputs.investmentYield) : 2.0; // デフォルト2.0%のリターン（以前は4.0%）
  
  // インフレ率
  const inflationRate = inputs.inflationRate ? 
    (typeof inputs.inflationRate === 'string' ? 
      parseFloat(inputs.inflationRate) : inputs.inflationRate) : 0.01; // デフォルト1.0%
      
  // 昇給率
  const raiseRate = inputs.raiseRate ? 
    (typeof inputs.raiseRate === 'string' ? 
      parseFloat(inputs.raiseRate) : inputs.raiseRate) : 0.02; // デフォルト2.0%
  
  // 貯蓄残高の初期値
  let currentSavings = typeof inputs.savings === 'string' ? 
    parseAmountFromString(inputs.savings as string) : 
    (inputs.savings || 0); // デフォルト値を使わないように変更
  
  // 投資残高の初期値
  let investmentBalance = 0;
  
  // シミュレーション結果を格納する配列
  const simulationResult: YearlyBalance[] = [];
  
  // アラート情報を格納するオブジェクト
  const alerts: Record<number, string[]> = {};
  
  // 住宅ローンの返済スケジュールを事前計算
  const loanSchedule = calculateLoanSchedule(mortgageLoanBalance, interestRate, loanYears * 12);
  
  // 各年のシミュレーション
  for (let i = 0; i <= simulationYears; i++) {
    const age = currentAge + i;
    const year = calculateYear(currentAge) + i; // 年齢から開始西暦を計算し、i年後の西暦を取得
    
    // 収入計算
    let income = 0;
    
    if (i === 0) {
      // 初年度は入力値をそのまま使用
      income = annualIncome;
    } else {
      // 2年目以降の年収計算
      const prevYearIncome = simulationResult[i-1].income;
      
      // 年齢による年収変化を適用
      if (age >= retirementAge) {
        // 退職後（年金受給年齢以降）
        income = Math.floor(annualIncome * 0.6); // 働いていた時の60%程度
      } else if (age >= 50) {
        // 50歳以上は年収が10%アップ（キャリアピーク）
        income = Math.floor(annualIncome * 1.1);
        // さらに昇給も適用（複利的に）
        income = Math.floor(prevYearIncome * (1 + raiseRate * 0.5)); // 50歳以上は昇給率半減
      } else {
        // 50歳未満は毎年昇給あり
        income = Math.floor(prevYearIncome * (1 + raiseRate));
      }
    }
    
    // 配偶者の収入
    if (inputs.hasSpouse === 'はい') {
      let additionalIncome = spouseIncome;
      
      // 配偶者も退職年齢に応じて収入変化
      if (age >= retirementAge - 2) { // 配偶者は2歳若いと仮定
        additionalIncome = Math.floor(spouseIncome * 0.6);
      }
      
      income += additionalIncome;
    }
    
    // 年金収入
    let pensionIncome = 0;
    if (age >= retirementAge) {
      pensionIncome = 1200000; // デフォルト年金額（年120万円）
      if (inputs.pensionAmount) {
        pensionIncome = typeof inputs.pensionAmount === 'string' 
          ? parseAmountFromString(inputs.pensionAmount) 
          : inputs.pensionAmount;
      }
      income += pensionIncome; // 総収入に加算
    }
    
    // 支出計算
    // 1. 基本生活費（収入の一定割合 + インフレ調整）
    const baseExpenseRate = age < retirementAge ? 0.5 : 0.7; // 働いている間は収入の50%、退職後は70%
    let livingExpense = income * baseExpenseRate * Math.pow(1 + inflationRate, i);
    
    // 家族構成に応じて生活費を調整
    const familySize = 1 + (inputs.hasSpouse === 'はい' ? 1 : 0) + 
      childrenAges.filter(childAge => (childAge + i) < 22).length;
    
    livingExpense = livingExpense * (1 + (familySize - 1) * 0.3);
    
    // 2. 住宅ローン（事前計算したスケジュールから取得）
    let housingExpense = 0;
    let mortgageDetails = { principal: 0, interest: 0, balance: 0 };
    
    if (loanSchedule && i < loanYears) {
      mortgageDetails = {
        principal: loanSchedule.principal[i] || 0,
        interest: loanSchedule.interest[i] || 0,
        balance: loanSchedule.balance[i] || 0
      };
      housingExpense = mortgageDetails.principal + mortgageDetails.interest;
    }
    
    // 3. 教育費
    let educationExpense = 0;
    childrenAges.forEach(childAge => {
      const currentChildAge = childAge + i;
      if (currentChildAge < 22) { // 22歳未満の子供のみ教育費がかかる
        educationExpense += calculateEducationExpense(currentChildAge, educationPolicy, i + 1);
      }
    });
    
    // 4. 保険料（インフレ考慮）
    const insuranceExpense = 120000 * Math.pow(1 + inflationRate, i); // 年間12万円と仮定
    
    // 5. 税金（簡易計算）
    const taxRate = income > 10000000 ? 0.33 :
                   income > 6000000 ? 0.23 :
                   income > 3300000 ? 0.2 : 0.1;
    const taxExpense = income * taxRate;
    
    // 6. その他の支出
    const otherExpense = income * 0.1; // 収入の10%
    
    // 7. イベント支出/収入
    const events = inputs.events || {};
    let eventExpenses: Record<string, number> = {};
    
    if (events[i.toString()]) {
      const event = events[i.toString()];
      eventExpenses[event.type] = event.amount;
    }
    
    // 総支出
    const totalExpense = housingExpense + educationExpense + livingExpense + 
                         insuranceExpense + taxExpense + otherExpense +
                         Object.values(eventExpenses).reduce((sum, amount) => sum + amount, 0);
    
    // 収支バランス（フロー）
    const balance = income - totalExpense;
    
    // 8. 投資運用（ストック計算の一部）
    const withdrawalAmount = inputs.withdrawals && inputs.withdrawals[i.toString()] 
      ? inputs.withdrawals[i.toString()] : 0;
    
    const investmentResult = calculateInvestment(
      investmentBalance,
      monthlyContribution,
      investmentYield,
      withdrawalAmount,
      i === 0,
      initialInvestment
    );
    
    investmentBalance = investmentResult.balance;
    
    // 9. 貯蓄残高の更新（ストック計算）
    // 前年度末残高 + 当年収支 + 投資運用益
    if (i === 0) {
      // 初年度は初期値をそのまま使用
      currentSavings = currentSavings;
    } else {
      currentSavings += balance;
    }
    
    // 10. アラートチェック
    const yearAlerts: string[] = [];
    
    // 収入が生活費を下回るケース
    if (income < livingExpense) {
      yearAlerts.push(`収入が生活費を下回っています。収入：${Math.round(income/10000)}万円、生活費：${Math.round(livingExpense/10000)}万円`);
    }
    
    // 預金残高がマイナスになるケース
    if (currentSavings < 0) {
      yearAlerts.push(`預金残高がマイナスになっています：${Math.round(currentSavings/10000)}万円`);
    }
    
    // 老後資金が基準を下回るケース
    if (age >= retirementAge && (currentSavings + investmentBalance) < 1000000 * (90 - age)) {
      yearAlerts.push(`老後資金が少なくなっています。必要額の目安：${(90-age) * 100}万円、現在額：${Math.round((currentSavings + investmentBalance)/10000)}万円`);
    }
    
    // アラートがあれば追加
    if (yearAlerts.length > 0) {
      alerts[year] = yearAlerts;
    }
    
    // 結果を追加
    simulationResult.push({
      age,
      year,
      income,
      expenses: {
        housing: housingExpense,
        education: educationExpense,
        living: livingExpense,
        insurance: insuranceExpense,
        tax: taxExpense,
        other: otherExpense,
        ...eventExpenses
      },
      totalExpense,
      balance,
      savings: currentSavings,
      investment: investmentResult,
      pension: pensionIncome,
      mortgage: mortgageDetails,
      alerts: yearAlerts.length > 0 ? yearAlerts : undefined
    });
  }
  
  return simulationResult;
}

/**
 * 住宅ローンの返済スケジュールを計算
 */
function calculateLoanSchedule(
  principal: number,
  annualRate: number,
  totalMonths: number
): { principal: number[]; interest: number[]; balance: number[] } {
  // 返済がない場合
  if (principal <= 0 || totalMonths <= 0) {
    return { principal: [], interest: [], balance: [] };
  }
  
  const yearlySchedule = {
    principal: [] as number[],
    interest: [] as number[],
    balance: [] as number[]
  };
  
  // 月利計算
  const monthlyRate = annualRate / 12 / 100;
  
  // 月々の返済額（元利均等返済）
  const monthlyPayment = principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) /
                        (Math.pow(1 + monthlyRate, totalMonths) - 1);
  
  // 残債
  let remainingBalance = principal;
  
  // 年ごとのスケジュール計算
  const years = Math.ceil(totalMonths / 12);
  
  for (let year = 0; year < years; year++) {
    let annualPrincipal = 0;
    let annualInterest = 0;
    
    // 当年の12か月分（または残り月数）の返済を計算
    const monthsInThisYear = Math.min(12, totalMonths - year * 12);
    
    for (let month = 0; month < monthsInThisYear; month++) {
      // 月ごとの利息
      const monthlyInterest = remainingBalance * monthlyRate;
      // 月ごとの元金
      const monthlyPrincipal = monthlyPayment - monthlyInterest;
      
      annualInterest += monthlyInterest;
      annualPrincipal += monthlyPrincipal;
      
      // 残高更新
      remainingBalance -= monthlyPrincipal;
      if (remainingBalance < 0) remainingBalance = 0;
    }
    
    // 年間の返済結果を記録
    yearlySchedule.principal.push(annualPrincipal);
    yearlySchedule.interest.push(annualInterest);
    yearlySchedule.balance.push(remainingBalance);
  }
  
  return yearlySchedule;
}

/**
 * 特定の年のシミュレーション結果を取得
 */
export function getYearSimulation(simulation: YearlyBalance[], targetYear: number): YearlyBalance | undefined {
  return simulation.find(yearly => yearly.year === targetYear);
}

/**
 * シミュレーション結果から現金残高のピーク時を取得
 */
export function getPeakSavings(simulation: YearlyBalance[]): { year: number; amount: number } {
  const peak = simulation.reduce((max, current) => 
    current.savings > max.savings ? current : max, simulation[0]);
  
  return { year: peak.year, amount: peak.savings };
}

/**
 * 診断結果IDからシミュレーションを実行
 */
export async function runSimulationFromDiagnosisResult(diagnosisResultId: string): Promise<{ simulationId: string | null; error: any }> {
  try {
    console.log('診断結果IDからシミュレーションを実行:', diagnosisResultId);
    
    // 診断結果データを先に取得して入力検証 - より詳細なデータを取得
    const { data: diagnosisData, error: fetchError } = await supabase
      .from('diagnosis_results')
      .select('*')
      .eq('id', diagnosisResultId)
      .single();
    
    if (fetchError) {
      console.error('診断結果データ取得エラー:', fetchError);
      // エラーがあっても診断結果IDを返す (フォールバック用)
      return { 
        simulationId: diagnosisResultId,
        error: { 
          message: 'フォールバック使用: 診断結果データ取得エラー', 
          type: 'fallback_used' 
        } 
      };
    }
    
    // 入力検証: 年収と貯蓄額が存在するか確認し、ログに出力
    if (diagnosisData) {
      // 診断結果から重要なデータを抽出してログ出力
      console.log('シミュレーション入力データの検証:');
      console.log('- 診断ID:', diagnosisData.id);
      console.log('- 年収:', diagnosisData.annual_income);
      console.log('- 貯蓄額:', diagnosisData.savings);
      console.log('- 年齢:', diagnosisData.age);
      console.log('- 家族構成:', diagnosisData.family_size);
      console.log('- 配偶者の有無:', diagnosisData.has_spouse);
      console.log('- 配偶者の収入:', diagnosisData.spouse_income);
      console.log('- 子供の数:', diagnosisData.children_count);
      console.log('- 住宅ローン残高:', diagnosisData.mortgage_loan_balance);
      console.log('- 月々の住宅ローン返済額:', diagnosisData.monthly_mortgage_payment);
      
      // 追加データの検証
      if (diagnosisData.additional_data) {
        console.log('- 追加データ:');
        
        if (diagnosisData.additional_data.chatbot_data) {
          console.log('  - チャットボットデータ:');
          const chatbotData = diagnosisData.additional_data.chatbot_data;
          console.log('    - チャットボット年収:', chatbotData.annualIncome);
          console.log('    - チャットボット貯蓄額:', chatbotData.savings);
          console.log('    - チャットボット年齢:', chatbotData.age);
        }
        
        if (diagnosisData.additional_data.processed_data) {
          console.log('  - 前処理済みデータ:', diagnosisData.additional_data.processed_data);
        }
      }
      
      // 必須入力の検証
      if (!diagnosisData.annual_income) {
        console.warn('‼️ 年収データが不足しています ‼️');
        console.warn('チャットボットから年収データの取得を試みます...');
        
        if (diagnosisData.additional_data?.chatbot_data?.annualIncome) {
          console.log('チャットボットから年収データ見つかりました:', diagnosisData.additional_data.chatbot_data.annualIncome);
        } else {
          console.warn('チャットボットからも年収データが見つかりませんでした。デフォルト値が使用されます。');
        }
      }
      
      if (diagnosisData.savings === null || diagnosisData.savings === undefined) {
        console.warn('‼️ 貯蓄額データが不足しています ‼️');
        console.warn('チャットボットから貯蓄額データの取得を試みます...');
        
        if (diagnosisData.additional_data?.chatbot_data?.savings) {
          console.log('チャットボットから貯蓄額データ見つかりました:', diagnosisData.additional_data.chatbot_data.savings);
        } else {
          console.warn('チャットボットからも貯蓄額データが見つかりませんでした。デフォルト値が使用されます。');
        }
      }
    } else {
      console.error('診断結果が見つかりませんでした:', diagnosisResultId);
      // 診断結果IDをそのまま返す (フォールバック用)
      return { 
        simulationId: diagnosisResultId, 
        error: { 
          message: 'フォールバック使用: 診断結果が見つかりません', 
          type: 'fallback_used' 
        } 
      };
    }
    
    // シミュレーション実行関数を呼び出し
    console.log('シミュレーション実行関数を呼び出します...');
    
    const { data, error } = await supabase.rpc('fn_simulate_life_plan', {
      diagnosis_result_id: diagnosisResultId
    });
    
    if (error) {
      console.error('シミュレーション実行エラー:', error);
      // エラーがあっても診断結果IDを返す (フォールバック用)
      return { 
        simulationId: diagnosisResultId, 
        error: { 
          message: 'フォールバック使用: シミュレーション実行エラー', 
          type: 'fallback_used', 
          originalError: error 
        } 
      };
    }
    
    // 処理成功
    console.log('シミュレーション実行完了 - シミュレーションID:', data);
    
    return { simulationId: data, error: null };
  } catch (error) {
    console.error('シミュレーション実行中に例外が発生しました:', error);
    // 例外発生時も診断結果IDを返す (フォールバック用)
    return { 
      simulationId: diagnosisResultId, 
      error: { 
        message: 'フォールバック使用: シミュレーション例外発生', 
        type: 'fallback_used', 
        originalError: error 
      } 
    };
  }
}

/**
 * シミュレーション結果を取得
 */
export async function getSimulationResult(simulationId: string): Promise<{ simulationRun: any; yearlyData: any[]; error: any }> {
  try {
    // シミュレーション実行結果を取得
    const { data: simulationRun, error: simulationError } = await supabase
      .from('simulation_runs')
      .select('*, diagnosis_result:diagnosis_result_id(*)')
      .eq('id', simulationId)
      .single();
    
    if (simulationError) {
      console.error('シミュレーション実行結果取得エラー:', simulationError);
      
      // 診断結果データを直接取得するフォールバック処理
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .select('*')
        .eq('id', simulationId)
        .single();
      
      if (diagnosisError) {
        console.error('診断結果データ取得エラー:', diagnosisError);
        return { 
          simulationRun: null, 
          yearlyData: [], 
          error: { 
            message: 'フォールバック使用: 診断結果データも取得できません', 
            type: 'fallback_used' 
          } 
        };
      }
      
      // 診断結果からシミュレーション実行結果を作成
      const fallbackSimulationRun = {
        id: simulationId,
        diagnosis_result_id: simulationId,
        diagnosis_result: diagnosisData,
        summary: {
          annual_income: diagnosisData.annual_income,
          savings: diagnosisData.savings
        }
      };
      
      return { 
        simulationRun: fallbackSimulationRun, 
        yearlyData: [], 
        error: { 
          message: 'フォールバック使用: 診断結果から作成', 
          type: 'fallback_used'
        } 
      };
    }
    
    // 基本データの検証と出力
    if (simulationRun?.diagnosis_result) {
      console.log('シミュレーションの入力データ:');
      console.log('- 年収:', simulationRun.diagnosis_result.annual_income);
      console.log('- 貯蓄額:', simulationRun.diagnosis_result.savings);
    }
    
    // 年次データを取得
    const { data: yearlyData, error: yearlyError } = await supabase
      .from('simulation_yearly_data')
      .select('*')
      .eq('run_id', simulationId)
      .order('year', { ascending: true });
    
    if (yearlyError) {
      console.error('年次データ取得エラー:', yearlyError);
      return { simulationRun, yearlyData: [], error: yearlyError };
    }
    
    // シミュレーション結果の初期データを検証
    if (yearlyData && yearlyData.length > 0) {
      const firstYear = yearlyData[0];
      console.log('シミュレーション結果の初年度データ:');
      console.log('- 年収:', firstYear.income_total);
      console.log('- 貯蓄残高:', firstYear.balance_end);
    }
    
    return { simulationRun, yearlyData, error: null };
  } catch (error) {
    console.error('シミュレーション結果取得中に例外が発生しました:', error);
    
    // 例外発生時のフォールバック
    try {
      // 診断結果テーブルから直接データを取得
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .select('*')
        .eq('id', simulationId)
        .single();

      if (!diagnosisError && diagnosisData) {
        console.log('例外発生時のフォールバック: 診断結果データ取得成功', {
          annual_income: diagnosisData.annual_income,
          savings: diagnosisData.savings
        });
        
        // 最小限のシミュレーション実行結果を作成
        const fallbackSimulationRun = {
          id: simulationId,
          diagnosis_result_id: simulationId,
          diagnosis_result: diagnosisData
        };
        
        return { 
          simulationRun: fallbackSimulationRun, 
          yearlyData: [], 
          error: { 
            message: 'フォールバック使用: 診断結果から生成', 
            type: 'fallback_used' 
          }
        };
      }
    } catch (fallbackError) {
      console.error('フォールバック処理中に2次例外が発生:', fallbackError);
    }
    
    return { 
      simulationRun: null, 
      yearlyData: [], 
      error: { 
        message: 'フォールバック使用: 全ての取得に失敗', 
        type: 'fallback_used' 
      } 
    };
  }
} 