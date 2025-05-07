import { supabase } from './supabase';
import { YearlyBalance } from './simulationCalculator';

/**
 * 簡易住宅予算診断APIを呼び出す
 */
export async function getSimpleBudget(params: any): Promise<{ maxBudget: number; error: any }> {
  try {
    const { data, error } = await supabase.functions.invoke('simulation-api/simple-budget', {
      method: 'POST',
      body: params
    });
    
    if (error) {
      console.error('簡易住宅予算診断APIエラー:', error);
      return { maxBudget: 0, error };
    }
    
    return { maxBudget: data.maxBudget, error: null };
  } catch (error) {
    console.error('簡易住宅予算診断API呼び出し中に例外が発生しました:', error);
    return { maxBudget: 0, error };
  }
}

/**
 * シミュレーション実行APIを呼び出す
 */
export async function runSimulation(diagnosisResultId: string): Promise<{ simulationId: string | null; error: any }> {
  try {
    console.log('シミュレーション実行API呼び出し開始 - 診断結果ID:', diagnosisResultId);
    
    // 常にフォールバック処理を使用
    console.log('フォールバック: 診断結果IDをシミュレーションIDとして返します');
    return { 
      simulationId: diagnosisResultId, 
      error: { 
        message: 'フォールバック使用: 診断結果IDを使用',
        type: 'fallback_used'
      } 
    };
    
    /* 以下のコードは現在使用しない
    // まず診断結果データを取得（シミュレーション実行に先立ってデータ検証）
    const { data: diagnosisData, error: diagnosisError } = await supabase
      .from('diagnosis_results')
      .select('*')
      .eq('id', diagnosisResultId)
      .single();
    
    if (diagnosisError) {
      console.error('診断結果データ取得エラー:', diagnosisError);
      // エラーが発生しても診断結果IDを返す（フォールバック処理のため）
      return { 
        simulationId: diagnosisResultId, 
        error: { message: 'フォールバック使用: 診断結果IDを使用', type: 'fallback_used' } 
      };
    }
    
    console.log('取得した診断結果データ:', {
      id: diagnosisData.id,
      annual_income: diagnosisData.annual_income,
      savings: diagnosisData.savings,
      age: diagnosisData.age
    });
    
    // Docker/Edge Functions実装がないため、常にフォールバック処理を使用
    console.log('フォールバック: 診断結果IDをシミュレーションIDとして返します');
    return { 
      simulationId: diagnosisResultId, 
      error: { 
        message: 'フォールバック使用: 診断結果IDを使用',
        type: 'fallback_used'
      } 
    };
    */
    
    /* Edge Functions が設定されている場合は以下を使用
    const { data, error } = await supabase.functions.invoke('simulation-api/run-simulation', {
      method: 'POST',
      body: { diagnosisResultId }
    });
    
    if (error) {
      console.error('シミュレーション実行APIエラー:', error);
      
      // エラー時の直接フォールバック: RPC代わりにdbから直接取得してローカルシミュレーション用のIDを返す
      console.log('フォールバック: 診断結果IDをシミュレーションIDとして返します');
      return { simulationId: diagnosisResultId, error: { message: 'RPC呼び出しエラー - フォールバック使用', originalError: error } };
    }
    
    return { simulationId: data.simulationId, error: null };
    */
  } catch (error) {
    console.error('シミュレーション実行API呼び出し中に例外が発生しました:', error);
    
    // 例外発生時も診断結果IDをシミュレーションIDとして返すフォールバック
    return { 
      simulationId: diagnosisResultId, 
      error: { message: 'フォールバック使用: 診断結果IDを使用', type: 'fallback_used' } 
    };
  }
}

/**
 * シミュレーション結果取得APIを呼び出す
 */
export async function getSimulation(simulationId: string): Promise<{ 
  simulationRun: any; 
  yearlyData: YearlyData[]; 
  error: any 
}> {
  try {
    console.log('シミュレーション結果取得開始 - ID:', simulationId);
    
    // まずsimulation_runsテーブルから直接取得を試みる
    const { data: simulationRun, error: directError } = await supabase
      .from('simulation_runs')
      .select('*, diagnosis_result:diagnosis_result_id(*)')
      .eq('id', simulationId)
      .single();
    
    if (!directError && simulationRun) {
      console.log('simulation_runsテーブルから直接データ取得成功:', simulationRun);
      
      // 年次データを取得
      const { data: yearlyData, error: yearlyError } = await supabase
        .from('simulation_yearly_data')
        .select('*')
        .eq('run_id', simulationId)
        .order('year', { ascending: true });
      
      if (!yearlyError && yearlyData && yearlyData.length > 0) {
        console.log(`${yearlyData.length}件の年次データを取得しました`);
        return { simulationRun, yearlyData, error: null };
      } else {
        console.log('年次データの取得に失敗または空データ。診断結果データを使用します:', yearlyError);
      }
    }
    
    // 直接取得に失敗した場合、RPC関数を試す
    console.log('テーブルからの直接取得に失敗、APIを試みます');
    
    const { data, error } = await supabase.functions.invoke(`simulation-api/get-simulation?id=${simulationId}`, {
      method: 'GET'
    });
    
    if (error) {
      console.error('シミュレーション結果取得APIエラー:', error);
      console.log('フォールバック: 診断結果データから直接シミュレーションを生成します');
      
      // フォールバック: 診断結果IDを使用してデータ取得
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnosis_results')
        .select('*')
        .eq('id', simulationId)
        .single();
      
      if (diagnosisError) {
        console.error('診断結果データ取得エラー:', diagnosisError);
        return { simulationRun: null, yearlyData: [], error: diagnosisError };
      }
      
      console.log('診断結果データから直接シミュレーションを生成します:', {
        annual_income: diagnosisData.annual_income,
        savings: diagnosisData.savings
      });
      
      // 空のシミュレーション実行結果を作成
      const emptySimulationRun = {
        id: simulationId,
        diagnosis_result_id: simulationId,
        diagnosis_result: diagnosisData,
        summary: {
          annual_income: diagnosisData.annual_income,
          savings: diagnosisData.savings
        }
      };
      
      // 空の年次データを返す（フロントエンドでローカルシミュレーションが実行される）
      return { 
        simulationRun: emptySimulationRun, 
        yearlyData: [], 
        error: { message: 'APIエラー - ローカル計算にフォールバック', originalError: error } 
      };
    }
    
    // 年次データの型変換
    const yearlyData = data.yearlyData.map((item: any) => ({
      year: item.year,
      age: item.age,
      incomeTotal: item.income_total,
      expenseTotal: item.expense_total,
      cashflow: item.cashflow,
      balanceEnd: item.balance_end,
      mortgagePrincipal: item.mortgage_principal,
      mortgageInterest: item.mortgage_interest,
      educationCost: item.education_cost,
      insuranceCost: item.insurance_cost,
      investmentBalance: item.investment_balance,
      investmentYield: item.investment_yield,
      pensionIncome: item.pension_income,
      otherEvents: item.other_events
    }));
    
    console.log(`APIから${yearlyData.length}件の年次データを取得しました`);
    
    return { simulationRun: data.simulationRun, yearlyData, error: null };
  } catch (error) {
    console.error('シミュレーション結果取得API呼び出し中に例外が発生しました:', error);
    
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
          error: { message: '例外発生 - 診断結果データを使用', originalError: error }
        };
      }
    } catch (fallbackError) {
      console.error('フォールバック処理中に2次例外が発生:', fallbackError);
    }
    
    return { simulationRun: null, yearlyData: [], error };
  }
}

/**
 * シミュレーション年次データの型
 */
export interface YearlyData {
  year: number;
  age: number;
  incomeTotal: number;
  expenseTotal: number;
  cashflow: number;
  balanceEnd: number;
  mortgagePrincipal: number;
  mortgageInterest: number;
  educationCost: number;
  insuranceCost: number;
  investmentBalance: number;
  investmentYield: number;
  pensionIncome: number;
  otherEvents: Record<string, number>;
}

/**
 * データベースのシミュレーション結果からフロントエンド用のYearlyBalanceに変換
 */
export function convertToYearlyBalance(yearlyData: YearlyData[]): YearlyBalance[] {
  if (!yearlyData || yearlyData.length === 0) {
    console.warn('シミュレーションデータが空です');
    return [];
  }
  
  // シミュレーションデータのデバッグ情報
  console.log('シミュレーションデータ長:', yearlyData.length);
  console.log('シミュレーション初年度データを詳細確認:', {
    年: yearlyData[0]?.year || '不明',
    年齢: yearlyData[0]?.age || '不明',
    年収: yearlyData[0]?.incomeTotal || 0,
    貯蓄残高: yearlyData[0]?.balanceEnd || 0,
    投資残高: yearlyData[0]?.investmentBalance || 0,
    キャッシュフロー: yearlyData[0]?.cashflow || 0,
    総支出: yearlyData[0]?.expenseTotal || 0,
    全データキー: Object.keys(yearlyData[0] || {}).join(', ')
  });
  
  // 最初の5年分のデータをログ出力（詳細デバッグ用）
  const debugYears = Math.min(5, yearlyData.length);
  for (let i = 0; i < debugYears; i++) {
    const data = yearlyData[i];
    if (data) {
      console.log(`${i+1}年目(${data.age}歳)のデータ:`, {
        年収: data.incomeTotal,
        貯蓄残高: data.balanceEnd,
        キャッシュフロー: data.cashflow
      });
    }
  }
  
  return yearlyData.map(data => {
    // 防御的チェック - dataが存在することを確認
    if (!data) {
      console.warn('無効なデータ年が検出されました');
      return {
        age: 0,
        year: 0,
        income: 0,
        expenses: {
          housing: 0,
          education: 0,
          living: 0,
          insurance: 0,
          tax: 0,
          other: 0
        },
        totalExpense: 0,
        balance: 0,
        savings: 0,
        investment: {
          balance: 0,
          yield: 0,
          contribution: 0,
          withdrawals: 0
        },
        mortgage: {
          principal: 0,
          interest: 0,
          balance: 0
        }
      };
    }
    
    return {
      age: data.age || 0,
      year: data.year || 0,
      income: data.incomeTotal || 0,
      expenses: {
        housing: (data.mortgagePrincipal || 0) + (data.mortgageInterest || 0),
        education: data.educationCost || 0,
        living: data.otherEvents?.living || 0,
        insurance: data.insuranceCost || 0,
        tax: data.otherEvents?.tax || 0,
        other: data.otherEvents?.other || 0,
        ...(data.otherEvents || {})
      },
      totalExpense: data.expenseTotal || 0,
      balance: data.cashflow || 0,
      savings: data.balanceEnd || 0,  // 防御的プログラミングを追加
      investment: {
        balance: data.investmentBalance || 0,
        yield: data.investmentYield || 0,
        contribution: 0, // データベースからは取得できない
        withdrawals: 0  // データベースからは取得できない
      },
      pension: data.pensionIncome || 0,
      mortgage: {
        principal: data.mortgagePrincipal || 0,
        interest: data.mortgageInterest || 0,
        balance: 0 // データベースからは残高を取得できない
      }
    };
  });
} 