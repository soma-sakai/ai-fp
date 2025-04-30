'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Auth from '../../components/Auth'
import HousingBudgetChatbot from '../../components/HousingBudgetChatbot'
import HousingBudgetResults from '../../components/HousingBudgetResults'
import { Session } from '@supabase/supabase-js'

export default function HousingBudgetPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [diagnosisCompleted, setDiagnosisCompleted] = useState(false)
  const [budgetResults, setBudgetResults] = useState<any>(null)
  
  // サインイン状態の監視
  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // 診断完了時の処理
  const handleDiagnosisComplete = (results: any) => {
    setBudgetResults(results)
    setDiagnosisCompleted(true)
    
    // 診断結果をデータベースに保存（既にコンポーネント内で保存済みの場合は不要）
    // logDiagnosisResults(results)
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-xl">読み込み中...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">安心住宅予算AI診断＆シミュレーション</h1>
        <p className="text-center mb-8 text-gray-600">
          詳しく分析して、あなたに最適な住宅予算を3つのラインで提案します。<br />
          家計シミュレーションで5年間の貯蓄推移と老後資金も確認できます。
        </p>
        
        {!session ? (
          <div className="mb-8">
            <p className="text-center mb-6">診断を始める前に、ログインまたは登録してください。</p>
            <Auth />
          </div>
        ) : (
          <>
            {!diagnosisCompleted ? (
              <div className="mb-8">
                <HousingBudgetChatbot 
                  userId={session.user.id}
                  onComplete={handleDiagnosisComplete}
                />
              </div>
            ) : (
              <HousingBudgetResults results={budgetResults} />
            )}
          </>
        )}
      </div>
    </div>
  )
} 