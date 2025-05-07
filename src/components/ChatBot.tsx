'use client'

import { useState, useRef, useEffect } from 'react'
import { supabase } from '../lib/supabase'

type Message = {
  id: number
  content: string
  sender: 'bot' | 'user'
  options?: string[]
}

export default function ChatBot({ userId }: { userId: string }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // チャットの初期化
  useEffect(() => {
    // 挨拶メッセージを表示
    setMessages([
      {
        id: 1,
        content: 'こんにちは！安心予算AI診断へようこそ。いくつかの質問に答えていただくことで、あなたの家計状況を診断します。準備はよろしいですか？',
        sender: 'bot',
        options: ['はい、始めましょう', 'どのような質問がありますか？']
      }
    ])
  }, [])

  // メッセージが追加されたらスクロールダウン
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // チャットメッセージの送信
  const handleSendMessage = async (content: string = input) => {
    if (!content.trim()) return

    // ユーザーのメッセージを追加
    const userMessage: Message = {
      id: messages.length + 1,
      content,
      sender: 'user'
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)

    try {
      // メッセージをSupabaseに保存
      try {
        await supabase.from('chat_logs').insert({
          user_id: userId,
          message: content,
          is_from_user: true
        })
      } catch (error) {
        console.warn('Supabaseへのメッセージ保存に失敗しました:', error)
        // エラーが発生しても処理を続行
      }

      // AIの応答を生成（簡易版として固定の応答パターン）
      let botResponse: Message

      // 初期質問への応答
      if (messages.length === 1) {
        botResponse = {
          id: messages.length + 2,
          content: 'ありがとうございます。まずはあなたの収入について教えてください。毎月の手取り収入はどのくらいですか？',
          sender: 'bot'
        }
      } else if (messages.length === 3) {
        botResponse = {
          id: messages.length + 2,
          content: '次に、毎月の固定支出（家賃・住宅ローン、水道光熱費、通信費など）の合計はいくらくらいですか？',
          sender: 'bot'
        }
      } else if (messages.length === 5) {
        botResponse = {
          id: messages.length + 2,
          content: '現在の貯蓄額はどのくらいですか？',
          sender: 'bot'
        }
      } else if (messages.length === 7) {
        botResponse = {
          id: messages.length + 2,
          content: '最後に、投資や資産運用をされていますか？',
          sender: 'bot',
          options: ['はい、している', 'いいえ、していない', '検討中です']
        }
      } else if (messages.length === 9) {
        botResponse = {
          id: messages.length + 2,
          content: 'ありがとうございます。回答に基づいた診断結果を表示します。詳細なシミュレーションを行いますか？',
          sender: 'bot',
          options: ['はい、詳細を見たい', 'いいえ、今回は結果だけで十分です']
        }
      } else {
        botResponse = {
          id: messages.length + 2,
          content: 'ご回答ありがとうございます。さらに詳細な分析をご希望の場合は、FP相談をお申し込みください。',
          sender: 'bot'
        }
      }

      // ボットの応答をSupabaseに保存
      try {
        await supabase.from('chat_logs').insert({
          user_id: userId,
          message: botResponse.content,
          is_from_user: false
        })
      } catch (error) {
        console.warn('Supabaseへのボット応答保存に失敗しました:', error)
        // エラーが発生しても処理を続行
      }

      // ボットの応答をチャットに追加
      setMessages(prev => [...prev, botResponse])
    } catch (error) {
      console.error('Error sending message:', error)
      
      // エラー発生時にもユーザーに応答を返す
      const errorResponse: Message = {
        id: messages.length + 2,
        content: 'すみません、エラーが発生しました。もう一度お試しいただくか、後ほどお試しください。',
        sender: 'bot'
      }
      setMessages(prev => [...prev, errorResponse])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-[600px] bg-gray-50 rounded-lg shadow-md">
      {/* チャットメッセージ表示エリア */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white border border-gray-200'
              }`}
            >
              <p>{message.content}</p>
              
              {/* 選択肢オプションがある場合、ボタンとして表示 */}
              {message.options && (
                <div className="mt-2 flex flex-col space-y-2">
                  {message.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(option)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded text-sm text-left"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      {/* メッセージ入力エリア */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="メッセージを入力..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-gray-800 text-white rounded-md hover:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-700 disabled:opacity-50"
          >
            {isLoading ? '送信中...' : '送信'}
          </button>
        </div>
      </div>
    </div>
  )
} 