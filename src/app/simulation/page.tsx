'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Auth from '../../components/Auth'
import SimulationResults from '../../components/SimulationResults'
import { runSimulation, SimulationInput, SimulationResult } from '../../lib/simulationEngine'
import { Session } from '@supabase/supabase-js'

export default function SimulationPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [step, setStep] = useState(1)
  const [simulationCompleted, setSimulationCompleted] = useState(false)
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null)
  
  const [formData, setFormData] = useState<SimulationInput>({
    age: 35,
    monthlySalary: 350000,
    monthlyExpenses: 250000,
    currentSavings: 2000000,
    hasInvestment: false,
    expectedRetirementAge: 65,
    monthlyInvestment: 30000,
    investmentReturnRate: 0.04,
    inflationRate: 0.01,
    expectedLifespan: 90,
    hasMortgage: false,
    monthlyMortgage: 0,
    remainingMortgageYears: 0
  })

  // サインイン状態の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // ログイン状態の初期チェック
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
      setLoading(false)
    }

    checkSession()
  }, [])

  // フォームの入力処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    
    // チェックボックスの場合は checked を、それ以外は value を使用
    const newValue = type === 'checkbox' ? checked : type === 'number' ? parseFloat(value) : value
    
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }))
  }

  // 次のステップへ進む
  const nextStep = () => {
    setStep(prev => prev + 1)
  }

  // 前のステップに戻る
  const prevStep = () => {
    setStep(prev => prev - 1)
  }

  // シミュレーション実行
  const runSimulationHandler = () => {
    try {
      const result = runSimulation(formData)
      setSimulationResult(result)
      setSimulationCompleted(true)
    } catch (error) {
      console.error('Simulation error:', error)
      alert('シミュレーション実行中にエラーが発生しました。')
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">詳細シミュレーション</h1>
        
        {!session ? (
          <div className="mb-8">
            <p className="text-center mb-6">シミュレーションを始める前に、ログインまたは登録してください。</p>
            <Auth />
          </div>
        ) : (
          <>
            {!simulationCompleted ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                {/* ステップインジケーター */}
                <div className="mb-8">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3].map((i) => (
                      <div 
                        key={i}
                        className={`flex items-center justify-center w-10 h-10 rounded-full ${
                          step >= i ? 'bg-blue-600 text-white' : 'bg-gray-200'
                        }`}
                      >
                        {i}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-sm">基本情報</span>
                    <span className="text-sm">収入・支出</span>
                    <span className="text-sm">運用・設定</span>
                  </div>
                </div>
                
                {/* ステップ1：基本情報 */}
                {step === 1 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">基本情報</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          現在の年齢
                        </label>
                        <input
                          type="number"
                          name="age"
                          value={formData.age}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="18"
                          max="90"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          想定退職年齢
                        </label>
                        <input
                          type="number"
                          name="expectedRetirementAge"
                          value={formData.expectedRetirementAge}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min={formData.age}
                          max="90"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          想定寿命（シミュレーション終了年齢）
                        </label>
                        <input
                          type="number"
                          name="expectedLifespan"
                          value={formData.expectedLifespan}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min={formData.expectedRetirementAge || 65}
                          max="120"
                        />
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          onClick={nextStep}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          次へ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ステップ2：収入・支出情報 */}
                {step === 2 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">収入・支出情報</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          毎月の手取り収入（円）
                        </label>
                        <input
                          type="number"
                          name="monthlySalary"
                          value={formData.monthlySalary}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          毎月の支出（円）
                        </label>
                        <input
                          type="number"
                          name="monthlyExpenses"
                          value={formData.monthlyExpenses}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          現在の貯蓄額（円）
                        </label>
                        <input
                          type="number"
                          name="currentSavings"
                          value={formData.currentSavings}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                      </div>
                      
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="hasMortgage"
                            checked={formData.hasMortgage}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">住宅ローンがある</span>
                        </label>
                      </div>
                      
                      {formData.hasMortgage && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              毎月の住宅ローン返済額（円）
                            </label>
                            <input
                              type="number"
                              name="monthlyMortgage"
                              value={formData.monthlyMortgage}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              住宅ローン残り年数
                            </label>
                            <input
                              type="number"
                              name="remainingMortgageYears"
                              value={formData.remainingMortgageYears}
                              onChange={handleChange}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              max="35"
                            />
                          </div>
                        </>
                      )}
                      
                      <div className="flex justify-between">
                        <button
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          戻る
                        </button>
                        <button
                          onClick={nextStep}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          次へ
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* ステップ3：運用設定 */}
                {step === 3 && (
                  <div>
                    <h2 className="text-xl font-semibold mb-4">運用設定</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            name="hasInvestment"
                            checked={formData.hasInvestment}
                            onChange={handleChange}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <span className="ml-2 text-sm text-gray-700">現在、投資・資産運用を行っている</span>
                        </label>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          毎月の投資額（円）
                        </label>
                        <input
                          type="number"
                          name="monthlyInvestment"
                          value={formData.monthlyInvestment}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          シミュレーションで「投資シナリオ」を計算する際の月額投資金額です
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          想定運用利回り（年率・小数点）
                        </label>
                        <input
                          type="number"
                          name="investmentReturnRate"
                          value={formData.investmentReturnRate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="0.2"
                          step="0.01"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          例: 4%の場合は0.04と入力
                        </p>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          想定インフレ率（年率・小数点）
                        </label>
                        <input
                          type="number"
                          name="inflationRate"
                          value={formData.inflationRate}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min="0"
                          max="0.1"
                          step="0.01"
                        />
                        <p className="text-sm text-gray-500 mt-1">
                          例: 1%の場合は0.01と入力
                        </p>
                      </div>
                      
                      <div className="flex justify-between">
                        <button
                          onClick={prevStep}
                          className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                        >
                          戻る
                        </button>
                        <button
                          onClick={runSimulationHandler}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                        >
                          シミュレーション実行
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <SimulationResults 
                simulationResult={simulationResult!}
                userId={session.user.id}
                userInfo={formData}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
} 