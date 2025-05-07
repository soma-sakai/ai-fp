'use client';

import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface SavingsChartProps {
  simulationData: any[]; // 型をanyに変更してより柔軟に受け取れるようにする
}

const SavingsChart: React.FC<SavingsChartProps> = ({ simulationData }) => {
  // データのフォーマット
  const labels = simulationData.map(data => `${data.year}年`);
  
  // プラスとマイナスのデータを分ける（背景色を変えるため）
  const positiveData = simulationData.map(data => 
    data.savings >= 0 ? Math.round(data.savings / 10000) : null
  );
  
  const negativeData = simulationData.map(data => 
    data.savings < 0 ? Math.round(data.savings / 10000) : null
  );
  
  // データの存在確認
  console.log('SavingsChartデータ確認:', {
    データ数: simulationData.length,
    サンプル: simulationData.length > 0 ? {
      年収: simulationData[0].income,
      貯蓄: simulationData[0].savings,
      年度: simulationData[0].year
    } : 'なし'
  });
  
  // 年収データをフォーマット（データが存在する場合のみ）
  const incomeData = simulationData.map(data => {
    // 年収が存在しない場合はデフォルト値0を使用
    const income = typeof data.income === 'number' ? data.income : 0;
    return Math.round(income / 10000);
  });
  
  const data = {
    labels,
    datasets: [
      {
        label: '預貯金残高（プラス）',
        data: positiveData,
        borderColor: 'rgb(0, 123, 255)',
        backgroundColor: 'rgba(0, 123, 255, 0.2)',
        tension: 0.2,
        fill: true,
        pointRadius: simulationData.map((_, i) => i % 5 === 0 ? 3 : 0), // 5年ごとにポイントを表示
        yAxisID: 'y',
      },
      {
        label: '預貯金残高（マイナス）',
        data: negativeData,
        borderColor: 'rgb(220, 53, 69)',
        backgroundColor: 'rgba(220, 53, 69, 0.2)',
        tension: 0.2,
        fill: true,
        pointRadius: simulationData.map((_, i) => i % 5 === 0 ? 3 : 0), // 5年ごとにポイントを表示
        yAxisID: 'y',
      },
      {
        label: '年収',
        data: incomeData,
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.0)',
        borderWidth: 2,
        borderDash: [5, 5],
        tension: 0.1,
        fill: false,
        pointRadius: 0,
        yAxisID: 'y1',
      },
    ],
  };
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: '預金額と年収の推移（万円）',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: ${value}万円`;
          },
        },
      },
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return `${value}万円`;
          },
        },
        title: {
          display: true,
          text: '預金額（万円）',
        },
        // 0ラインを強調表示
        grid: {
          color: (context: any) => context.tick.value === 0 ? 'rgba(220, 53, 69, 0.5)' : 'rgba(0, 0, 0, 0.1)',
          lineWidth: (context: any) => context.tick.value === 0 ? 2 : 1,
        },
        // グラフが見やすいようY軸の範囲を自動調整
        min: Math.min(...negativeData.filter(v => v !== null) as number[], 0) * 1.2,
        max: Math.max(...positiveData.filter(v => v !== null) as number[], 0) * 1.2,
      },
      y1: {
        position: 'right',
        title: {
          display: true,
          text: '年収（万円）',
        },
        ticks: {
          callback: function(value) {
            return `${value}万円`;
          },
        },
        grid: {
          drawOnChartArea: false, // 年収のグリッドラインは表示しない
        },
        // 年収のY軸範囲設定
        min: 0,
        max: Math.max(...incomeData.filter(v => v > 0), 1000) * 1.2, // 0より大きい値で最大を計算、最低でも1000万円までは表示
      },
      x: {
        title: {
          display: true,
          text: '年度',
        },
        ticks: {
          autoSkip: true,
          maxTicksLimit: 20,
          callback: function(value, index) {
            return index % 5 === 0 ? labels[index] : ''; // 5年ごとに表示
          },
        },
      },
    },
  };
  
  return (
    <div className="w-full h-80 bg-white p-4 rounded-lg shadow">
      <Line data={data} options={options} />
    </div>
  );
};

export default SavingsChart; 