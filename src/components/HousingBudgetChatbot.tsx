'use client'

import { useState, useEffect, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { FaRobot, FaUser } from 'react-icons/fa'

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
  [key: string]: string | number | boolean | undefined | null;
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
  const chatContainerRef = useRef<HTMLDivElement>(null)
  
  // 最初のメッセージを表示
  useEffect(() => {
    const initialMessage: MessageType = {
      id: 1,
      sender: 'bot',
      text: `こんにちは！安心住宅予算診断AIアシスタントです。

いくつかの質問に答えていただくことで、あなたに最適な住宅予算を3つのラインで提案します。

🧭 安心住宅予算診断の基準点
・基準1：購入後5年間で貯蓄残高がマイナスにならないこと
・基準2：老後資金目標額は1人あたり2,000万円を確保
・参考指標：年収の20%以内の返済額を「安全ライン」として提案

詳しい質問にお答えいただくほど、精度の高い診断結果が得られます。
まずは基本情報からお聞きしていきますね。`,
    }
    
    const firstQuestion: MessageType = {
      id: 2,
      sender: 'bot',
      text: 'お名前を教えてください。',
      inputType: 'text',
      inputName: 'userName',
      placeholder: '例: 山田太郎',
      required: true
    }
    
    setTimeout(() => {
      setMessages([initialMessage])
      setTimeout(() => {
        setMessages([initialMessage, firstQuestion])
        setWaitingForAnswer(true)
        setCurrentStep(1) // 最初のステップを1に設定
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
        // 次の質問にユニークなIDを割り当て
        const uniqueNextQuestion = {
          ...nextQuestion,
          id: messages.length + 2  // 最後のメッセージID + 2（ユーザーメッセージの後）
        }
        
        setMessages(prev => [...prev, uniqueNextQuestion])
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
    // 質問のシーケンスを定義（IDは後で動的に割り当てるため、この時点では省略可能）
    const baseQuestionSequence: Omit<MessageType, 'id'>[] = [
      // 家族構成・基本情報
      {
        sender: 'bot',
        text: 'お名前を教えてください。',
        inputType: 'text',
        inputName: 'userName',
        placeholder: '例: 山田太郎',
        required: true
      },
      {
        sender: 'bot',
        text: 'あなたの生年月日を教えてください。',
        inputType: 'date',
        inputName: 'userBirthday',
        required: true
      },
      {
        sender: 'bot',
        text: '性別を教えてください。',
        inputType: 'radio',
        inputName: 'userGender',
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      {
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
        sender: 'bot',
        text: '配偶者のお名前を教えてください。',
        inputType: 'text',
        inputName: 'spouseName',
        placeholder: '例: 山田花子',
        required: true
      },
      {
        sender: 'bot',
        text: '配偶者の生年月日を教えてください。',
        inputType: 'date',
        inputName: 'spouseBirthday',
        required: true
      },
      {
        sender: 'bot',
        text: '配偶者の性別を教えてください。',
        inputType: 'radio',
        inputName: 'spouseGender',
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      {
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
        sender: 'bot',
        text: '1人目のお子さんの生年月日を教えてください。',
        inputType: 'date',
        inputName: 'child1Birthday',
        required: true
      },
      {
        sender: 'bot',
        text: '1人目のお子さんの性別を教えてください。',
        inputType: 'radio',
        inputName: 'child1Gender',
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      {
        sender: 'bot',
        text: '2人目のお子さんの生年月日を教えてください。',
        inputType: 'date',
        inputName: 'child2Birthday',
        required: true
      },
      {
        sender: 'bot',
        text: '2人目のお子さんの性別を教えてください。',
        inputType: 'radio',
        inputName: 'child2Gender',
        options: [
          { value: 'male', label: '男性' },
          { value: 'female', label: '女性' },
          { value: 'other', label: 'その他' }
        ],
        required: true
      },
      {
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
        sender: 'bot',
        text: 'あなたの本業と副業を合わせた年収（税込）を教えてください。',
        inputType: 'number',
        inputName: 'userIncome',
        placeholder: '例: 500万円の場合は 5000000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '配偶者の本業と副業を合わせた年収（税込）を教えてください。働いていない場合は0と入力してください。',
        inputType: 'number',
        inputName: 'spouseIncome',
        placeholder: '例: 300万円の場合は 3000000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '配偶者に出産・産休の予定はありますか？',
        inputType: 'radio',
        inputName: 'spouseMaternityLeave',
        options: [
          { value: 'yes', label: 'はい' },
          { value: 'no', label: 'いいえ' }
        ],
        required: true
      },
      {
        sender: 'bot',
        text: '現在の金融資産（預金・現金・投資など含む）の合計を教えてください。',
        inputType: 'number',
        inputName: 'savings',
        placeholder: '例: 1000万円の場合は 10000000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: 'インデックス投資などの運用中資産はいくらですか？（上記の金融資産に含まれている場合も入力してください）',
        inputType: 'number',
        inputName: 'investments',
        placeholder: '例: 200万円の場合は 2000000',
        minValue: 0,
        required: true
      },
      {
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
      {
        sender: 'bot',
        text: '退職金の予想金額がわかれば教えてください。わからない場合は0と入力してください。',
        inputType: 'number',
        inputName: 'retirementBonusAmount',
        placeholder: '例: 2000万円の場合は 20000000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '持ち家を所有していて、住み替えの予定がある場合、現在の物件の評価額から残債を引いた手残り額はいくらくらいになる見込みですか？（住み替え予定がない方や賃貸の方は0と入力してください）',
        inputType: 'number',
        inputName: 'existingPropertyValue',
        placeholder: '例: 2000万円の場合は 20000000',
        minValue: 0,
        required: true
      },
      // 支出（生活費）
      {
        sender: 'bot',
        text: '現在の家賃（月額）を教えてください。持ち家の場合は0と入力してください。',
        inputType: 'number',
        inputName: 'currentRent',
        placeholder: '例: 10万円の場合は 100000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '毎月の保険料（生命保険・医療保険など）の合計を教えてください。わからない場合は空欄のままでも結構です。',
        inputType: 'number',
        inputName: 'monthlyInsurance',
        placeholder: '例: 3万円の場合は 30000',
        minValue: 0,
        required: false
      },
      {
        sender: 'bot',
        text: '毎月の生活費（食費・光熱費・通信費など、家賃・保険・教育費は除く）を教えてください。',
        inputType: 'number',
        inputName: 'monthlyLivingExpenses',
        placeholder: '例: 20万円の場合は 200000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '毎月の趣味・娯楽費（旅行積立なども含む）はいくらくらいですか？',
        inputType: 'number',
        inputName: 'monthlyHobbyExpenses',
        placeholder: '例: 3万円の場合は 30000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: '年間の海外旅行費用はいくらくらいですか？回数と合計金額でお答えください。',
        inputType: 'text',
        inputName: 'yearlyTravelExpenses',
        placeholder: '例: 年1回・50万円',
        required: true
      },
      {
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
      // その他・目標設定
      {
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
        sender: 'bot',
        text: 'ご希望の住宅ローンの頭金はいくらくらいをお考えですか？',
        inputType: 'number',
        inputName: 'downPayment',
        placeholder: '例: 500万円の場合は 5000000',
        minValue: 0,
        required: true
      },
      {
        sender: 'bot',
        text: 'ありがとうございました！これで質問は以上です。診断結果を算出します。',
        required: false
      }
    ]

    // 各質問に動的IDを割り当て
    const questionSequence: MessageType[] = baseQuestionSequence.map((q, index) => ({
      ...q,
      id: index + 3 // ID=1は初期メッセージ、ID=2は名前の質問
    }))
    
    // 実行ステップ (step) に基づいて次の質問を選択
    const nextQuestionIndex = step // 現在のステップから次の質問のインデックスを計算
    
    // 条件分岐の設定（インデックスで参照）
    if (step === 3 && lastAnswer === 'いいえ') {
      // 配偶者がいない場合は配偶者関連の質問をスキップ (インデックス 4-7)
      // 配偶者関連のデータを空値に設定
      setChatHistory(prev => ({
        ...prev,
        hasSpouse: 'いいえ',
        spouseName: undefined,
        spouseBirthday: undefined,
        spouseGender: undefined,
        spouseIncome: 0,
        spouseMaternityLeave: 'いいえ'
      }));
      
      // 配偶者関連の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(7);  // お子さんは何人？の質問に対応するステップ
      }, 100);
      
      return questionSequence[7] // お子さんは何人？の質問
    }
    
    if (step === 7 && Number(lastAnswer) === 0) {
      // 子供がいない場合は子供に関する質問をスキップ (インデックス 8-11)
      // 子供関連のデータを設定
      setChatHistory(prev => ({
        ...prev,
        childrenCount: 0,
        child1Birthday: undefined,
        child1Gender: undefined,
        child2Birthday: undefined,
        child2Gender: undefined
      }));
      
      // 子供関連の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(12);  // 今後、お子さんが増える予定は？の質問に対応するステップ
      }, 100);
      
      return questionSequence[12] // 今後、お子さんが増える予定はありますか？
    }
    
    if (step === 7 && Number(lastAnswer) === 1) {
      // 子供が1人の場合は2人目の質問をスキップ (インデックス 10-11)
      // 2人目の子供データを初期化
      setChatHistory(prev => ({
        ...prev,
        child2Birthday: undefined,
        child2Gender: undefined
      }));
      
      // 2人目の子供関連の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(12);  // 今後、お子さんが増える予定は？の質問に対応するステップ
      }, 100);
      
      return questionSequence[12] // 今後、お子さんが増える予定はありますか？
    }

    // 配偶者の出産・産休の質問は女性配偶者の場合のみ
    if (step === 14 && history.spouseGender !== '女性') {
      // 産休関連のデータを初期化
      setChatHistory(prev => ({
        ...prev,
        spouseMaternityLeave: 'いいえ'
      }));
      
      // 産休の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(16);  // 現在の金融資産～の質問に対応するステップ
      }, 100);
      
      return questionSequence[16] // 現在の金融資産～の質問
    }
    
    if (step === 18 && lastAnswer === 'いいえ') {
      // 退職金の見込みがない場合は金額の質問をスキップ
      // 退職金関連のデータを初期化
      setChatHistory(prev => ({
        ...prev,
        retirementBonusAmount: 0
      }));
      
      // 退職金金額の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(20);  // 持ち家を所有していて～の質問に対応するステップ
      }, 100);
      
      return questionSequence[20] // 持ち家を所有していて～の質問
    }
    
    if (step === 20 && lastAnswer === 'いいえ') {
      // 持ち家を所有していない場合は売却予定価格の質問をスキップ
      // 持ち家関連のデータを初期化
      setChatHistory(prev => ({
        ...prev,
        ownHomeSellingPrice: 0
      }));
      
      // 持ち家売却価格の質問をスキップするため、currentStepを更新
      setTimeout(() => {
        setCurrentStep(22);  // 今後の資産形成～の質問に対応するステップ
      }, 100);
      
      return questionSequence[22] // 今後の資産形成～の質問
    }
    
    // 通常の進行
    if (nextQuestionIndex < questionSequence.length) {
      return questionSequence[nextQuestionIndex]
    }
    
    // 質問が終了した場合
    return null
  }
  
  // 結果計算
  const calculateResults = async (history: ChatHistoryType) => {
    try {
      // 基本情報の取得
      const userAge = calculateAge(history.userBirthday as string);
      const hasSpouse = history.hasSpouse === 'はい';
      // 配偶者の情報は配偶者がいる場合のみ取得
      const spouseAge = hasSpouse && history.spouseBirthday ? calculateAge(history.spouseBirthday as string) : 0;
      const childrenCount = Number(history.childrenCount || 0);
      const planToHaveMoreChildren = history.planToHaveMoreChildren === 'はい';
      
      // 収入情報
      const userIncome = Number(history.userIncome || 0);
      const spouseIncome = hasSpouse ? Number(history.spouseIncome || 0) : 0;
      const totalIncome = userIncome + spouseIncome;
      
      // 資産情報
      const currentSavings = Number(history.savings || 0);
      const investments = Number(history.investments || 0);
      const existingPropertyValue = Number(history.existingPropertyValue || 0);
      
      // 支出情報
      const currentRent = Number(history.currentRent || 0);
      const monthlyInsurance = Number(history.monthlyInsurance || 25000); // デフォルト2.5万円/月
      const monthlyLivingExpenses = Number(history.monthlyLivingExpenses || 0);
      const monthlyHobbyExpenses = Number(history.monthlyHobbyExpenses || 0);
      
      // 教育費の設定（選択に基づく）
      const educationPlanCosts = {
        public: 200000, // 公立中心: 年間20万円/人
        mixed: 500000,  // 混合: 年間50万円/人
        private: 1000000 // 私立中心: 年間100万円/人
      };
      
      const educationPlan = history.educationPlan as string || 'public';
      const yearlyEducationCost = educationPlanCosts[educationPlan as keyof typeof educationPlanCosts] * childrenCount;
      
      // 追加子供の計画がある場合の追加費用
      const additionalChildExpenses = planToHaveMoreChildren ? 75000 * 12 + educationPlanCosts[educationPlan as keyof typeof educationPlanCosts] : 0;
      
      // 年間総支出の計算（住宅ローン除く）
      const yearlyExpenses = 
        (monthlyLivingExpenses + monthlyInsurance + monthlyHobbyExpenses) * 12 + 
        yearlyEducationCost + 
        additionalChildExpenses;
      
      // 退職年齢と老後資金目標
      const retirementAge = Number(history.retirementAge || 65);
      const peopleCount = 1 + (hasSpouse ? 1 : 0);
      const retirementFundGoal = 20000000 * peopleCount; // 1人2000万円
      
      // 住宅ローン関連
      const downPayment = Number(history.downPayment || 0);
      const loanYears = 35; // 35年ローン
      const interestRate = 0.02; // 金利2%
      
      // 毎月の返済額から住宅ローン借入可能額を逆算する関数
      const calculateLoanAmount = (monthlyPayment: number) => {
        const monthlyRate = interestRate / 12;
        const totalPayments = loanYears * 12;
        const presentValueFactor = (1 - Math.pow(1 + monthlyRate, -totalPayments)) / monthlyRate;
        return monthlyPayment * presentValueFactor;
      };
      
      // 年間貯蓄可能額の計算
      const yearlySavingsPotential = totalIncome - yearlyExpenses;
      
      // 5年間の貯蓄推移をシミュレーション
      const simulateSavingsFor5Years = (monthlyLoanPayment: number) => {
        let savingsBalance = currentSavings;
        const yearlyLoanPayment = monthlyLoanPayment * 12;
        
        // 5年間の推移をシミュレーション
        for (let year = 1; year <= 5; year++) {
          // 投資による増加 (投資分は年利3.5%と仮定)
          const investmentGrowth = investments * 0.035;
          
          // 年間貯蓄額（収入 - 支出 - ローン返済）
          const yearlyNetSavings = totalIncome - yearlyExpenses - yearlyLoanPayment;
          
          // 貯蓄残高の更新
          savingsBalance += yearlyNetSavings + investmentGrowth;
          
          // マイナスになった時点で不適格と判定
          if (savingsBalance < 0) {
            return false;
          }
        }
        
        return true; // 5年間マイナスにならなければ基準1をクリア
      };
      
      // 老後資金目標達成可能性の計算
      const canAchieveRetirementGoal = (monthlyLoanPayment: number) => {
        const yearlyLoanPayment = monthlyLoanPayment * 12;
        const yearsUntilRetirement = retirementAge - userAge;
        
        // ローン完済後の貯蓄期間（年）
        const savingYearsAfterLoan = Math.max(0, yearsUntilRetirement - loanYears);
        
        // ローン期間中の年間貯蓄額
        const yearlySavingsDuringLoan = totalIncome - yearlyExpenses - yearlyLoanPayment;
        
        // ローン完済後の年間貯蓄額
        const yearlySavingsAfterLoan = totalIncome - yearlyExpenses;
        
        // 現在の貯蓄から老後までに貯められる総額を計算
        let projectedRetirementFund = currentSavings;
        
        // ローン期間中の貯蓄
        const loanPeriodYears = Math.min(yearsUntilRetirement, loanYears);
        projectedRetirementFund += yearlySavingsDuringLoan * loanPeriodYears;
        
        // ローン完済後の貯蓄
        projectedRetirementFund += yearlySavingsAfterLoan * savingYearsAfterLoan;
        
        // 投資による成長（簡易計算）
        const estimatedInvestmentGrowth = investments * Math.pow(1.035, yearsUntilRetirement) - investments;
        projectedRetirementFund += estimatedInvestmentGrowth;
        
        // 老後資金目標と比較
        return projectedRetirementFund >= retirementFundGoal;
      };
      
      // 基準に基づいた住宅予算の計算
      // 1. 安全ライン: 年収の20%以内の返済負担率
      const safeLineMonthlyPayment = totalIncome * 0.20 / 12;
      const safeLineLoanAmount = calculateLoanAmount(safeLineMonthlyPayment);
      let safeLinePrice = Math.round(safeLineLoanAmount + downPayment);
      
      // 2. 妥当ライン: 年収の25%の返済負担率
      const reasonableLineMonthlyPayment = totalIncome * 0.25 / 12;
      const reasonableLineLoanAmount = calculateLoanAmount(reasonableLineMonthlyPayment);
      let reasonableLinePrice = Math.round(reasonableLineLoanAmount + downPayment);
      
      // 3. MAXライン: 年収の30%の返済負担率
      const maxLineMonthlyPayment = totalIncome * 0.30 / 12;
      const maxLineLoanAmount = calculateLoanAmount(maxLineMonthlyPayment);
      let maxLinePrice = Math.round(maxLineLoanAmount + downPayment);
      
      // 基準1: 5年間貯蓄推移がマイナスにならないことを確認
      // 基準2: 老後資金目標の達成可能性を確認
      
      // 安全ラインの調整
      if (!simulateSavingsFor5Years(safeLineMonthlyPayment) || !canAchieveRetirementGoal(safeLineMonthlyPayment)) {
        // 基準を満たさない場合、満たす金額まで下げる
        let low = 0;
        let high = safeLineMonthlyPayment;
        let mid = 0;
        
        while (high - low > 1000) { // 1000円単位で収束
          mid = (high + low) / 2;
          if (simulateSavingsFor5Years(mid) && canAchieveRetirementGoal(mid)) {
            low = mid;
          } else {
            high = mid;
          }
        }
        
        const adjustedLoanAmount = calculateLoanAmount(low);
        safeLinePrice = Math.round(adjustedLoanAmount + downPayment);
      }
      
      // 妥当ラインの調整（安全ラインを下回らないように）
      if (!simulateSavingsFor5Years(reasonableLineMonthlyPayment) || !canAchieveRetirementGoal(reasonableLineMonthlyPayment)) {
        reasonableLinePrice = safeLinePrice * 1.1; // 安全ラインの1.1倍を仮定
      }
      
      // MAXラインの調整（妥当ラインを下回らないように）
      if (!simulateSavingsFor5Years(maxLineMonthlyPayment) || !canAchieveRetirementGoal(maxLineMonthlyPayment)) {
        maxLinePrice = reasonableLinePrice * 1.1; // 妥当ラインの1.1倍を仮定
      }
      
      // 結果をデータベースに保存
      await supabase.from('budget_diagnoses').insert({
        user_id: userId,
        input_data: history,
        max_line: maxLinePrice,
        reasonable_line: reasonableLinePrice,
        safe_line: safeLinePrice,
        created_at: new Date().toISOString()
      });
      
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
      };
      
      setMessages(prev => [...prev.filter(m => m.text !== '診断結果を計算しています...'), resultsMessage]);
      
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
        inputData: history,
        savingsSimulation: {
          safeLineSavings: simulateSavings(safeLineMonthlyPayment, 60), // 5年 = 60か月
          reasonableLineSavings: simulateSavings(reasonableLineMonthlyPayment, 60),
          maxLineSavings: simulateSavings(maxLineMonthlyPayment, 60)
        },
        retirementProjection: {
          targetAmount: retirementFundGoal,
          projectedWithSafeLine: projectRetirementFund(safeLineMonthlyPayment),
          projectedWithReasonableLine: projectRetirementFund(reasonableLineMonthlyPayment),
          projectedWithMaxLine: projectRetirementFund(maxLineMonthlyPayment)
        }
      });
      
    } catch (error) {
      console.error('Error calculating results:', error);
      
      // エラーメッセージを表示
      const errorMessage: MessageType = {
        id: messages.length + 3,
        sender: 'bot',
        text: '申し訳ありません。結果の計算中にエラーが発生しました。もう一度お試しください。'
      };
      
      setMessages(prev => [...prev.filter(m => m.text !== '診断結果を計算しています...'), errorMessage]);
    }
  };

  // 年齢計算用の補助関数
  const calculateAge = (birthdate: string): number => {
    const today = new Date();
    const birthDate = new Date(birthdate);
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };
  
  // n月間の貯蓄推移シミュレーション用関数
  const simulateSavings = (monthlyLoanPayment: number, months: number) => {
    const results = [];
    let savingsBalance = Number(chatHistory.savings || 0);
    const investments = Number(chatHistory.investments || 0);
    const hasSpouse = chatHistory.hasSpouse === 'はい';
    const totalIncome = Number(chatHistory.userIncome || 0) + 
                         (hasSpouse ? Number(chatHistory.spouseIncome || 0) : 0);
    const monthlyExpenses = Number(chatHistory.monthlyLivingExpenses || 0) + 
                            Number(chatHistory.monthlyInsurance || 25000) + 
                            Number(chatHistory.monthlyHobbyExpenses || 0);
    
    // 子どもの教育費（月額換算）
    const childrenCount = Number(chatHistory.childrenCount || 0);
    const educationPlan = chatHistory.educationPlan as string || 'public';
    const educationPlanCosts = {
      public: 200000 / 12, // 公立中心: 月額約1.7万円/人
      mixed: 500000 / 12,  // 混合: 月額約4.2万円/人
      private: 1000000 / 12 // 私立中心: 月額約8.3万円/人
    };
    const monthlyEducationCost = educationPlanCosts[educationPlan as keyof typeof educationPlanCosts] * childrenCount;
    
    // 追加子供の計画がある場合
    const additionalChildCost = chatHistory.planToHaveMoreChildren === 'はい' ? 75000 + educationPlanCosts[educationPlan as keyof typeof educationPlanCosts] : 0;
    
    // 月間の純貯蓄可能額
    const monthlySavingsPotential = totalIncome / 12 - monthlyExpenses - monthlyEducationCost - additionalChildCost - monthlyLoanPayment;
    
    // 毎月の投資リターン (月利0.29%≒年利3.5%)
    const monthlyInvestmentReturn = investments * 0.0029;
    
    results.push(savingsBalance); // 初期値
    
    for (let i = 1; i <= months; i++) {
      savingsBalance += monthlySavingsPotential + monthlyInvestmentReturn;
      
      // 6ヶ月ごとにデータを記録
      if (i % 6 === 0) {
        results.push(Math.max(0, savingsBalance));
      }
    }
    
    return results;
  };
  
  // 老後資金予測用関数
  const projectRetirementFund = (monthlyLoanPayment: number) => {
    const userAge = calculateAge(chatHistory.userBirthday as string);
    const retirementAge = Number(chatHistory.retirementAge || 65);
    const yearsUntilRetirement = retirementAge - userAge;
    const loanYears = 35;
    
    const investments = Number(chatHistory.investments || 0);
    const hasSpouse = chatHistory.hasSpouse === 'はい';
    const totalIncome = Number(chatHistory.userIncome || 0) + 
                         (hasSpouse ? Number(chatHistory.spouseIncome || 0) : 0);
    const yearlyExpenses = 
      (Number(chatHistory.monthlyLivingExpenses || 0) + 
       Number(chatHistory.monthlyInsurance || 25000) + 
       Number(chatHistory.monthlyHobbyExpenses || 0)) * 12;
    
    const yearlyLoanPayment = monthlyLoanPayment * 12;
    
    // ローン完済後の貯蓄期間（年）
    const savingYearsAfterLoan = Math.max(0, yearsUntilRetirement - loanYears);
    
    // ローン期間中の年間貯蓄額
    const yearlySavingsDuringLoan = totalIncome - yearlyExpenses - yearlyLoanPayment;
    
    // ローン完済後の年間貯蓄額
    const yearlySavingsAfterLoan = totalIncome - yearlyExpenses;
    
    // 現在の貯蓄から老後までに貯められる総額を計算
    let projectedRetirementFund = Number(chatHistory.savings || 0);
    
    // ローン期間中の貯蓄
    const loanPeriodYears = Math.min(yearsUntilRetirement, loanYears);
    projectedRetirementFund += yearlySavingsDuringLoan * loanPeriodYears;
    
    // ローン完済後の貯蓄
    projectedRetirementFund += yearlySavingsAfterLoan * savingYearsAfterLoan;
    
    // 投資による成長（簡易計算）
    const estimatedInvestmentGrowth = investments * Math.pow(1.035, yearsUntilRetirement) - investments;
    projectedRetirementFund += estimatedInvestmentGrowth;
    
    return projectedRetirementFund;
  };
  
  // 選択肢をクリックしたときの処理
  const handleOptionClick = (option: string) => {
    setCurrentInput(option)
    handleSubmit(null as any)
  }
  
  // フォーム送信時の処理
  const handleSubmit = (e: React.FormEvent) => {
    if (e) e.preventDefault()
    if (currentInput.trim() === '') return
    handleChatProgress()
  }

  // メッセージの内容を適切に表示するヘルパー関数
  const renderMessage = (message: MessageType) => {
    // 入力フィールドを表示するかどうか
    const showInput = waitingForAnswer && message.id === messages[messages.length - 1].id
    
    return (
      <>
        <p className="whitespace-pre-line mb-2">{message.text}</p>
        
        {/* テキスト入力または数値入力 */}
        {showInput && (message.inputType === 'text' || message.inputType === 'number') && (
          <input
            type={message.inputType}
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            placeholder={message.placeholder}
            className="w-full p-2 border border-gray-300 rounded-md"
            min={message.minValue}
            max={message.maxValue}
            autoFocus
          />
        )}
        
        {/* 日付入力 */}
        {showInput && message.inputType === 'date' && (
          <input
            type="date"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            autoFocus
          />
        )}
        
        {/* ラジオボタン選択 */}
        {showInput && message.inputType === 'radio' && message.options && (
          <div className="flex flex-col space-y-2">
            {message.options.map((option, index) => (
              <button
                key={`${message.id}-option-${index}`}
                onClick={() => handleOptionClick(option.label)}
                className="px-4 py-2 bg-gray-100 text-gray-800 rounded-md text-sm hover:bg-gray-200 text-left"
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
        
        {/* セレクトメニュー */}
        {showInput && message.inputType === 'select' && message.options && (
          <select
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md"
            autoFocus
          >
            <option value="">選択してください</option>
            {message.options.map((option, index) => (
              <option key={`${message.id}-select-${index}`} value={option.label}>
                {option.label}
              </option>
            ))}
          </select>
        )}
      </>
    )
  }
  
  return (
    <div className="flex flex-col h-full max-w-4xl mx-auto">
      <div className="bg-green-600 text-white p-4 rounded-t-lg">
        <h2 className="text-xl font-bold">住宅予算AI診断</h2>
      </div>
      
      <div 
        className="flex-1 p-4 overflow-y-auto bg-gray-100 space-y-4"
        style={{ backgroundImage: 'url("/chat-bg.png")' }}
        ref={chatContainerRef}
      >
        {messages.map((message, index) => (
          <div
            key={`${message.id}-${index}`}
            className={`flex ${message.sender === 'bot' ? 'justify-start' : 'justify-end'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'bot'
                  ? 'bg-white text-gray-800'
                  : 'bg-green-500 text-white'
              }`}
            >
              {renderMessage(message)}
            </div>
          </div>
        ))}
        
        {processingInput && (
          <div className="flex justify-start">
            <div className="bg-white text-gray-800 p-3 rounded-lg max-w-[80%]">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>
      
      <div className="bg-white p-4 border-t">
        {waitingForAnswer ? (
          <div className="flex">
            <input
              type="text"
              className="flex-1 p-2 border border-gray-300 rounded-l-md"
              placeholder="メッセージを入力..."
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleSubmit(e);
                }
              }}
              disabled={!waitingForAnswer || processingInput}
            />
            <button
              className="bg-green-500 text-white px-4 py-2 rounded-r-md hover:bg-green-600 disabled:bg-gray-400"
              onClick={(e) => handleSubmit(e)}
              disabled={!waitingForAnswer || processingInput}
            >
              送信
            </button>
          </div>
        ) : (
          !processingInput && currentStep > 20 && (
            <button
              className="w-full bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600"
              onClick={() => calculateResults(chatHistory)}
            >
              結果を見る
            </button>
          )
        )}
      </div>
    </div>
  )
} 