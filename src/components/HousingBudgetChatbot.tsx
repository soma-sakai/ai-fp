'use client'

import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type MessageType = {
  id: number;
  sender: 'bot' | 'user';
  text: string;
  options?: { value: string; label: string }[];
  inputType?: 'text' | 'number' | 'select' | 'date' | 'radio' | 'checkbox';
  inputName?: string;
  placeholder?: string;
  minValue?: number;
  maxValue?: number;
  required?: boolean;
}

type ChatHistoryType = {
  [key: string]: string | number | boolean | undefined;
}

export default function HousingBudgetChatbot({ 
  userId, 
  onComplete 
}: { 
  userId: string;
  onComplete: (results: any) => void;
}) {
  const [messages, setMessages] = useState<MessageType[]>([])
  const [currentInput, setCurrentInput] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [chatHistory, setChatHistory] = useState<ChatHistoryType>({})
  const [waitingForAnswer, setWaitingForAnswer] = useState(false)
  const [processingInput, setProcessingInput] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 最初のメッセージを表示
  useEffect(() => {
    const initialMessage: MessageType = {
      id: 1,
      sender: 'bot',
      text: 'こんにちは！安心住宅予算診断AIアシスタントです。いくつか質問に答えていただくことで、あなたの理想的な住宅予算を算出します。まずは基本情報からお聞きしていきますね。',
    }
    
    const firstQuestion: MessageType = {
      id: 2,
      sender: 'bot',
      text: 'あなたの年齢を教えてください。',
      inputType: 'number',
      inputName: 'userAge',
      placeholder: '例: 35',
      minValue: 18,
      maxValue: 100,
      required: true
    }
    
    setTimeout(() => {
      setMessages([initialMessage])
      setTimeout(() => {
        setMessages([initialMessage, firstQuestion])
        setWaitingForAnswer(true)
      }, 1000)
    }, 500)
  }, [])
  
  // メッセージが更新されたら自動スクロール
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // チャットの進行を管理
  const handleChatProgress = () => {
    setProcessingInput(true)
    
    // ユーザーの回答をチャット履歴に保存
    const currentQuestion = messages.find(m => m.id === currentStep + 1)
    if (currentQuestion && currentQuestion.inputName) {
      let value: string | number = currentInput
      
      // 数値型の場合は変換
      if (currentQuestion.inputType === 'number') {
        value = Number(currentInput)
      }
      
      setChatHistory(prev => ({
        ...prev,
        [currentQuestion.inputName as string]: value
      }))
    }
    
    // ユーザーの回答をメッセージリストに追加
    const userMessage: MessageType = {
      id: messages.length + 1,
      sender: 'user',
      text: currentInput
    }
    
    setMessages(prev => [...prev, userMessage])
    setCurrentInput('')
    setWaitingForAnswer(false)
    
    // 次の質問を選択
    setTimeout(() => {
      const nextQuestion = getNextQuestion(currentStep, currentInput, chatHistory)
      if (nextQuestion) {
        setMessages(prev => [...prev, nextQuestion])
        setCurrentStep(currentStep + 1)
        setWaitingForAnswer(true)
      } else {
        // 診断完了
        const resultsMessage: MessageType = {
          id: messages.length + 2,
          sender: 'bot',
          text: '診断結果を計算しています...'
        }
        setMessages(prev => [...prev, resultsMessage])
        
        // 結果計算（実際の計算ロジックは別途実装）
        setTimeout(() => {
          calculateResults(chatHistory)
        }, 1500)
      }
      setProcessingInput(false)
    }, 800)
  }
  
  // 次の質問を取得
  const getNextQuestion = (
    step: number, 
    lastAnswer: string, 
    history: ChatHistoryType
  ): MessageType | null => {
    const questionSequence: MessageType[] = [
      // 基本情報
      {
        id: 3,
        sender: 'bot',
        text: '配偶者はいらっしゃいますか？',
        inputType: 'radio',
        inputName: 'hasSpouse',
        options: [
          { value: 'yes', label: 'はい' },
          { value: 'no', label: 'いいえ' }
        ],
        required: true
      },
      {
        id: 4,
        sender: 'bot',
        text: '配偶者の年齢を教えてください。',
        inputType: 'number',
        inputName: 'spouseAge',
        placeholder: '例: 33',
        minValue: 18,
        maxValue: 100,
        required: true
      },
      {
        id: 5,
        sender: 'bot',
        text: 'お子さんは何人いらっしゃいますか？',
        inputType: 'number',
        inputName: 'childrenCount',
        placeholder: '0〜10の数字',
        minValue: 0,
        maxValue: 10,
        required: true
      },
      {
        id: 6,
        sender: 'bot',
        text: '今後、お子さんが増える予定はありますか？',
        inputType: 'radio',
        inputName: 'planToHaveMoreChildren',
        options: [
          { value: 'yes', label: 'はい' },
          { value: 'no', label: 'いいえ' }
        ],
        required: true
      },
      // 収入・資産情報
      {
        id: 7,
        sender: 'bot',
        text: 'あなたの年収（税込）を教えてください。ボーナスがある場合は含めた金額で。',
        inputType: 'number',
        inputName: 'userIncome',
        placeholder: '例: 500万円の場合は 5000000',
        minValue: 0,
        required: true
      },
      {
        id: 8,
        sender: 'bot',
        text: '配偶者の年収（税込）を教えてください。働いていない場合は0と入力してください。',
        inputType: 'number',
        inputName: 'spouseIncome',
        placeholder: '例: 300万円の場合は 3000000',
        minValue: 0,
        required: true
      },
      {
        id: 9,
        sender: 'bot',
        text: '現在の貯蓄額（預金・現金・投資など含む）の合計を教えてください。',
        inputType: 'number',
        inputName: 'savings',
        placeholder: '例: 1000万円の場合は 10000000',
        minValue: 0,
        required: true
      },
      {
        id: 10,
        sender: 'bot',
        text: '退職金の見込みはありますか？',
        inputType: 'radio',
        inputName: 'hasRetirementBonus',
        options: [
          { value: 'yes', label: 'はい' },
          { value: 'no', label: 'いいえ' },
          { value: 'unknown', label: 'わからない' }
        ],
        required: true
      },
      // 支出（生活費）
      {
        id: 11,
        sender: 'bot',
        text: '現在の家賃（月額）を教えてください。持ち家の場合は0と入力してください。',
        inputType: 'number',
        inputName: 'currentRent',
        placeholder: '例: 10万円の場合は 100000',
        minValue: 0,
        required: true
      },
      {
        id: 12,
        sender: 'bot',
        text: '毎月の生活費（食費・光熱費・通信費など、家賃・保険・教育費は除く）を教えてください。',
        inputType: 'number',
        inputName: 'monthlyLivingExpenses',
        placeholder: '例: 20万円の場合は 200000',
        minValue: 0,
        required: true
      },
      {
        id: 13,
        sender: 'bot',
        text: '毎月の保険料（生命保険・医療保険など）の合計を教えてください。',
        inputType: 'number',
        inputName: 'monthlyInsurance',
        placeholder: '例: 3万円の場合は 30000',
        minValue: 0,
        required: true
      },
      {
        id: 14,
        sender: 'bot',
        text: '子どもの教育方針について教えてください。',
        inputType: 'select',
        inputName: 'educationPlan',
        options: [
          { value: 'public', label: '公立中心（大学も国公立志向）' },
          { value: 'mixed', label: '公立+私立ミックス（一部私立も検討）' },
          { value: 'private', label: '私立中心（中学から私立を検討）' }
        ],
        required: true
      },
      {
        id: 15,
        sender: 'bot',
        text: '毎月の趣味・娯楽費（旅行積立なども含む）はいくらくらいですか？',
        inputType: 'number',
        inputName: 'monthlyHobbyExpenses',
        placeholder: '例: 3万円の場合は 30000',
        minValue: 0,
        required: true
      },
      // その他・目標設定
      {
        id: 16,
        sender: 'bot',
        text: '何歳で退職予定ですか？未定の場合は一般的な65歳としてお考えください。',
        inputType: 'number',
        inputName: 'retirementAge',
        placeholder: '例: 65',
        minValue: 50,
        maxValue: 90,
        required: true
      },
      {
        id: 17,
        sender: 'bot',
        text: '持ち家を所有していて、住み替えの予定がある場合、現在の物件の評価額から残債を引いた手残り額はいくらくらいになる見込みですか？（住み替え予定がない方や賃貸の方は0と入力してください）',
        inputType: 'number',
        inputName: 'existingPropertyValue',
        placeholder: '例: 2000万円の場合は 20000000',
        minValue: 0,
        required: true
      },
      {
        id: 18,
        sender: 'bot',
        text: 'ご希望の住宅エリアはどちらですか？',
        inputType: 'select',
        inputName: 'desiredArea',
        options: [
          { value: 'tokyo23', label: '東京23区内' },
          { value: 'tokyoOther', label: '東京23区外' },
          { value: 'kanagawa', label: '神奈川県' },
          { value: 'saitama', label: '埼玉県' },
          { value: 'chiba', label: '千葉県' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      {
        id: 19,
        sender: 'bot',
        text: 'ご希望の住宅ローンの頭金はいくらくらいをお考えですか？',
        inputType: 'number',
        inputName: 'downPayment',
        placeholder: '例: 500万円の場合は 5000000',
        minValue: 0,
        required: true
      },
      {
        id: 20,
        sender: 'bot',
        text: 'ありがとうございました！これで質問は以上です。診断結果を算出します。',
        required: false
      }
    ]
    
    // 条件分岐の設定（例）
    if (step === 2 && lastAnswer === 'いいえ') {
      // 配偶者がいない場合は配偶者の年齢をスキップ
      return questionSequence.find(q => q.id === 5) || null
    }
    
    if (step === 4 && Number(lastAnswer) === 0) {
      // 子供がいない場合は子供に関する質問をスキップ
      return questionSequence.find(q => q.id === 7) || null
    }
    
    // ステップに該当する次の質問を返す
    const nextQuestionIndex = questionSequence.findIndex(q => q.id === step + 3)
    return nextQuestionIndex >= 0 && nextQuestionIndex < questionSequence.length 
      ? questionSequence[nextQuestionIndex] 
      : null
  }
  
  // 結果計算
  const calculateResults = async (history: ChatHistoryType) => {
    try {
      // 各種計算ロジック（実際は住宅予算の計算が必要）
      // MAXライン、妥当ライン、安全ラインの算出
      
      // 単純な仮の計算（実際の計算ロジックはもっと複雑になる）
      const totalIncome = Number(history.userIncome || 0) + Number(history.spouseIncome || 0)
      const savingsAmount = Number(history.savings || 0)
      
      // 住宅ローン返済負担率の基準
      // MAXライン：収入の30%、妥当ライン：収入の25%、安全ライン：収入の20%
      const maxLineMonthlyPayment = totalIncome * 0.30 / 12
      const reasonableLineMonthlyPayment = totalIncome * 0.25 / 12
      const safeLineMonthlyPayment = totalIncome * 0.20 / 12
      
      // 住宅価格の計算（35年ローン、金利2%と仮定）
      // これは簡易計算。実際には頭金も考慮する必要がある
      const loanYears = 35
      const interestRate = 0.02
      const downPayment = Number(history.downPayment || 0)
      
      // 毎月返済額から住宅ローン借入可能額を逆算する計算式
      // 実際にはもっと正確な計算式を使うべき
      const calculateLoanAmount = (monthlyPayment: number) => {
        const monthlyRate = interestRate / 12
        const totalPayments = loanYears * 12
        const presentValueFactor = (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate
        return monthlyPayment * presentValueFactor
      }
      
      const maxLineLoanAmount = calculateLoanAmount(maxLineMonthlyPayment)
      const reasonableLineLoanAmount = calculateLoanAmount(reasonableLineMonthlyPayment)
      const safeLineLoanAmount = calculateLoanAmount(safeLineMonthlyPayment)
      
      // 住宅価格 = ローン借入額 + 頭金
      const maxLinePrice = Math.round(maxLineLoanAmount + downPayment)
      const reasonableLinePrice = Math.round(reasonableLineLoanAmount + downPayment)
      const safeLinePrice = Math.round(safeLineLoanAmount + downPayment)
      
      // 結果をデータベースに保存
      await supabase.from('budget_diagnoses').insert({
        user_id: userId,
        input_data: history,
        max_line: maxLinePrice,
        reasonable_line: reasonableLinePrice,
        safe_line: safeLinePrice,
        created_at: new Date().toISOString()
      })
      
      // 結果メッセージを表示
      const resultsMessage: MessageType = {
        id: messages.length + 3,
        sender: 'bot',
        text: `
診断結果が出ました！
あなたの住宅予算の目安は：

🔴 MAXライン：${(maxLinePrice / 10000).toFixed(0)}万円
（返済負担率：年収の30%）

🟡 妥当ライン：${(reasonableLinePrice / 10000).toFixed(0)}万円
（返済負担率：年収の25%）

🟢 安全ライン：${(safeLinePrice / 10000).toFixed(0)}万円
（返済負担率：年収の20%）

この金額から頭金${(downPayment / 10000).toFixed(0)}万円を引いた額が、住宅ローンの借入目安となります。
基準1: 購入後5年間で貯蓄残高がマイナスにならないこと
基準2: 老後資金目標額は1人あたり2,000万円を確保

※詳細な診断結果と家計シミュレーションをご確認ください。
`
      }
      
      setMessages(prev => [...prev.filter(m => m.text !== '診断結果を計算しています...'), resultsMessage])
      
      // 結果を親コンポーネントに渡す
      onComplete({
        maxLine: maxLinePrice,
        reasonableLine: reasonableLinePrice,
        safeLine: safeLinePrice,
        monthlyPayment: {
          max: maxLineMonthlyPayment,
          reasonable: reasonableLineMonthlyPayment,
          safe: safeLineMonthlyPayment
        },
        inputData: history
      })
      
    } catch (error) {
      console.error('Error calculating results:', error)
      
      // エラーメッセージを表示
      const errorMessage: MessageType = {
        id: messages.length + 3,
        sender: 'bot',
        text: '申し訳ありません。結果の計算中にエラーが発生しました。もう一度お試しください。'
      }
      
      setMessages(prev => [...prev.filter(m => m.text !== '診断結果を計算しています...'), errorMessage])
    }
  }
  
  // 選択肢をクリックしたときの処理
  const handleOptionClick = (option: string) => {
    setCurrentInput(option)
    setTimeout(() => {
      handleChatProgress()
    }, 300)
  }
  
  // 入力送信処理
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (currentInput.trim() && !processingInput) {
      handleChatProgress()
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-200px)] max-h-[800px] bg-gray-100 rounded-lg overflow-hidden">
      {/* チャットヘッダー */}
      <div className="bg-green-500 text-white p-4 flex items-center">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <h2 className="font-bold">安心住宅予算AI診断</h2>
          <p className="text-xs opacity-90">あなたの理想の住宅予算を診断します</p>
        </div>
      </div>
      
      {/* メッセージエリア */}
      <div className="flex-1 p-4 overflow-y-auto bg-[url('/chat-bg.png')] bg-opacity-10">
        {messages.map((message) => (
          <div 
            key={message.id} 
            className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'} mb-4`}
          >
            {message.sender === 'bot' && (
              <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center mr-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            )}
            
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'bot' 
                  ? 'bg-white text-gray-800' 
                  : 'bg-green-500 text-white'
              }`}
            >
              <p className="whitespace-pre-line">{message.text}</p>
              
              {/* 選択肢がある場合 */}
              {message.options && message.inputType === 'radio' && waitingForAnswer && message.id === messages[messages.length - 1].id && (
                <div className="mt-3 flex flex-col space-y-2">
                  {message.options.map(option => (
                    <button
                      key={option.value}
                      onClick={() => handleOptionClick(option.label)}
                      className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 text-left"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
              
              {/* 選択メニューがある場合 */}
              {message.options && message.inputType === 'select' && waitingForAnswer && message.id === messages[messages.length - 1].id && (
                <div className="mt-3">
                  <select
                    value={currentInput}
                    onChange={(e) => setCurrentInput(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-md text-gray-800"
                  >
                    <option value="">選択してください</option>
                    {message.options.map(option => (
                      <option key={option.value} value={option.label}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
            
            {message.sender === 'user' && (
              <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center ml-2 flex-shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* 入力エリア */}
      <form onSubmit={handleSubmit} className="p-3 bg-white border-t border-gray-200">
        {waitingForAnswer && messages.length > 0 && (
          <div className="flex">
            <input
              type={messages[messages.length - 1].inputType === 'number' ? 'number' : 'text'}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              min={messages[messages.length - 1].minValue}
              max={messages[messages.length - 1].maxValue}
              className="flex-1 border border-gray-300 rounded-l-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder={messages[messages.length - 1].placeholder || '回答を入力...'}
              disabled={processingInput || (messages[messages.length - 1].options && messages[messages.length - 1].inputType === 'radio')}
            />
            <button
              type="submit"
              className={`bg-green-500 text-white px-4 rounded-r-lg flex items-center ${
                !currentInput.trim() || processingInput ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
              }`}
              disabled={!currentInput.trim() || processingInput}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        )}
        {(!waitingForAnswer || messages.length === 0) && (
          <div className="flex justify-center">
            <p className="text-gray-500">
              {messages.length === 0 ? '会話を開始しています...' : processingInput ? '処理中...' : '質問に回答してください'}
            </p>
          </div>
        )}
      </form>
    </div>
  )
} 