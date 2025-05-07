'use client'

import { useState, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js'
import { Line } from 'react-chartjs-2'
import { SimulationResult, SimulationInput } from '../lib/simulationEngine'
import { supabase } from '../lib/supabase'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// Chart.jsの設定
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

// シミュレーション結果表示コンポーネント
export default function SimulationResults({ 
  simulationResult, 
  userId,
  userInfo
}: { 
  simulationResult: SimulationResult, 
  userId: string,
  userInfo: SimulationInput
}) {
  const [activeTab, setActiveTab] = useState('summary')
  const chartRef = useRef(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // 年齢データの抽出
  const ages = simulationResult.baseScenario.map(data => `${data.age}歳`)
  
  // 資産推移グラフデータの作成
  const assetsChartData = {
    labels: ages,
    datasets: [
      {
        label: '現状維持',
        data: simulationResult.baseScenario.map(data => data.totalAssets / 10000), // 万円単位
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: '支出10%削減',
        data: simulationResult.savingScenario.map(data => data.totalAssets / 10000), // 万円単位
        borderColor: 'rgb(54, 162, 235)',
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
      },
      {
        label: '投資実行',
        data: simulationResult.investmentScenario.map(data => data.totalAssets / 10000), // 万円単位
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.5)',
      },
    ],
  }
  
  // 収支推移グラフデータの作成
  const balanceChartData = {
    labels: ages,
    datasets: [
      {
        label: '年間収入（現状維持）',
        data: simulationResult.baseScenario.map(data => data.yearlyIncome / 10000), // 万円単位
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
      {
        label: '年間支出（現状維持）',
        data: simulationResult.baseScenario.map(data => data.yearlyExpenses / 10000), // 万円単位
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
      },
    ],
  }

  // PDFダウンロード処理
  const handleDownloadPDF = async () => {
    try {
      if (!resultRef.current) return;
      
      setIsGeneratingPdf(true);
      
      // ユーザーアクションを記録
      await supabase.from('user_actions').insert({
        user_id: userId,
        action: 'pdf_download',
        created_at: new Date().toISOString()
      });
      
      // 現在のタブを一時保存
      const originalTab = activeTab;
      // サマリータブに切り替え
      setActiveTab('summary');
      
      // 少し待ってDOM更新を確実にする
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // HTML2Canvasでキャンバスに変換
      const canvas = await html2canvas(resultRef.current, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });
      
      // キャンバスのサイズを取得
      const imgWidth = 210; // A4幅（mm）
      const pageHeight = 297; // A4高さ（mm）
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // 複数ページに分割する必要があるか確認
      const pdfDoc = new jsPDF('p', 'mm', 'a4');
      let position = 0;
      
      // 1ページに収まらない場合は複数ページに分割
      while (position < imgHeight) {
        // 新しいページでない場合（最初のページを除く）
        if (position > 0) {
          pdfDoc.addPage();
        }
        
        // データURLからイメージを取得
        const imgData = canvas.toDataURL('image/jpeg', 1.0);
        
        // 現在のページにイメージの一部を追加
        pdfDoc.addImage(
          imgData, 'JPEG', 
          0, -position, // x, y座標
          imgWidth, imgHeight // 幅、高さ
        );
        
        // 次のページのための位置を更新
        position += pageHeight;
      }
      
      // PDFをダウンロード
      pdfDoc.save("安心予算シミュレーション結果.pdf");
      
      // 元のタブに戻す
      setActiveTab(originalTab);
      
    } catch (error) {
      console.error('PDFの生成中にエラーが発生しました:', error);
      alert('PDFの生成中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsGeneratingPdf(false);
    }
  };
  
  // FP相談予約ボタンクリック時の処理
  const handleBookConsultation = async () => {
    try {
      await supabase.from('user_actions').insert({
        user_id: userId,
        action: 'book_consultation',
        created_at: new Date().toISOString()
      });
      
      // ここでは単純にログを記録しますが、実際の予約ページへの遷移などを追加
      alert('FP相談予約フォームに移動します');
    } catch (error) {
      console.error('Error logging consultation booking:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-4" ref={resultRef}>
      <h2 className="text-2xl font-bold mb-6 text-center">シミュレーション結果</h2>
      
      {/* タブナビゲーション */}
      <div className="flex border-b mb-6">
        <button
          className={`px-4 py-2 ${activeTab === 'summary' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('summary')}
        >
          概要
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'assets' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('assets')}
        >
          資産推移
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'balance' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('balance')}
        >
          収支推移
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'data' ? 'border-b-2 border-blue-500 text-blue-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('data')}
        >
          詳細データ
        </button>
      </div>
      
      {/* 概要タブ */}
      {activeTab === 'summary' && (
        <div>
          <div className={`mb-6 p-4 rounded-lg border ${
            simulationResult.riskLevel === '安全' ? 'bg-green-100 text-green-800 border-green-200' :
            simulationResult.riskLevel === '注意' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
            'bg-red-100 text-red-800 border-red-200'
          }`}>
            <h3 className="text-xl font-semibold mb-2">診断結果: {simulationResult.riskLevel}</h3>
            <p className="whitespace-pre-line">{simulationResult.summaryText}</p>
          </div>
          
          <div className="mb-6 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">あなたへのアドバイス</h3>
            <ul className="list-disc pl-5 space-y-2">
              {simulationResult.advicePoints.map((advice, index) => (
                <li key={index}>{advice}</li>
              ))}
            </ul>
          </div>
          
          <div className="flex justify-center space-x-4 mt-8">
            <button
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-70 disabled:cursor-not-allowed"
              onClick={handleDownloadPDF}
              disabled={isGeneratingPdf}
            >
              {isGeneratingPdf ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  PDF生成中...
                </span>
              ) : 'PDFレポートをダウンロード'}
            </button>
            
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              onClick={handleBookConsultation}
            >
              FP相談を予約する
            </button>
          </div>
        </div>
      )}
      
      {/* 資産推移タブ */}
      {activeTab === 'assets' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">資産推移シミュレーション</h3>
          <p className="mb-4">
            このグラフは3つのシナリオ（現状維持、支出削減、投資実行）における総資産の推移を示しています。
            年齢ごとの資産額を万円単位で表示しています。
          </p>
          <div className="h-96">
            <Line
              ref={chartRef}
              data={assetsChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '資産推移予測（万円）'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(0)}万円`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: '資産額（万円）'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* 収支推移タブ */}
      {activeTab === 'balance' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">収支推移シミュレーション</h3>
          <p className="mb-4">
            このグラフは年間の収入と支出の推移を示しています。
            退職後の収入減少やインフレによる支出増加がどのように影響するかを確認できます。
          </p>
          <div className="h-96">
            <Line
              data={balanceChartData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '収支推移予測（万円）'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.dataset.label}: ${context.parsed.y.toFixed(0)}万円`;
                      }
                    }
                  }
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: '金額（万円）'
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}
      
      {/* 詳細データタブ */}
      {activeTab === 'data' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">シミュレーション詳細データ</h3>
          <p className="mb-4">
            以下の表は、主要な年齢時点での資産状況を表しています。
            すべての年齢のデータを確認するには、PDFレポートをダウンロードしてください。
          </p>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年齢</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">西暦</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年間収入（万円）</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年間支出（万円）</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">年間収支（万円）</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">資産合計（万円）</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {/* 現在、45歳、55歳、65歳、75歳、85歳、最終年の7時点を表示 */}
                {[0, 
                  Math.min(simulationResult.baseScenario.findIndex(y => y.age >= 45) !== -1 ? simulationResult.baseScenario.findIndex(y => y.age >= 45) : Infinity, simulationResult.baseScenario.length - 1),
                  Math.min(simulationResult.baseScenario.findIndex(y => y.age >= 55) !== -1 ? simulationResult.baseScenario.findIndex(y => y.age >= 55) : Infinity, simulationResult.baseScenario.length - 1),
                  Math.min(simulationResult.baseScenario.findIndex(y => y.age >= 65) !== -1 ? simulationResult.baseScenario.findIndex(y => y.age >= 65) : Infinity, simulationResult.baseScenario.length - 1),
                  Math.min(simulationResult.baseScenario.findIndex(y => y.age >= 75) !== -1 ? simulationResult.baseScenario.findIndex(y => y.age >= 75) : Infinity, simulationResult.baseScenario.length - 1),
                  Math.min(simulationResult.baseScenario.findIndex(y => y.age >= 85) !== -1 ? simulationResult.baseScenario.findIndex(y => y.age >= 85) : Infinity, simulationResult.baseScenario.length - 1),
                  simulationResult.baseScenario.length - 1
                ].filter((value, index, self) => {
                  return self.indexOf(value) === index && value !== Infinity
                }).map((index) => {
                  const data = simulationResult.baseScenario[index]
                  return (
                    <tr key={index} className={index === 0 ? 'bg-blue-50' : ''}>
                      <td className="px-4 py-3 text-sm">{data.age}歳</td>
                      <td className="px-4 py-3 text-sm">{data.year}年</td>
                      <td className="px-4 py-3 text-sm">{(data.yearlyIncome / 10000).toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm">{(data.yearlyExpenses / 10000).toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm">{(data.yearlyBalance / 10000).toFixed(0)}</td>
                      <td className="px-4 py-3 text-sm">{(data.totalAssets / 10000).toFixed(0)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
} 