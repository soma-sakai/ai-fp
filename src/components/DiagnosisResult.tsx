'use client'

import { useState } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import { supabase } from '../lib/supabase'

// Chart.jsの設定
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

// 診断結果の型定義
type DiagnosisResultProps = {
  userId: string
  monthlySalary: number
  monthlyExpenses: number
  savings: number
  hasInvestment: boolean
}

// リスクレベルの型
type RiskLevel = '安全' | '注意' | '危険'

export default function DiagnosisResult({
  userId,
  monthlySalary,
  monthlyExpenses,
  savings,
  hasInvestment
}: DiagnosisResultProps) {
  const [showDetailSimulation, setShowDetailSimulation] = useState(false)

  // 月の収支バランス
  const monthlyBalance = monthlySalary - monthlyExpenses

  // 貯蓄余裕度（貯蓄が何ヶ月分の支出をカバーできるか）
  const savingsMonths = Math.floor(savings / monthlyExpenses)

  // リスクレベルを判定
  const calculateRiskLevel = (): RiskLevel => {
    if (monthlyBalance > 0 && savingsMonths > 6) {
      return '安全'
    } else if (monthlyBalance > 0 || savingsMonths > 3) {
      return '注意'
    } else {
      return '危険'
    }
  }

  const riskLevel = calculateRiskLevel()
  
  // リスクレベルに応じた色
  const getRiskColor = (): string => {
    switch (riskLevel) {
      case '安全': return 'bg-green-100 text-green-800 border-green-200'
      case '注意': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case '危険': return 'bg-red-100 text-red-800 border-red-200'
    }
  }

  // グラフデータ
  const barData = {
    labels: ['収入', '支出', '貯蓄（月数）'],
    datasets: [
      {
        label: '金額（万円）',
        data: [monthlySalary / 10000, monthlyExpenses / 10000, savingsMonths],
        backgroundColor: [
          'rgba(54, 162, 235, 0.6)',
          'rgba(255, 99, 132, 0.6)',
          'rgba(75, 192, 192, 0.6)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
        ],
        borderWidth: 1,
      },
    ],
  }

  // 診断結果をSupabaseに保存
  const saveResultToDatabase = async () => {
    try {
      await supabase.from('diagnosis_results').insert({
        user_id: userId,
        monthly_salary: monthlySalary,
        monthly_expenses: monthlyExpenses,
        savings: savings,
        has_investment: hasInvestment,
        risk_level: riskLevel,
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.warn('診断結果の保存に失敗しました:', error)
      // エラーが発生しても処理を続行
    }
  }

  // コンポーネントマウント時に結果を保存
  useState(() => {
    saveResultToDatabase()
  })

  // シミュレーション詳細を表示
  const handleShowDetailSimulation = () => {
    setShowDetailSimulation(true)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">あなたの安心予算診断結果</h2>
      
      {/* リスクレベル表示 */}
      <div className={`mb-6 p-4 rounded-lg border ${getRiskColor()}`}>
        <h3 className="text-xl font-semibold mb-2">診断結果: {riskLevel}</h3>
        <p>
          {riskLevel === '安全' && '現在の家計状況は良好です。今後の資産形成に向けた計画を検討しましょう。'}
          {riskLevel === '注意' && '収支バランスまたは貯蓄に改善の余地があります。支出の見直しと計画的な貯蓄を検討しましょう。'}
          {riskLevel === '危険' && '収支バランスと貯蓄状況に問題があります。早急な家計の見直しをおすすめします。'}
        </p>
      </div>
      
      {/* グラフ表示 */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">収支・貯蓄状況</h3>
        <div className="h-64">
          <Bar
            data={barData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
            }}
          />
        </div>
      </div>
      
      {/* 基本情報表示 */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">月の収支バランス</h4>
          <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {monthlyBalance.toLocaleString()}円
          </p>
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">貯蓄による生活維持可能期間</h4>
          <p className="text-xl font-bold">約{savingsMonths}ヶ月</p>
        </div>
      </div>
      
      {/* アドバイス表示 */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-lg font-semibold mb-2">あなたへのアドバイス</h3>
        <ul className="list-disc pl-5 space-y-2">
          {monthlyBalance < 0 && (
            <li>毎月の支出が収入を上回っています。支出の見直しを検討しましょう。</li>
          )}
          {savingsMonths < 6 && (
            <li>緊急時に備えて、最低でも6ヶ月分の生活費に相当する貯蓄の確保を目指しましょう。</li>
          )}
          {!hasInvestment && (
            <li>将来に向けた資産形成のため、投資や資産運用の検討をおすすめします。</li>
          )}
        </ul>
      </div>
      
      {/* 詳細シミュレーションボタン */}
      {!showDetailSimulation ? (
        <div className="text-center">
          <button
            onClick={handleShowDetailSimulation}
            className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            詳細シミュレーションを見る
          </button>
        </div>
      ) : (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">将来シミュレーション</h3>
          <p className="mb-4">
            このシミュレーションでは、現在の収支状況が続いた場合の将来の資産推移を予測しています。
            より正確なシミュレーションやライフプランに合わせた詳細な分析については、FP相談をご利用ください。
          </p>
          
          {/* ここに詳細なシミュレーション結果やグラフを表示するコンポーネントを追加 */}
          <div className="mt-4 text-center">
            <button
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              FP相談を予約する
            </button>
          </div>
        </div>
      )}
    </div>
  )
} 