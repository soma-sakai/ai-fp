'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Auth from '../../components/Auth'
import ChatBot from '../../components/ChatBot'
import DiagnosisResult from '../../components/DiagnosisResult'
import { Session } from '@supabase/supabase-js'

export default function DiagnosisPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosisCompleted, setDiagnosisCompleted] = useState(false)
  
  // 診断結果のサンプルデータ（実際にはチャットボットの会話から生成）
  const [diagnosisData, setDiagnosisData] = useState({
    userId: '',
    monthlySalary: 350000,
    monthlyExpenses: 250000,
    savings: 2000000,
    hasInvestment: false
  })

  // サインイン状態の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
        if (session?.user) {
          setDiagnosisData(prev => ({
            ...prev,
            userId: session.user.id
          }))
        }
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
      if (session?.user) {
        setDiagnosisData(prev => ({
          ...prev,
          userId: session.user.id
        }))
      }
    }

    checkSession()
  }, [])

  // チャットボットからの診断完了通知（実際のアプリでは実装が必要）
  interface DiagnosisResults {
    monthlySalary?: number;
    monthlyExpenses?: number;
    savings?: number;
    hasInvestment?: boolean;
  }

  const handleDiagnosisComplete = (results: DiagnosisResults) => {
    setDiagnosisData({
      userId: session?.user?.id || '',
      monthlySalary: results.monthlySalary || diagnosisData.monthlySalary,
      monthlyExpenses: results.monthlyExpenses || diagnosisData.monthlyExpenses,
      savings: results.savings || diagnosisData.savings,
      hasInvestment: results.hasInvestment || diagnosisData.hasInvestment
    })
    setDiagnosisCompleted(true)
  }

  // テスト用の診断完了ボタン（開発用）
  const completeDiagnosis = () => {
    handleDiagnosisComplete({
      monthlySalary: 350000,
      monthlyExpenses: 250000,
      savings: 2000000,
      hasInvestment: false
    })
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
        <h1 className="text-3xl font-bold mb-8 text-center">安心予算AI診断</h1>
        
        {!session ? (
          <div className="mb-8">
            <p className="text-center mb-6">診断を始める前に、ログインまたは登録してください。</p>
            <Auth />
          </div>
        ) : (
          <>
            {!diagnosisCompleted ? (
              <div className="mb-8">
                <p className="text-center mb-6">チャットボットとの対話を通して、あなたの家計状況を診断します。</p>
                <ChatBot userId={session.user.id} />
                
                {/* 開発用：診断完了ボタン */}
                <div className="text-center mt-4">
                  <button 
                    onClick={completeDiagnosis}
                    className="px-4 py-2 bg-gray-200 rounded"
                  >
                    診断完了（開発用）
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <DiagnosisResult 
                  userId={diagnosisData.userId}
                  monthlySalary={diagnosisData.monthlySalary}
                  monthlyExpenses={diagnosisData.monthlyExpenses}
                  savings={diagnosisData.savings}
                  hasInvestment={diagnosisData.hasInvestment}
                />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
} 