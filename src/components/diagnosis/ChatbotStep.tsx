'use client';

import React, { useState, useRef, useEffect } from 'react';
import Button from '../ui/Button';
import Input from '../ui/Input';
import { saveChatbotProgress, getChatbotProgress } from '@/lib/supabase';
import { getJSTTimestamp } from '@/lib/dateUtils';

// チャットのメッセージタイプ
interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
  options?: string[];
  fieldName?: string;
  inputType?: 'text' | 'number' | 'select';
}

// チャットボットの質問項目の型定義
interface Question {
  id: string;
  text: string;
  fieldName: string | null;
  inputType: 'text' | 'number' | 'select' | null;
  options?: string[];
  condition?: (data: Record<string, any>) => boolean;
}

// チャットボットの質問項目
const QUESTIONS: Question[] = [
  {
    id: 'family_info',
    text: 'ご家族構成について教えてください。',
    fieldName: 'familySize',
    inputType: 'select',
    options: ['1人', '2人', '3人', '4人', '5人', '6人以上'],
  },
  {
    id: 'annual_income',
    text: '世帯全体の年収（万円）を教えてください。',
    fieldName: 'annualIncome',
    inputType: 'select',
    options: ['300万円未満', '300〜500万円', '500〜700万円', '700〜1,000万円', '1,000〜1,500万円', '1,500万円以上'],
  },
  {
    id: 'family_head_age',
    text: '世帯主の年齢を教えてください。',
    fieldName: 'headOfHouseholdAge',
    inputType: 'text',
    options: ['ここに入力してください'],
  },
  {
    id: 'spouse_existence',
    text: '配偶者はいらっしゃいますか？',
    fieldName: 'hasSpouse',
    inputType: 'select',
    options: ['はい', 'いいえ'],
  },
  {
    id: 'children_count',
    text: 'お子様は何人いらっしゃいますか？',
    fieldName: 'childrenCount',
    inputType: 'select',
    options: ['0人', '1人', '2人', '3人', '4人以上'],
  },
  {
    id: 'child_ages',
    text: 'お子様の年齢層を教えてください',
    fieldName: 'childrenAges',
    inputType: 'select',
    options: ['未就学児', '小学生', '中学生', '高校生', '大学生以上', '複数の年齢層'],
    condition: (data) => {
      if (!data || !data.childrenCount) return false;
      return data.childrenCount !== '0人';
    },
  },
  {
    id: 'plan_more_children',
    text: '今後、お子様が増える予定はありますか？',
    fieldName: 'planToHaveMoreChildren',
    inputType: 'select',
    options: ['はい', 'いいえ'],
  },
  {
    id: 'savings',
    text: '現在の貯金額（万円）を教えてください。',
    fieldName: 'savings',
    inputType: 'select',
    options: ['なし','100万円未満', '100〜300万円', '300〜500万円', '500〜1,000万円', '1,000〜2,000万円', '2,000万円以上'],
  },
  {
    id: 'mortgage_loan_balance',
    text: '住宅ローンの残高（万円）はありますか？',
    fieldName: 'mortgageLoanBalance',
    inputType: 'select',
    options: ['なし', '1,000万円未満', '1,000〜2,000万円', '2,000〜3,000万円', '3,000〜4,000万円', '4,000万円以上'],
  },
  {
    id: 'monthly_mortgage_payment',
    text: '住宅ローンの月々の返済額（万円）はいくらですか？',
    fieldName: 'monthlyMortgagePayment',
    inputType: 'select',
    options: ['なし', '5万円未満', '5〜10万円', '10〜15万円', '15〜20万円', '20万円以上'],
  },
  {
    id: 'other_debts',
    text: 'その他の負債額（万円）はありますか？',
    fieldName: 'otherDebts',
    inputType: 'select',
    options: ['なし', '100万円未満', '100〜300万円', '300〜500万円', '500〜1,000万円', '1,000万円以上'],
  },
  {
    id: 'maternity_leave_plan',
    text: '今後、出産・産休の予定はありますか？',
    fieldName: 'maternityLeavePlan',
    inputType: 'select',
    options: ['はい', 'いいえ'],
    condition: (data) => {
      if (!data) return false;
      return data.hasSpouse === 'はい';
    },
  },
  {
    id: 'financial_assets',
    text: '金融資産（預金・インデックス投資など）の合計額（万円）を教えてください',
    fieldName: 'financialAssets',
    inputType: 'select',
    options: ['なし','100万円未満', '100〜300万円', '300〜500万円', '500〜1,000万円', '1,000〜2,000万円', '2,000万円以上'],
  },
  {
    id: 'retirement_bonus',
    text: '退職金の予定はありますか？',
    fieldName: 'hasRetirementBonus',
    inputType: 'select',
    options: ['はい', 'いいえ', 'わからない'],
  },
  {
    id: 'retirement_bonus_amount',
    text: '予定されている退職金の金額（万円）を教えてください',
    fieldName: 'retirementBonusAmount',
    inputType: 'select',
    options: ['なし（わからない）','500万円未満', '500〜1,000万円', '1,000〜2,000万円', '2,000〜3,000万円', '3,000万円以上'],
    condition: (data) => {
      if (!data || !data.hasRetirementBonus) return false;
      return data.hasRetirementBonus === 'はい';
    },
  },
  {
    id: 'current_rent',
    text: '現在の家賃（月額・万円）を教えてください',
    fieldName: 'currentRent',
    inputType: 'select',
    options: ['なし','5万円未満', '5〜8万円', '8〜10万円', '10〜15万円', '15〜20万円', '20万円以上'],
  },
  {
    id: 'current_insurance',
    text: '現在の保険料（月額・万円）を教えてください',
    fieldName: 'currentInsurance',
    inputType: 'select',
    options: ['1万円未満', '1〜2万円', '2〜3万円', '3〜5万円', '5万円以上'],
  },
  {
    id: 'monthly_living_expenses',
    text: '毎月の生活費（保険・賃料・教育費を除く）の金額（万円）を教えてください',
    fieldName: 'monthlyLivingExpenses',
    inputType: 'select',
    options: ['10万円未満', '10〜15万円', '15〜20万円', '20〜30万円', '30万円以上'],
  },
  {
    id: 'hobby_expenses',
    text: '趣味・娯楽費（月額・万円）を教えてください',
    fieldName: 'hobbyExpenses',
    inputType: 'select',
    options: ['1万円未満', '1〜3万円', '3〜5万円', '5〜10万円', '10万円以上'],
  },
  {
    id: 'travel_frequency',
    text: '海外旅行の頻度はどれくらいですか？',
    fieldName: 'travelFrequency',
    inputType: 'select',
    options: ['年に1回以上', '2〜3年に1回', 'ほとんど行かない'],
  },
  {
    id: 'education_policy',
    text: 'お子様の教育方針はどちらですか？',
    fieldName: 'educationPolicy',
    inputType: 'select',
    options: ['公立中心', '私立中心', 'まだ決めていない'],
    condition: (data) => {
      if (!data || !data.childrenCount) return false;
      return data.childrenCount !== '0人';
    },
  },
  {
    id: 'retirement_age',
    text: '予定している退職年齢を教えてください',
    fieldName: 'retirementAge',
    inputType: 'select',
    options: ['60歳未満', '60歳', '65歳', '70歳', '70歳以上', 'まだ決めていない'],
  },
  {
    id: 'loan_years',
    text: '住宅ローンの返済希望年数を教えてください',
    fieldName: 'loanYears',
    inputType: 'select',
    options: ['希望なし','20年以下', '25年', '30年', '35年', '35年超'],
  },
  {
    id: 'expected_interest_rate',
    text: '想定しているローン金利（%）を教えてください',
    fieldName: 'expectedInterestRate',
    inputType: 'select',
    options: ['想定なし','1.0%以下', '1.0〜1.5%', '1.5〜2.0%', '2.0%以上'],
  },
];

interface ChatbotStepProps {
  userName: string;
  userId: string | null;
  onComplete: (chatbotData: Record<string, any>) => void;
  onBack: () => void;
}

const ChatbotStep: React.FC<ChatbotStepProps> = ({
  userName,
  userId,
  onComplete,
  onBack,
}) => {
  // チャットメッセージの状態
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  // 入力中のメッセージ
  const [inputMessage, setInputMessage] = useState('');
  
  // 収集したデータ
  const [collectedData, setCollectedData] = useState<Record<string, any>>({});
  
  // 現在の質問インデックス
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  
  // 処理済みの質問IDを追跡
  const [processedQuestionIds, setProcessedQuestionIds] = useState<Set<string>>(new Set());
  
  // 途中保存中かどうかのフラグ
  const [isSaving, setIsSaving] = useState(false);
  
  // 保存済みデータがあるかどうかのフラグ
  const [hasSavedData, setHasSavedData] = useState(false);
  
  // 前回の保存時刻
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  
  // チャット表示部分の参照
  const chatContainerRef = useRef<HTMLDivElement>(null);
  
  // デバッグモード（開発環境のみ）
  const isDebugMode = false; // デバッグモードを無効化
  
  // 自動保存タイマー参照
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 初回ロード時に保存データを確認
  useEffect(() => {
    const loadSavedProgress = async () => {
      if (userId) {
        try {
          const { data, error } = await getChatbotProgress(userId);
          
          if (error) {
            console.error('保存データの取得に失敗しました:', error);
            return;
          }
          
          if (data && data.progress_data) {
            // 保存データが存在する
            setHasSavedData(true);
            
            // 最終更新時刻を表示用に整形
            const savedDate = new Date(data.updated_at);
            const formattedDate = savedDate.toLocaleString('ja-JP');
            setLastSavedTime(formattedDate);
            
            // メールアドレスからの復元の場合は、自動的にデータを読み込む
            if (messages.length === 0) {
              const progressData = data.progress_data;
              
              // 状態を復元
              setCollectedData(progressData.collectedData || {});
              setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
              setProcessedQuestionIds(new Set(progressData.processedQuestionIds || []));
              setMessages(progressData.messages || []);
            }
          }
        } catch (err) {
          console.error('保存データの確認中にエラーが発生しました:', err);
        }
      }
    };
    
    loadSavedProgress();
  }, [userId, messages.length]);
  
  // 初期メッセージを表示
  useEffect(() => {
    if (!hasSavedData) {
      // 保存データがない場合は通常通り初期化
      // 状態をリセット
      setCurrentQuestionIndex(0);
      setProcessedQuestionIds(new Set());
      setCollectedData({});
      
      // 最初のメッセージを表示
      setMessages([
        {
          sender: 'bot',
          text: `こんにちは、${userName}さん！診断に必要な情報を教えてください。`
        }
      ]);
      
      // 最初の質問を送信（遅延を長く）
      const timer = setTimeout(() => {
        // 初期化メッセージが表示された後に質問を開始
        askNextQuestion();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [userName, hasSavedData]); // hasSavedDataを依存関係に追加
  
  // 自動保存の設定（10秒ごとに保存）
  useEffect(() => {
    // ユーザーIDがない場合や回答がない場合は自動保存しない
    if (!userId || Object.keys(collectedData).length === 0) {
      return;
    }
    
    // 既存のタイマーをクリア
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
    }
    
    // 新しいタイマーをセット（30秒ごと）
    autoSaveTimerRef.current = setInterval(() => {
      saveProgress();
    }, 30000);
    
    // クリーンアップ
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
      }
    };
  }, [userId, collectedData]);
  
  // 保存処理関数
  const saveProgress = async () => {
    if (!userId || Object.keys(collectedData).length === 0) {
      return;
    }
    
    try {
      setIsSaving(true);
      
      // 保存するデータを準備
      const progressData = {
        collectedData,
        currentQuestionIndex,
        processedQuestionIds: Array.from(processedQuestionIds),
        messages
      };
      
      // データを保存
      const { data, error } = await saveChatbotProgress(userId, progressData);
      
      if (error) {
        console.error('チャットボットの進行状況の保存に失敗しました:', error);
      } else {
        // 保存成功
        setHasSavedData(true);
        // 最終更新時刻を表示用に整形
        const now = new Date();
        const formattedTime = now.toLocaleString('ja-JP');
        setLastSavedTime(formattedTime);
      }
    } catch (err) {
      console.error('保存処理中にエラーが発生しました:', err);
    } finally {
      setIsSaving(false);
    }
  };
  
  // 保存データを復元する関数
  const loadSavedData = async () => {
    if (!userId) {
      return;
    }
    
    try {
      const { data, error } = await getChatbotProgress(userId);
      
      if (error) {
        console.error('保存データの取得に失敗しました:', error);
        return;
      }
      
      if (data && data.progress_data) {
        const progressData = data.progress_data;
        
        // 状態を復元
        setCollectedData(progressData.collectedData || {});
        setCurrentQuestionIndex(progressData.currentQuestionIndex || 0);
        setProcessedQuestionIds(new Set(progressData.processedQuestionIds || []));
        setMessages(progressData.messages || []);
        
        // 最終更新時刻を表示用に整形
        const savedDate = new Date(data.updated_at);
        const formattedDate = savedDate.toLocaleString('ja-JP');
        setLastSavedTime(formattedDate);
        
        // 保存データがある状態にする
        setHasSavedData(true);
      }
    } catch (err) {
      console.error('保存データの復元中にエラーが発生しました:', err);
    }
  };
  
  // 次の質問を表示する関数の参照を保持（依存関係の問題を解決）
  const askNextQuestionRef = useRef<() => void>();
  
  // 参照を更新
  useEffect(() => {
    askNextQuestionRef.current = () => {
      // ここにaskNextQuestionのロジックをコピー
      // デバッグ情報を出力
      if (isDebugMode) {
        console.log('現在の質問インデックス:', currentQuestionIndex);
        console.log('処理済み質問IDs:', Array.from(processedQuestionIds));
        console.log('収集データ:', collectedData);
      }
      
      // 質問がまだ残っているか確認
      if (currentQuestionIndex >= QUESTIONS.length) {
        // すべての質問が終了した場合
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: '質問は以上です。ありがとうございました！診断結果を計算します。'
          }
        ]);
        
        // 収集したデータを親コンポーネントに渡す
        setTimeout(() => {
          onComplete(collectedData);
        }, 1500);
        return;
      }
  
      // ローカル変数に現在の質問インデックスをコピー
      const currentIndex = currentQuestionIndex;
      const currentQuestion = QUESTIONS[currentIndex];
      
      // 安全対策：質問が存在しない場合はスキップ
      if (!currentQuestion) {
        console.error(`質問インデックス ${currentIndex} に対応する質問が見つかりません`);
        setCurrentQuestionIndex(prev => prev + 1);
        setTimeout(() => {
          if (askNextQuestionRef.current) askNextQuestionRef.current();
        }, 200);
        return;
      }
  
      try {
        if (isDebugMode) {
          console.log(`処理中の質問: ${currentQuestion.id}, ${currentQuestion.text}`);
        }
        
        // 条件付き質問をチェック
        if (currentQuestion.condition) {
          let conditionResult = false;
          
          try {
            // データをデバッグ出力
            if (isDebugMode) {
              console.log(`条件付き質問 ${currentQuestion.id} の評価データ:`, JSON.stringify(collectedData));
            }
            
            conditionResult = currentQuestion.condition(collectedData);
          } catch (error) {
            console.error(`条件評価エラー（質問ID: ${currentQuestion.id}）:`, error);
            // エラー時はfalseとして扱う
          }
          
          if (isDebugMode) {
            console.log(`質問ID: ${currentQuestion.id}, 条件評価結果: ${conditionResult}`);
          }
          
          if (!conditionResult) {
            // 条件を満たさない場合は次の質問に進む（状態更新後に再帰呼び出し）
            setCurrentQuestionIndex(currentIndex + 1);
            setTimeout(() => {
              if (askNextQuestionRef.current) askNextQuestionRef.current();
            }, 200);
            return;
          }
        }
        
        // この質問IDがすでに処理済みかチェック
        if (processedQuestionIds.has(currentQuestion.id)) {
          if (isDebugMode) {
            console.log(`質問ID: ${currentQuestion.id} はすでに処理済み、スキップします`);
          }
          setCurrentQuestionIndex(currentIndex + 1);
          setTimeout(() => {
            if (askNextQuestionRef.current) askNextQuestionRef.current();
          }, 200);
          return;
        }
        
        if (isDebugMode) {
          console.log(`次の質問を表示: ${currentQuestion.id}`, currentQuestion.text);
        }
        
        // 質問を表示
        const newMessage: ChatMessage = {
          sender: 'bot',
          text: currentQuestion.text,
        };
        
        // 選択肢がある場合は追加
        if (currentQuestion.inputType === 'select' && currentQuestion.options) {
          newMessage.options = currentQuestion.options;
          newMessage.fieldName = currentQuestion.fieldName || undefined;
        } else if (currentQuestion.fieldName) {
          newMessage.inputType = currentQuestion.inputType || undefined;
          newMessage.fieldName = currentQuestion.fieldName;
        }
        
        // 処理済み質問IDに追加（新しいSetオブジェクトを作成）
        const newProcessedIds = new Set(processedQuestionIds);
        newProcessedIds.add(currentQuestion.id);
        
        // 状態更新を順番に行う（バッチ更新されないように分離）
        setMessages(prev => [...prev, newMessage]);
        
        // タイミングをずらして更新
        setTimeout(() => {
          setProcessedQuestionIds(newProcessedIds);
          setTimeout(() => {
            setCurrentQuestionIndex(currentIndex + 1);
          }, 50);
        }, 50);
        
      } catch (error) {
        console.error("質問処理エラー:", error);
        // エラー発生時は次の質問に進む
        setCurrentQuestionIndex(currentIndex + 1);
        setTimeout(() => {
          if (askNextQuestionRef.current) askNextQuestionRef.current();
        }, 300);
      }
    };
  }, [currentQuestionIndex, processedQuestionIds, collectedData, isDebugMode, onComplete]);
  
  // 外部から呼び出す用の関数
  const askNextQuestion = () => {
    if (askNextQuestionRef.current) {
      askNextQuestionRef.current();
    }
  };
  
  // チャットが更新されたらスクロールを一番下に
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);
  
  // ユーザーの回答を処理
  const handleUserAnswer = (answer: string, fieldName?: string) => {
    // 回答処理前にデバッグ情報を出力
    if (isDebugMode) {
      console.log(`回答処理開始: ${answer}, フィールド: ${fieldName || 'なし'}`);
      console.log('現在の質問インデックス:', currentQuestionIndex);
      console.log('処理済み質問IDs:', Array.from(processedQuestionIds));
    }
    
    // ユーザーの回答をチャットに追加
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: answer }
    ]);
    
    // フィールド名があれば、データを収集（同期的に更新）
    if (fieldName) {
      const updatedData = {
        ...collectedData,
        [fieldName]: answer
      };
      
      // 状態を更新
      setCollectedData(updatedData);
      
      if (isDebugMode) {
        console.log(`回答を保存: ${fieldName} = ${answer}`);
        console.log('更新後のデータ:', updatedData);
      }
      
      // 回答が保存されたら自動保存（ただし間隔を制限）
      if (userId) {
        // 手動保存をトリガー
        setTimeout(() => {
          saveProgress();
        }, 300);
      }
      
      // 次の質問を表示（遅延を長くする）
      setTimeout(() => {
        if (currentQuestionIndex < QUESTIONS.length) {
          // askNextQuestionRef を使用
          if (askNextQuestionRef.current) {
            askNextQuestionRef.current();
          }
        } else {
          // すべての質問が終わった場合
          setMessages(prev => [
            ...prev,
            {
              sender: 'bot',
              text: '質問は以上です。ありがとうございました！診断結果を計算します。'
            }
          ]);
          
          // 収集したデータを親コンポーネントに渡す
          setTimeout(() => {
            onComplete(updatedData); // 最新のデータを使用
          }, 1000);
        }
      }, 800);
    } else {
      // フィールド名がない場合も次の質問へ進む
      setTimeout(() => {
        if (currentQuestionIndex < QUESTIONS.length) {
          // askNextQuestionRef を使用
          if (askNextQuestionRef.current) {
            askNextQuestionRef.current();
          }
        } else {
          onComplete(collectedData);
        }
      }, 800);
    }
  };
  
  // メッセージ送信ハンドラ
  const handleMessageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputMessage.trim()) return;
    
    // 最後のボットメッセージからフィールド名を取得
    const lastBotMessage = [...messages].reverse().find(m => m.sender === 'bot');
    const fieldName = lastBotMessage?.fieldName;
    
    handleUserAnswer(inputMessage, fieldName);
    setInputMessage('');
  };
  
  // 選択肢ボタンクリックハンドラ
  const handleOptionClick = (option: string, fieldName?: string) => {
    handleUserAnswer(option, fieldName);
  };
  
  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md flex flex-col h-[70vh]">
      {/* チャットヘッダー */}
      <div className="bg-blue-600 text-white p-4 rounded-t-lg flex justify-between items-center">
        <h2 className="text-xl font-semibold">AI住宅予算診断 チャットボット</h2>
        
        {/* 保存状態表示 */}
        {userId && (
          <div className="text-sm">
            {isSaving ? (
              <span className="animate-pulse">保存中...</span>
            ) : lastSavedTime ? (
              <span>最終保存: {lastSavedTime}</span>
            ) : null}
          </div>
        )}
      </div>
      
      {/* 保存データ復元オプション - メールからの復元の場合は非表示 */}
      {hasSavedData && messages.length === 0 && !userId && (
        <div className="bg-yellow-100 p-4 border-b border-yellow-200">
          <p>前回の回答データが保存されています。復元しますか？</p>
          <div className="mt-2 flex gap-2">
            <Button onClick={loadSavedData}>
              復元する
            </Button>
            <Button variant="outline" onClick={() => {
              // 新しく始める（保存データは無視）
              setHasSavedData(false);
              // 最初のメッセージを表示
              setMessages([
                {
                  sender: 'bot',
                  text: `こんにちは、${userName}さん！診断に必要な情報を教えてください。`
                }
              ]);
              
              // 最初の質問を送信
              setTimeout(() => {
                askNextQuestion();
              }, 1000);
            }}>
              新しく始める
            </Button>
          </div>
        </div>
      )}
      
      {/* チャット表示エリア */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((message, index) => (
          <div 
            key={index} 
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div 
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user' 
                  ? 'bg-blue-500 text-white rounded-br-none' 
                  : 'bg-gray-100 text-gray-800 rounded-bl-none'
              }`}
            >
              <p>{message.text}</p>
              
              {/* 選択肢ボタン表示 */}
              {message.options && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {message.options.map((option, optIndex) => (
                    <button
                      key={optIndex}
                      className="bg-white text-blue-600 px-3 py-1 rounded-full text-sm border border-blue-300 hover:bg-blue-50"
                      onClick={() => handleOptionClick(option, message.fieldName)}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {/* 入力エリア */}
      <form onSubmit={handleMessageSubmit} className="p-4 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-full px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            type="text"
            placeholder="メッセージを入力..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            disabled={currentQuestionIndex >= QUESTIONS.length}
          />
          <Button 
            type="submit"
            disabled={!inputMessage.trim() || currentQuestionIndex >= QUESTIONS.length}
          >
            送信
          </Button>
        </div>
        
        <div className="mt-2 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            戻る
          </Button>
          
          {/* 手動保存ボタン */}
          {userId && Object.keys(collectedData).length > 0 && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={saveProgress}
              disabled={isSaving}
            >
              {isSaving ? '保存中...' : '途中保存'}
            </Button>
          )}
          
          {isDebugMode && (
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                // デモデータを作成
                const demoData = {
                  age: '30代前半',
                  familySize: '3人',
                  annualIncome: '700〜1,000万円',
                  headOfHouseholdAge: '30代後半',
                  hasSpouse: 'はい',
                  spouseAge: '30代前半',
                  childrenCount: '1人',
                  childrenAges: '未就学児',
                  planToHaveMoreChildren: 'いいえ',
                  spouseIncome: '300〜500万円',
                  maternityLeavePlan: 'いいえ',
                  savings: '500〜1,000万円',
                  financialAssets: '1,000〜2,000万円',
                  hasRetirementBonus: 'はい',
                  retirementBonusAmount: '1,000〜2,000万円',
                  planToSellHouse: 'いいえ',
                  mortgageLoanBalance: 'なし',
                  monthlyMortgagePayment: 'なし',
                  otherDebts: 'なし',
                  currentRent: '10〜15万円',
                  currentInsurance: '2〜3万円',
                  monthlyLivingExpenses: '15〜20万円',
                  hobbyExpenses: '1〜3万円',
                  travelFrequency: '2〜3年に1回',
                  educationPolicy: '公立中心',
                  retirementAge: '65歳',
                  loanYears: '35年',
                  expectedInterestRate: '1.0〜1.5%'
                };
                
                // すべての質問に回答したようにメッセージを追加
                setMessages(prev => [
                  ...prev,
                  { sender: 'bot', text: 'デバッグモード: 自動入力が完了しました。' }
                ]);
                
                // 収集データを設定
                setCollectedData(demoData);
                
                // 次のステップへ進む
                setTimeout(() => onComplete(demoData), 1000);
              }}
            >
              デバッグ: スキップ
            </Button>
          )}
        </div>
      </form>
      
      {isDebugMode && (
        <div className="mt-4 p-4 bg-gray-100 rounded border border-gray-300">
          <h3 className="font-bold text-sm">デバッグ情報:</h3>
          <div className="text-xs mt-2 overflow-auto max-h-60">
            <p>現在の質問インデックス: {currentQuestionIndex} / 質問数: {QUESTIONS.length}</p>
            <p>現在の質問ID: {currentQuestionIndex < QUESTIONS.length ? QUESTIONS[currentQuestionIndex].id : '完了'}</p>
            <p>処理済み質問IDs: {Array.from(processedQuestionIds).join(', ')}</p>
            <p>回答データ:</p>
            <pre>{JSON.stringify(collectedData, null, 2)}</pre>
            <p>メッセージ数: {messages.length}</p>
            <details>
              <summary>条件付き質問の状態</summary>
              <div className="p-2 bg-white mt-1 rounded text-xs">
                {QUESTIONS.filter(q => q.condition).map((q, i) => (
                  <div key={i} className="mb-1">
                    <p>質問: {q.text}</p>
                    <p>ID: {q.id}</p>
                    <p>表示: {
                      (() => {
                        try {
                          return q.condition && q.condition(collectedData) ? '✅ 表示' : '❌ 非表示';
                        } catch (e) {
                          return '⚠️ エラー';
                        }
                      })()
                    }</p>
                  </div>
                ))}
              </div>
            </details>
            <div className="mt-2 flex flex-wrap gap-2">
              <button 
                className="bg-red-500 text-white px-2 py-1 rounded text-xs"
                onClick={() => {
                  // 手動で次の質問に進む
                  const nextIndex = currentQuestionIndex + 1;
                  setCurrentQuestionIndex(nextIndex);
                  setTimeout(() => {
                    if (nextIndex < QUESTIONS.length && askNextQuestionRef.current) {
                      askNextQuestionRef.current();
                    }
                  }, 200);
                }}
              >
                次の質問へ強制移動
              </button>
              <button 
                className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
                onClick={() => {
                  // 現在の質問を再処理
                  if (askNextQuestionRef.current) {
                    askNextQuestionRef.current();
                  }
                }}
              >
                現在の質問を再処理
              </button>
              <button 
                className="bg-green-500 text-white px-2 py-1 rounded text-xs"
                onClick={() => {
                  // 診断を完了し結果に進む
                  onComplete(collectedData);
                }}
              >
                診断完了（結果へ）
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotStep; 