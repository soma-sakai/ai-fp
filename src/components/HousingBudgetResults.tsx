'use client'

import { useState, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { Document, Page, Text, View, StyleSheet, PDFDownloadLink } from '@react-pdf/renderer'
import { supabase } from '../lib/supabase'

// Chart.jsの設定
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

// PDFスタイルの定義
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30
  },
  section: {
    margin: 10,
    padding: 10
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 18,
    marginTop: 15,
    marginBottom: 10
  },
  text: {
    fontSize: 12,
    marginBottom: 5
  },
  bold: {
    fontWeight: 'bold'
  },
  table: {
    display: 'flex',
    flexDirection: 'column',
    marginTop: 10,
    marginBottom: 10
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#DDDDDD',
    paddingBottom: 3,
    paddingTop: 3
  },
  tableHeader: {
    fontWeight: 'bold'
  },
  tableCol: {
    flex: 1,
    fontSize: 10
  }
})

// PDFレポート用コンポーネント
const BudgetPDF = ({ results }: { results: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>安心住宅予算診断結果</Text>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>あなたの住宅予算ライン</Text>
        <Text style={styles.text}>🔴 MAXライン：{(results.maxLine / 10000).toFixed(0)}万円</Text>
        <Text style={styles.text}>🟡 妥当ライン：{(results.reasonableLine / 10000).toFixed(0)}万円</Text>
        <Text style={styles.text}>🟢 安全ライン：{(results.safeLine / 10000).toFixed(0)}万円</Text>
        <Text style={styles.text}>※このラインから頭金を引いた額が、借入目安額となります。</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>月々の返済額目安</Text>
        <Text style={styles.text}>MAXライン：{Math.round(results.monthlyPayment.max).toLocaleString()}円</Text>
        <Text style={styles.text}>妥当ライン：{Math.round(results.monthlyPayment.reasonable).toLocaleString()}円</Text>
        <Text style={styles.text}>安全ライン：{Math.round(results.monthlyPayment.safe).toLocaleString()}円</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.subtitle}>基本情報</Text>
        <Text style={styles.text}>年齢: {results.inputData.userAge}歳</Text>
        <Text style={styles.text}>年収: {Number(results.inputData.userIncome).toLocaleString()}円</Text>
        {results.inputData.hasSpouse === 'はい' && (
          <Text style={styles.text}>配偶者年収: {Number(results.inputData.spouseIncome).toLocaleString()}円</Text>
        )}
        <Text style={styles.text}>現在の貯蓄額: {Number(results.inputData.savings).toLocaleString()}円</Text>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.text}>※このシミュレーションは現在の状況から予測されるものであり、将来の確実な予測ではありません。</Text>
        <Text style={styles.text}>※より詳細な分析や個別のアドバイスについては、FP相談をご利用ください。</Text>
      </View>
    </Page>
  </Document>
)

// 結果表示コンポーネント
export default function HousingBudgetResults({ results }: { results: any }) {
  const [activeTab, setActiveTab] = useState('summary')
  const chartRef = useRef<any>(null)
  
  // 月々の返済額比較グラフ
  const paymentChartData = {
    labels: ['MAXライン', '妥当ライン', '安全ライン'],
    datasets: [
      {
        label: '月々の返済額（円）',
        data: [
          Math.round(results.monthlyPayment.max),
          Math.round(results.monthlyPayment.reasonable),
          Math.round(results.monthlyPayment.safe)
        ],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  }
  
  // 5年間の貯蓄推移予測（仮のデータ、実際は計算が必要）
  const generateSavingsData = () => {
    // 簡易的な貯蓄額推移予測（実際はより詳細な計算が必要）
    const monthlySaving = (Number(results.inputData.userIncome) + Number(results.inputData.spouseIncome || 0)) / 12 * 0.2
    const dataMax = []
    const dataReasonable = []
    const dataSafe = []
    
    let savingsMax = Number(results.inputData.savings)
    let savingsReasonable = Number(results.inputData.savings)
    let savingsSafe = Number(results.inputData.savings)
    
    // 5年（60ヶ月）のシミュレーション
    for (let i = 0; i <= 60; i++) {
      // 各ライン別の毎月の貯蓄残高を計算
      savingsMax = savingsMax + monthlySaving - results.monthlyPayment.max
      savingsReasonable = savingsReasonable + monthlySaving - results.monthlyPayment.reasonable
      savingsSafe = savingsSafe + monthlySaving - results.monthlyPayment.safe
      
      // 6ヶ月ごとにデータを記録
      if (i % 6 === 0) {
        dataMax.push(Math.max(0, savingsMax))
        dataReasonable.push(Math.max(0, savingsReasonable))
        dataSafe.push(Math.max(0, savingsSafe))
      }
    }
    
    return {
      labels: ['現在', '6ヶ月後', '1年後', '1年半後', '2年後', '2年半後', '3年後', '3年半後', '4年後', '4年半後', '5年後'],
      datasets: [
        {
          label: 'MAXライン',
          data: dataMax,
          borderColor: 'rgb(255, 99, 132)',
          backgroundColor: 'rgba(255, 99, 132, 0.5)',
          tension: 0.1
        },
        {
          label: '妥当ライン',
          data: dataReasonable,
          borderColor: 'rgb(255, 206, 86)',
          backgroundColor: 'rgba(255, 206, 86, 0.5)',
          tension: 0.1
        },
        {
          label: '安全ライン',
          data: dataSafe,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.5)',
          tension: 0.1
        }
      ]
    }
  }
  
  const savingsChartData = generateSavingsData()
  
  // PDFダウンロードを記録
  const handleDownloadPDF = async () => {
    try {
      await supabase.from('user_actions').insert({
        user_id: results.inputData.userId,
        action: 'budget_pdf_download',
        created_at: new Date().toISOString()
      })
    } catch (error) {
      console.error('Error logging PDF download:', error)
    }
  }
  
  // FP相談予約ボタンクリック時の処理
  const handleBookConsultation = async () => {
    try {
      await supabase.from('user_actions').insert({
        user_id: results.inputData.userId,
        action: 'budget_to_consultation',
        created_at: new Date().toISOString()
      })
      
      // 相談予約ページへ遷移
      window.location.href = '/consultation'
    } catch (error) {
      console.error('Error logging consultation redirect:', error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-center">住宅予算診断結果</h2>
      
      {/* タブナビゲーション */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          概要
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'payment' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('payment')}
        >
          返済額比較
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'savings' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('savings')}
        >
          貯蓄推移
        </button>
      </div>
      
      {/* 概要タブ */}
      {activeTab === 'summary' && (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="p-4 border-l-4 border-red-500 bg-red-50 rounded-r-lg">
              <p className="text-sm text-gray-500">MAXライン</p>
              <p className="text-2xl font-bold text-gray-800">{(results.maxLine / 10000).toFixed(0)}万円</p>
              <p className="text-xs text-gray-500">返済負担率：年収の30%</p>
            </div>
            <div className="p-4 border-l-4 border-yellow-500 bg-yellow-50 rounded-r-lg">
              <p className="text-sm text-gray-500">妥当ライン</p>
              <p className="text-2xl font-bold text-gray-800">{(results.reasonableLine / 10000).toFixed(0)}万円</p>
              <p className="text-xs text-gray-500">返済負担率：年収の25%</p>
            </div>
            <div className="p-4 border-l-4 border-green-500 bg-green-50 rounded-r-lg">
              <p className="text-sm text-gray-500">安全ライン</p>
              <p className="text-2xl font-bold text-gray-800">{(results.safeLine / 10000).toFixed(0)}万円</p>
              <p className="text-xs text-gray-500">返済負担率：年収の20%</p>
            </div>
          </div>
          
          <div className="mb-6 p-4 bg-green-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">診断結果の説明</h3>
            <p className="mb-2">
              あなたの住宅予算の目安は上記の3つのラインで表されます。これらの金額から頭金
              {Number(results.inputData.downPayment).toLocaleString()}円を引いた額が、住宅ローンの借入目安となります。
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li>MAXライン：これ以上の予算は家計を圧迫するリスクが高まります</li>
              <li>妥当ライン：バランスの取れた予算で家計にも余裕があります</li>
              <li>安全ライン：将来の変化にも対応できる余裕のある予算です</li>
            </ul>
            <p className="mt-2 text-sm">
              ※この診断は「購入後5年間で貯蓄残高がマイナスにならないこと」「老後資金目標額は1人あたり2,000万円を確保」という基準に基づいています。
            </p>
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-2">月々の返済額目安</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">予算ライン</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">月々の返済額</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年間の返済額</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">返済負担率</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-2 text-sm">MAXライン</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.max).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.max * 12).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">30%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">妥当ライン</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.reasonable).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.reasonable * 12).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">25%</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm">安全ライン</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.safe).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">{Math.round(results.monthlyPayment.safe * 12).toLocaleString()}円</td>
                    <td className="px-4 py-2 text-sm">20%</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <PDFDownloadLink 
              document={<BudgetPDF results={results} />} 
              fileName="安心住宅予算診断結果.pdf"
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={handleDownloadPDF}
            >
              {({ loading }: { loading: boolean }) =>
                loading ? 'PDF生成中...' : 'PDFレポートをダウンロード'
              }
            </PDFDownloadLink>
            
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              onClick={handleBookConsultation}
            >
              FP相談を予約する
            </button>
          </div>
        </div>
      )}
      
      {/* 返済額比較タブ */}
      {activeTab === 'payment' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">月々の返済額比較</h3>
          <p className="mb-4">
            このグラフは3つの予算ラインにおける月々の住宅ローン返済額を比較しています。
            あなたの家計に無理のない返済額を選ぶことが重要です。
          </p>
          <div className="h-96">
            <Bar
              ref={chartRef}
              data={paymentChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '月々の返済額（円）'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}円`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: '返済額（円）'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 bg-blue-50 p-4 rounded">
            <h4 className="font-semibold mb-2">ポイント</h4>
            <p>
              住宅ローンの返済額は、家計全体のバランスの中で適切に設定することが重要です。
              返済負担率が高すぎると、日常の生活費や将来のための貯蓄が圧迫され、
              予期せぬ出費が発生した場合に対応できなくなるリスクがあります。
            </p>
          </div>
        </div>
      )}
      
      {/* 貯蓄推移タブ */}
      {activeTab === 'savings' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">5年間の貯蓄推移予測</h3>
          <p className="mb-4">
            このグラフは住宅購入後5年間の貯蓄残高の推移予測を示しています。
            住宅ローン返済後も十分な貯蓄が維持できるかをチェックしましょう。
          </p>
          <div className="h-96">
            <Line
              data={savingsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '貯蓄残高推移（円）'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toLocaleString()}円`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: '貯蓄残高（円）'
                    }
                  }
                }
              }}
            />
          </div>
          <div className="mt-4 bg-yellow-50 p-4 rounded">
            <h4 className="font-semibold mb-2">判断基準</h4>
            <p>
              購入後5年間で貯蓄残高がマイナスになっていないことが重要な判断基準です。
              緊急時や将来のための資金が確保できているか、グラフの推移から確認してください。
              安全ラインであれば、十分な貯蓄を維持しながら住宅購入が可能です。
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 