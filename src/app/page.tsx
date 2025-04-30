'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Session } from '@supabase/supabase-js'

export default function HomePage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  
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
  
  return (
    <div className="min-h-screen">
      {/* ヒーローセクション */}
      <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white py-20 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl font-bold mb-6">安心住宅予算AI診断</h1>
          <p className="text-xl mb-8">
            あなたの家計情報からベストな住宅予算を診断。<br />
            将来の家計まで見据えた安心の住宅購入をサポートします。
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link
              href="/housing-budget"
              className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
            >
              住宅予算診断を始める
            </Link>
            <Link
              href="/consultation"
              className="bg-transparent border-2 border-white text-white px-6 py-3 rounded-lg font-semibold hover:bg-white/10 transition"
            >
              FP相談予約はこちら
            </Link>
          </div>
        </div>
      </div>
      
      {/* 特徴セクション */}
      <div className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">安心の住宅予算を3つのラインでご提案</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-red-50 p-6 rounded-lg border-l-4 border-red-500">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">MAXライン</h3>
              <p className="text-gray-600">
                これ以上の予算は家計を圧迫するリスクが高まるラインです。返済負担率は年収の30%を目安に設定しています。
              </p>
            </div>
            
            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-yellow-500">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">妥当ライン</h3>
              <p className="text-gray-600">
                バランスの取れた予算で家計にも余裕があるラインです。返済負担率は年収の25%を目安に設定しています。
              </p>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-green-500">
              <h3 className="text-xl font-semibold mb-3 text-gray-800">安全ライン</h3>
              <p className="text-gray-600">
                将来の変化にも対応できる余裕のある予算ラインです。返済負担率は年収の20%を目安に設定しています。
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* 機能セクション */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">便利な機能</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mx-auto max-w-4xl">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">住宅予算診断＆シミュレーション</h3>
              <p className="text-gray-600 text-center">
                チャット形式で簡単に回答するだけで、あなたに最適な住宅予算の目安を3つのラインで提案。将来の収支や貯蓄残高の推移シミュレーションも同時に確認できます。
              </p>
              <div className="mt-4 text-center">
                <Link
                  href="/housing-budget"
                  className="text-indigo-600 font-medium hover:text-indigo-800"
                >
                  診断を始める →
                </Link>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="bg-indigo-100 rounded-full w-16 h-16 flex items-center justify-center mb-4 mx-auto">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold mb-3 text-center text-gray-800">FP相談</h3>
              <p className="text-gray-600 text-center">
                より詳しいアドバイスが必要な方には、専門FPによる個別相談サービスもご用意しています。
              </p>
              <div className="mt-4 text-center">
                <Link
                  href="/consultation"
                  className="text-indigo-600 font-medium hover:text-indigo-800"
                >
                  予約する →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* CTAセクション */}
      <div className="py-16 px-4 bg-indigo-50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">住宅予算の不安を解消しませんか？</h2>
          <p className="text-lg mb-8 text-gray-600">
            無料の住宅予算診断で、あなたに最適な予算ラインを見つけましょう。
            詳細な家計分析に基づいた安心の住宅予算が、理想のマイホーム実現への第一歩です。
          </p>
          <Link
            href="/housing-budget"
            className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            今すぐ無料診断を始める
          </Link>
        </div>
      </div>
    </div>
  )
}
