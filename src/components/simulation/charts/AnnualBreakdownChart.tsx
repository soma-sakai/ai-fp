'use client';

import React, { useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { YearlyBalance } from '@/lib/simulationCalculator';

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface AnnualBreakdownChartProps {
  simulationData: YearlyBalance[];
}

const AnnualBreakdownChart: React.FC<AnnualBreakdownChartProps> = ({ simulationData }) => {
  // 年代ごとのグループに表示するために区切る（10年ごと）
  const decades = Array.from(
    new Set(
      simulationData
        .map(data => Math.floor(data.year / 10) * 10)
        .sort((a, b) => a - b)
    )
  );
  
  const initialSelectedDecade = decades[0] || Math.floor(new Date().getFullYear() / 10) * 10;
  
  const [selectedDecade, setSelectedDecade] = useState<number>(initialSelectedDecade);
  
  // 選択された10年間のデータ
  const decadeData = simulationData
    .filter(data => data.year >= selectedDecade && data.year < selectedDecade + 10)
    .sort((a, b) => a.year - b.year);
  
  // 支出項目の色定義
  const expenseColors = {
    housing: 'rgba(50, 50, 50, 0.8)',   // 住宅費：ダークグレー
    education: 'rgba(90, 90, 90, 0.8)', // 教育費：グレー
    living: 'rgba(130, 130, 130, 0.8)',    // 生活費：ミディアムグレー
    insurance: 'rgba(170, 170, 170, 0.8)',  // 保険料：ライトグレー
    tax: 'rgba(210, 210, 210, 0.8)',      // 税金：ベリーライトグレー
    other: 'rgba(230, 230, 230, 0.8)'     // その他：アルモストホワイト
  };
  
  // データの整形
  const barData = {
    labels: decadeData.map(data => `${data.year}年`),
    datasets: [
      {
        label: '住宅費',
        data: decadeData.map(data => Math.round(data.expenses.housing / 10000)),
        backgroundColor: expenseColors.housing,
      },
      {
        label: '教育費',
        data: decadeData.map(data => Math.round(data.expenses.education / 10000)),
        backgroundColor: expenseColors.education,
      },
      {
        label: '生活費',
        data: decadeData.map(data => Math.round(data.expenses.living / 10000)),
        backgroundColor: expenseColors.living,
      },
      {
        label: '保険料',
        data: decadeData.map(data => Math.round(data.expenses.insurance / 10000)),
        backgroundColor: expenseColors.insurance,
      },
      {
        label: '税金',
        data: decadeData.map(data => Math.round(data.expenses.tax / 10000)),
        backgroundColor: expenseColors.tax,
      },
      {
        label: 'その他',
        data: decadeData.map(data => Math.round(data.expenses.other / 10000)),
        backgroundColor: expenseColors.other,
      }
    ],
  };
  
  // 収入ラインのデータセット
  const incomeDataset = {
    type: 'line' as const,
    label: '年収',
    data: decadeData.map(data => Math.round(data.income / 10000)),
    borderColor: 'rgba(40, 40, 40, 1)',
    backgroundColor: 'rgba(40, 40, 40, 0)',
    borderWidth: 2,
    tension: 0.1,
    pointRadius: 3,
    yAxisID: 'y1',
  };
  
  // オプション設定
  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: `${selectedDecade}年代の収支内訳（万円）`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.y.toLocaleString()}万円`;
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '支出額（万円）',
        },
        ticks: {
          callback: function(value) {
            return `${value.toLocaleString()}万円`;
          },
        },
      },
      y1: {
        type: 'linear' as const,
        display: true,
        position: 'right' as const,
        title: {
          display: true,
          text: '年収（万円）',
        },
        grid: {
          drawOnChartArea: false,
        },
        ticks: {
          callback: function(value) {
            return `${value.toLocaleString()}万円`;
          },
        },
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text: '年度',
        },
      },
    },
  };
  
  // 年代の平均値を取得
  const averageIncome = decadeData.reduce((sum, data) => sum + data.income, 0) / Math.max(1, decadeData.length);
  const averageExpense = decadeData.reduce((sum, data) => sum + data.totalExpense, 0) / Math.max(1, decadeData.length);
  const balanceRatio = Math.round((averageIncome - averageExpense) / averageIncome * 100);
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div>
          <span className="font-medium mr-2">年代選択:</span>
          <select
            value={selectedDecade}
            onChange={(e) => setSelectedDecade(Number(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {decades.map((decade) => (
              <option key={decade} value={decade}>
                {decade}年代
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex gap-6 text-sm">
          <div className="px-3 py-1 bg-blue-50 rounded-full">
            <span className="font-medium">平均年収:</span>
            <span className="ml-1">{Math.round(averageIncome / 10000).toLocaleString()}万円</span>
          </div>
          <div className="px-3 py-1 bg-green-50 rounded-full">
            <span className="font-medium">平均支出:</span>
            <span className="ml-1">{Math.round(averageExpense / 10000).toLocaleString()}万円</span>
          </div>
          <div className={`px-3 py-1 rounded-full ${balanceRatio >= 10 ? 'bg-green-100' : balanceRatio >= 0 ? 'bg-yellow-50' : 'bg-red-50'}`}>
            <span className="font-medium">貯蓄率:</span>
            <span className="ml-1">{balanceRatio}%</span>
          </div>
        </div>
      </div>
      
      <div className="h-96 bg-white p-4 rounded-lg shadow">
        <Bar 
          data={{
            ...barData,
            datasets: [...barData.datasets, incomeDataset as any]
          }} 
          options={options} 
        />
      </div>
      
      <div className="text-sm text-gray-600 mt-2">
        <p>※ グラフは各年の主要支出項目を表示しています。家計状況を詳細に把握するには詳細データタブをご確認ください。</p>
      </div>
    </div>
  );
};

export default AnnualBreakdownChart; 