'use client';

import React, { useEffect, useState } from 'react';
import { generateLifetimeSimulation, getPeakSavings, runSimulationFromDiagnosisResult, getSimulationResult, YearlyBalance } from '@/lib/simulationCalculator';
import { convertToYearlyBalance, YearlyData } from '@/lib/simulationService';
import ResultsPanel from './ResultsPanel';
import { supabase } from '@/lib/supabase';

interface SimulationPanelProps {
  formData: any;
  maxBudget: number;
  diagnosisResultId?: string;
}

const SimulationPanel: React.FC<SimulationPanelProps> = ({ formData, maxBudget, diagnosisResultId }) => {
  const [simulationData, setSimulationData] = useState<YearlyBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  console.log('SimulationPanel初期化 - 診断結果ID:', diagnosisResultId);
  
  useEffect(() => {
    const loadSimulation = async () => {
      setLoading(true);
      setError(null);
      console.log('シミュレーションパネルマウント - 診断結果ID:', diagnosisResultId);
      
      // 診断結果IDがない場合はローカルシミュレーションを実行
      if (!diagnosisResultId) {
        console.log('診断結果IDなし、ローカルシミュレーションを実行します');
        const simulationData = generateLifetimeSimulation({
          age: formData.age || 30,
          annualIncome: formData.annualIncome || 5000000,
          savings: formData.savings || 5000000,
          hasSpouse: formData.hasSpouse || 'いいえ',
          spouseIncome: formData.spouseIncome || 0,
          retirementAge: formData.retirementAge || '65歳',
          childrenCount: formData.childrenCount || '0人',
          childrenAges: formData.childrenAges || ''
        });
        setSimulationData(simulationData);
        setLoading(false);
        return;
      }
      
      try {
        const { simulationId, error } = await runSimulationFromDiagnosisResult(diagnosisResultId);
        
        if (error) {
          console.error('シミュレーション実行エラー:', error);
          
          // エラーメッセージが詳細な場合の分岐
          if (error.message && typeof error.message === 'string') {
            // フォールバックメッセージを含む場合またはタイプがfallback_usedの場合はエラー表示しない
            if (error.message.includes('フォールバック') || error.type === 'fallback_used') {
              console.log('フォールバックモードに移行します - エラーメッセージは表示しません');
            } else {
              // 通常のエラー
              setError('シミュレーションの実行中にエラーが発生しました');
            }
          } else {
            // 不明なエラー形式
            setError('シミュレーションの実行中に不明なエラーが発生しました');
          }
          
          // 診断結果データを直接取得してフォールバック
          console.log('診断結果データを直接取得します:', diagnosisResultId);
          const { data: diagnosisData, error: fetchError } = await supabase
            .from('diagnosis_results')
            .select('*')
            .eq('id', diagnosisResultId)
            .single();
          
          if (fetchError) {
            console.error('診断結果取得エラー:', fetchError);
            // 最終フォールバック: フォームデータを使用
            console.log('最終フォールバック: フォームデータを使用します');
            const fallbackData = generateLifetimeSimulation({
              age: formData.age || 30,
              annualIncome: formData.annualIncome || 5000000,
              savings: formData.savings || 5000000,
              hasSpouse: formData.hasSpouse || 'いいえ',
              spouseIncome: formData.spouseIncome || 0,
              retirementAge: formData.retirementAge || '65歳',
              childrenCount: formData.childrenCount || '0人',
              childrenAges: formData.childrenAges || ''
            });
            setSimulationData(fallbackData);
            setLoading(false);
            return;
          }
          
          // 診断結果データからシミュレーションデータを生成
          console.log('診断結果データからシミュレーション生成:', {
            age: diagnosisData.age || formData.age || 30,
            annual_income: diagnosisData.annual_income,
            savings: diagnosisData.savings,
            // デバッグ用に追加のデータを表示
            additional_data: diagnosisData.additional_data ? true : false,
            chatbot_data: diagnosisData.additional_data?.chatbot_data ? true : false
          });
          
          // 診断結果データからチャットボットデータを抽出（存在する場合）
          let chatbotData: Record<string, any> = {};
          try {
            // additional_dataが存在するか確認
            if (diagnosisData.additional_data) {
              // 文字列の場合はJSON変換
              if (typeof diagnosisData.additional_data === 'string') {
                const parsed = JSON.parse(diagnosisData.additional_data);
                chatbotData = parsed.chatbot_data || {};
              } else {
                // オブジェクトの場合は直接取得
                chatbotData = diagnosisData.additional_data.chatbot_data || {};
              }
            }
            // legacy: chatbot_dataフィールドの確認（直接存在する場合）
            else if (diagnosisData.chatbot_data) {
              chatbotData = typeof diagnosisData.chatbot_data === 'string'
                ? JSON.parse(diagnosisData.chatbot_data)
                : diagnosisData.chatbot_data;
            }
            console.log('抽出されたチャットボットデータ:', chatbotData);
          } catch (parseError) {
            console.error('チャットボットデータの解析に失敗:', parseError);
            // 解析に失敗した場合は空オブジェクトを使用
            chatbotData = {};
          }
          
          // チャットボットから収集した追加データを使用してシミュレーションを生成
          const diagnosisSimulation = generateLifetimeSimulation({
            age: diagnosisData.age || formData.age || 30,
            annualIncome: diagnosisData.annual_income || chatbotData.annualIncome || formData.annualIncome || 5000000,
            savings: diagnosisData.savings || chatbotData.savings || formData.savings || 5000000,
            hasSpouse: chatbotData.hasSpouse || formData.hasSpouse || 'いいえ',
            spouseIncome: chatbotData.spouseIncome || formData.spouseIncome || 0,
            retirementAge: chatbotData.retirementAge || formData.retirementAge || '65歳',
            childrenCount: chatbotData.childrenCount || formData.childrenCount || '0人',
            childrenAges: chatbotData.childrenAges || formData.childrenAges || ''
          });
          
          console.log('診断結果データから生成したシミュレーション - データ長:', diagnosisSimulation.length);
          setSimulationData(diagnosisSimulation);
          setLoading(false);
          return;
        }
        
        if (!simulationId) {
          console.error('シミュレーションIDが返されませんでした');
          setError('シミュレーションの実行中にエラーが発生しました');
          
          // フォールバックシミュレーションを実行
          console.log('フォールバック: ローカルシミュレーションを実行します');
          const fallbackData = generateLifetimeSimulation({
            age: formData.age || 30,
            annualIncome: formData.annualIncome || 5000000,
            savings: formData.savings || 5000000,
            hasSpouse: formData.hasSpouse || 'いいえ',
            spouseIncome: formData.spouseIncome || 0,
            retirementAge: formData.retirementAge || '65歳',
            childrenCount: formData.childrenCount || '0人',
            childrenAges: formData.childrenAges || ''
          });
          
          console.log('フォールバックシミュレーション完了 - データ長:', fallbackData.length);
          setSimulationData(fallbackData);
          return;
        }
        
        console.log(`シミュレーションID: ${simulationId} から結果を取得します`);
        
        // シミュレーション結果を取得
        const { simulationRun, yearlyData, error: fetchError } = await getSimulationResult(simulationId);
        
        if (fetchError) {
          console.error('シミュレーション結果取得エラー:', fetchError);
          setError('シミュレーション結果の取得中にエラーが発生しました');
          
          // フォールバックシミュレーションを実行
          console.log('フォールバック: ローカルシミュレーションを実行します');
          const fallbackData = generateLifetimeSimulation({
            age: formData.age || 30,
            annualIncome: formData.annualIncome || 5000000,
            savings: formData.savings || 5000000,
            hasSpouse: formData.hasSpouse || 'いいえ',
            spouseIncome: formData.spouseIncome || 0,
            retirementAge: formData.retirementAge || '65歳',
            childrenCount: formData.childrenCount || '0人',
            childrenAges: formData.childrenAges || ''
          });
          
          console.log('フォールバックシミュレーション完了 - データ長:', fallbackData.length);
          setSimulationData(fallbackData);
          return;
        }
        
        console.log('シミュレーション結果取得成功:', {
          yearlyDataCount: yearlyData?.length || 0,
          simulationRun: simulationRun ? true : false
        });
        
        // 年次データがある場合は変換して設定
        if (yearlyData && yearlyData.length > 0) {
          console.log('年次データを変換して設定します');
          const formattedData = convertToYearlyBalance(yearlyData);
          console.log('変換後のデータ長:', formattedData.length);
          setSimulationData(formattedData);
        } else {
          console.log('年次データがないため、ローカルシミュレーションを実行します');
          // シミュレーション実行のための入力データを作成
          const simulationInput = {
            age: formData.age || (simulationRun?.diagnosis_result?.age || 30),
            annualIncome: formData.annualIncome || (simulationRun?.diagnosis_result?.annual_income || 5000000),
            savings: formData.savings || (simulationRun?.diagnosis_result?.savings || 5000000),
            hasSpouse: formData.hasSpouse || 'いいえ',
            spouseIncome: formData.spouseIncome || 0,
            retirementAge: formData.retirementAge || '65歳',
            childrenCount: formData.childrenCount || '0人',
            childrenAges: formData.childrenAges || ''
          };
          
          console.log('ローカルシミュレーション入力:', simulationInput);
          const localSimulationData = generateLifetimeSimulation(simulationInput);
          console.log('ローカルシミュレーション完了 - データ長:', localSimulationData.length);
          setSimulationData(localSimulationData);
        }
      } catch (error) {
        console.error('シミュレーション処理中に例外が発生しました:', error);
        setError('シミュレーション中に予期せぬエラーが発生しました');
        
        // 例外時のフォールバックシミュレーション
        const exceptionFallbackData = generateLifetimeSimulation({
          age: formData.age || 30,
          annualIncome: formData.annualIncome || 5000000,
          savings: formData.savings || 5000000,
          hasSpouse: formData.hasSpouse || 'いいえ',
          spouseIncome: formData.spouseIncome || 0,
          retirementAge: formData.retirementAge || '65歳',
          childrenCount: formData.childrenCount || '0人',
          childrenAges: formData.childrenAges || ''
        });
        
        setSimulationData(exceptionFallbackData);
      } finally {
        setLoading(false);
      }
    };

    loadSimulation();
  }, [formData, diagnosisResultId]);
  
  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <p className="text-center">シミュレーション計算中...</p>
        <div className="mt-4 flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="p-4 bg-white rounded-lg shadow text-red-500">
        <p className="text-center">{error}</p>
        <p className="text-center text-sm mt-2">基本的な情報から簡易的なシミュレーションを行います。</p>
      </div>
    );
  }
  
  return (
    <div className="mt-8">
      <ResultsPanel simulationData={simulationData} maxBudget={maxBudget} />
    </div>
  );
};

export default SimulationPanel;