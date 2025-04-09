'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import Auth from '../../components/Auth'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'

export default function ConsultationPage() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [formSubmitted, setFormSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredDate1: '',
    preferredDate2: '',
    preferredDate3: '',
    preferredTime: '午前',
    consultationType: '対面',
    message: ''
  })

  // ユーザープロファイル情報を取得
  const getUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', userId)
        .single()

      if (error) {
        console.error('Error fetching user profile:', error)
        return
      }

      if (data) {
        setFormData(prev => ({
          ...prev,
          name: data.name || '',
          email: data.email || session?.user?.email || '',
          phone: data.phone || ''
        }))
      } else {
        // プロフィールが存在しない場合、メールアドレスだけ設定
        setFormData(prev => ({
          ...prev,
          email: session?.user?.email || ''
        }))
      }
    } catch (error) {
      console.error('Error:', error)
    }
  }

  // サインイン状態の監視
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
        setLoading(false)
        if (session?.user) {
          // ユーザー情報を取得して名前とメールアドレスを設定
          getUserProfile(session.user.id)
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
        getUserProfile(session.user.id)
      }
    }

    checkSession()
  }, [])

  // フォームの入力処理
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // 相談予約をデータベースに保存
      const { error } = await supabase.from('consultation_requests').insert({
        user_id: session?.user?.id,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        preferred_date_1: formData.preferredDate1,
        preferred_date_2: formData.preferredDate2,
        preferred_date_3: formData.preferredDate3,
        preferred_time: formData.preferredTime,
        consultation_type: formData.consultationType,
        message: formData.message,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      if (error) throw error
      
      setFormSubmitted(true)
    } catch (error) {
      console.error('Error submitting consultation request:', error)
      alert('予約の送信中にエラーが発生しました。もう一度お試しください。')
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
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-8 text-center">FP相談予約</h1>
        
        {!session ? (
          <div className="mb-8">
            <p className="text-center mb-6">相談予約を行うには、ログインまたは登録してください。</p>
            <Auth />
          </div>
        ) : (
          <>
            {!formSubmitted ? (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-6">相談のご予約</h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        電話番号
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        相談方法 <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="consultationType"
                        value={formData.consultationType}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="対面">対面相談</option>
                        <option value="オンライン">オンライン相談（Zoom）</option>
                        <option value="電話">電話相談</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-md font-medium mb-2">ご希望の日時</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          第1希望日 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          name="preferredDate1"
                          value={formData.preferredDate1}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          required
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          第2希望日
                        </label>
                        <input
                          type="date"
                          name="preferredDate2"
                          value={formData.preferredDate2}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          第3希望日
                        </label>
                        <input
                          type="date"
                          name="preferredDate3"
                          value={formData.preferredDate3}
                          onChange={handleChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ご希望の時間帯 <span className="text-red-500">*</span>
                      </label>
                      <select
                        name="preferredTime"
                        value={formData.preferredTime}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      >
                        <option value="午前">午前（9:00-12:00）</option>
                        <option value="午後早め">午後早め（13:00-15:00）</option>
                        <option value="午後遅め">午後遅め（15:00-17:00）</option>
                        <option value="夕方以降">夕方以降（17:00-19:00）</option>
                      </select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      ご相談内容・ご質問など
                    </label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      placeholder="ご相談したい内容や、事前に伝えておきたいことがあればご記入ください。"
                    ></textarea>
                  </div>
                  
                  <div className="text-center">
                    <button
                      type="submit"
                      className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      予約を確定する
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="bg-white p-8 rounded-lg shadow-md text-center">
                <div className="mb-6 flex justify-center">
                  <svg className="w-16 h-16 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-bold mb-4">予約を受け付けました</h2>
                <p className="mb-6">
                  ご予約ありがとうございます。確認のメールをお送りしましたので、ご確認ください。
                  担当者より改めてご連絡いたします。
                </p>
                <div className="mt-8">
                  <Link
                    href="/"
                    className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    トップページに戻る
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
        
        <div className="mt-12 bg-blue-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">FP相談について</h2>
          <div className="space-y-4">
            <p>
              当社のFP（ファイナンシャルプランナー）による無料相談では、
              お客様の現在の家計状況や将来の目標に合わせた具体的なアドバイスを提供します。
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded">
                <h3 className="font-medium mb-2">相談内容の例</h3>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  <li>家計の見直しと改善策</li>
                  <li>貯蓄・投資の最適な方法</li>
                  <li>教育資金の準備</li>
                  <li>住宅ローンの選び方</li>
                  <li>老後の資金計画</li>
                  <li>保険の選び方と見直し</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded">
                <h3 className="font-medium mb-2">相談の流れ</h3>
                <ol className="list-decimal pl-5 space-y-1 text-sm">
                  <li>Web予約（当ページ）</li>
                  <li>予約確認のご連絡</li>
                  <li>事前ヒアリング</li>
                  <li>FP相談（約60分）</li>
                  <li>アドバイスシートの送付</li>
                  <li>フォローアップ</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 