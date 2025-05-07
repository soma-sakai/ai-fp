'use client'

import { useState, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { supabase } from '../lib/supabase'
import { jsPDF } from 'jspdf'
import html2canvas from 'html2canvas'

// Chart.jsの設定
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend)

// 結果表示コンポーネント
export default function HousingBudgetResults({ results }: { results: any }) {
  const [activeTab, setActiveTab] = useState('summary')
  const chartRef = useRef<any>(null)
  const resultRef = useRef<HTMLDivElement>(null)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  
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
  
  // 5年間の貯蓄推移予測
  const savingsChartData = {
    labels: ['現在', '6ヶ月後', '1年後', '1年半後', '2年後', '2年半後', '3年後', '3年半後', '4年後', '4年半後', '5年後'],
    datasets: [
      {
        label: 'MAXライン',
        data: results.savingsSimulation.maxLineSavings,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1
      },
      {
        label: '妥当ライン',
        data: results.savingsSimulation.reasonableLineSavings,
        borderColor: 'rgb(255, 206, 86)',
        backgroundColor: 'rgba(255, 206, 86, 0.5)',
        tension: 0.1
      },
      {
        label: '安全ライン',
        data: results.savingsSimulation.safeLineSavings,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        tension: 0.1
      }
    ]
  }
  
  // 老後資金シミュレーション
  const retirementFundData = {
    labels: ['目標額', 'MAXラインの場合', '妥当ラインの場合', '安全ラインの場合'],
    datasets: [
      {
        label: '老後資金（万円）',
        data: [
          Math.round(results.retirementProjection.targetAmount / 10000),
          Math.round(results.retirementProjection.projectedWithMaxLine / 10000),
          Math.round(results.retirementProjection.projectedWithReasonableLine / 10000),
          Math.round(results.retirementProjection.projectedWithSafeLine / 10000)
        ],
        backgroundColor: [
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 99, 132, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)'
        ],
        borderColor: [
          'rgba(153, 102, 255, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)'
        ],
        borderWidth: 1
      }
    ]
  }
  
  // PDFダウンロード処理
  const handleDownloadPDF = async () => {
    try {
      if (!resultRef.current) return;
      
      setIsGeneratingPdf(true);
      
      // ユーザーアクションを記録
      await supabase.from('user_actions').insert({
        user_id: results.inputData.userId,
        action: 'budget_pdf_download',
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
      pdfDoc.save("安心住宅予算診断結果.pdf");
      
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
        user_id: results.inputData.userId,
        action: 'budget_to_consultation',
        created_at: new Date().toISOString()
      });
      
      // 相談予約ページへ遷移
      window.location.href = '/consultation';
    } catch (error) {
      console.error('Error logging consultation redirect:', error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow-lg" ref={resultRef}>
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
        <button
          className={`px-4 py-2 ${activeTab === 'retirement' ? 'border-b-2 border-green-500 text-green-500' : 'text-gray-500'}`}
          onClick={() => setActiveTab('retirement')}
        >
          老後資金
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
            <p className="mb-2">
              この診断結果は以下の2つの重要な基準に基づいて算出されています：
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-semibold">基準1：</span>購入後5年間で貯蓄残高がマイナスにならないこと</li>
              <li><span className="font-semibold">基準2：</span>老後資金目標額は1人あたり2,000万円を確保</li>
            </ul>
            <p className="mt-2 text-sm">
              安全ラインは、年間返済額が世帯年収の20%以内に収まり、両方の基準を満たす予算です。
              妥当ラインと最大ラインも同様の基準で算出されていますが、それぞれ返済負担率が25%と30%と高くなっています。
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
            <button
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-70 disabled:cursor-not-allowed"
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
            <h4 className="font-semibold mb-2">返済負担率の目安</h4>
            <p>
              住宅ローンの返済負担率（年間返済額÷年収）は、一般的には20%以内が安全とされています。
              25%までは一般的な範囲内、30%を超えると生活が圧迫される可能性が高まります。
              特に、子育て世代や将来的に収入減が見込まれる場合は、返済負担率を低めに設定することをおすすめします。
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
            基準1「購入後5年間で貯蓄残高がマイナスにならないこと」を満たしているかをチェックできます。
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
            <h4 className="font-semibold mb-2">安心の貯蓄推移とは</h4>
            <p>
              住宅購入後の5年間は、予期せぬ出費や収入の変動リスクが高い期間です。
              この期間に貯蓄残高がマイナスになると、生活が圧迫され、住宅ローンの返済が滞るリスクが高まります。
              安全ラインであれば、十分な貯蓄を維持しながら住宅購入が可能といえます。
            </p>
          </div>
        </div>
      )}
      
      {/* 老後資金タブ */}
      {activeTab === 'retirement' && (
        <div>
          <h3 className="text-xl font-semibold mb-4">老後資金シミュレーション</h3>
          <p className="mb-4">
            このグラフは基準2「老後資金目標額は1人あたり2,000万円」が達成できるかを示しています。
            各予算ラインでの住宅購入後も、退職時までに目標額を達成できるかをチェックできます。
          </p>
          <div className="h-96">
            <Bar
              data={retirementFundData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  title: {
                    display: true,
                    text: '老後資金予測（万円）'
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        return `${context.label}: ${context.parsed.y.toLocaleString()}万円`;
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
          <div className="mt-4 bg-green-50 p-4 rounded">
            <h4 className="font-semibold mb-2">老後資金の考え方</h4>
            <p>
              老後の生活には、公的年金に加えて一定の自己資金が必要です。
              1人あたり2,000万円（夫婦なら4,000万円）は目安の一つとされています。
              住宅ローンの返済と並行して、計画的に老後資金を貯めることが重要です。
              安全ラインであれば、住宅ローンの返済をしながらも老後資金の確保が可能です。
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 