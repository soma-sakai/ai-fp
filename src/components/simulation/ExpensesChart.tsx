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

// Chart.jsの登録
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface ExpensesChartProps {
  simulationData: {
    age: number;
    year: number;
    expenses: {
      housing: number;
      education: number;
      living: number;
      insurance: number;
      tax: number;
      other: number;
    };
    income: number;
  }[];
}

const ExpensesChart: React.FC<ExpensesChartProps> = ({ simulationData }) => {
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
  
  // 年ごとの平均収入（この期間の平均）
  const averageIncome = decadeData.reduce((sum, data) => sum + data.income, 0) / 
                       Math.max(1, decadeData.length);
  
  // 色の設定（視認性の高い色に変更）
  const expenseColors = {
    housing: 'rgb(54, 162, 235)',     // 青
    education: 'rgb(153, 102, 255)',  // 紫
    living: 'rgb(255, 159, 64)',      // オレンジ
    insurance: 'rgb(75, 192, 192)',   // 緑
    tax: 'rgb(255, 99, 132)',         // 赤
    other: 'rgb(201, 203, 207)'       // グレー
  };
  
  // データのフォーマット
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
      },
    ],
  };
  
  // 収入ラインを追加した円グラフ用データ
  const avgExpenses = {
    housing: decadeData.reduce((sum, data) => sum + data.expenses.housing, 0) / Math.max(1, decadeData.length),
    education: decadeData.reduce((sum, data) => sum + data.expenses.education, 0) / Math.max(1, decadeData.length),
    living: decadeData.reduce((sum, data) => sum + data.expenses.living, 0) / Math.max(1, decadeData.length),
    insurance: decadeData.reduce((sum, data) => sum + data.expenses.insurance, 0) / Math.max(1, decadeData.length),
    tax: decadeData.reduce((sum, data) => sum + data.expenses.tax, 0) / Math.max(1, decadeData.length),
    other: decadeData.reduce((sum, data) => sum + data.expenses.other, 0) / Math.max(1, decadeData.length),
  };
  
  const pieData = {
    labels: ['住宅費', '教育費', '生活費', '保険料', '税金', 'その他'],
    datasets: [
      {
        data: [
          Math.round(avgExpenses.housing / 10000),
          Math.round(avgExpenses.education / 10000),
          Math.round(avgExpenses.living / 10000),
          Math.round(avgExpenses.insurance / 10000),
          Math.round(avgExpenses.tax / 10000),
          Math.round(avgExpenses.other / 10000)
        ],
        backgroundColor: [
          expenseColors.housing,
          expenseColors.education,
          expenseColors.living,
          expenseColors.insurance,
          expenseColors.tax,
          expenseColors.other
        ],
      }
    ]
  };
  
  const options: ChartOptions<'bar'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right',
      },
      title: {
        display: true,
        text: `${selectedDecade}年代の支出内訳（万円）`,
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.dataset.label}: ${context.parsed.y}万円`;
          },
        },
      },
    },
    scales: {
      y: {
        stacked: true,
        ticks: {
          callback: function(value) {
            return `${value}万円`;
          },
        },
        title: {
          display: true,
          text: '支出額（万円）',
        }
      },
      x: {
        stacked: true,
        title: {
          display: true,
          text: '年度',
        }
      },
    },
    // 収入ラインの表示
    elements: {
      line: {
        tension: 0.1 // 曲線の滑らかさ
      }
    }
  };
  
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow">
      <div className="mb-4 flex flex-wrap items-center gap-4">
        <div>
          <span className="font-medium mr-2">表示年代:</span>
          <select
            value={selectedDecade}
            onChange={(e) => setSelectedDecade(Number(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded"
          >
            {decades.map((decade) => (
              <option key={decade} value={decade}>
                {decade}年代
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <span className="font-medium mr-2">平均年収:</span>
          <span>{Math.round(averageIncome / 10000)}万円</span>
        </div>
        
        <div>
          <span className="font-medium mr-2">平均総支出:</span>
          <span>
            {Math.round(
              (avgExpenses.housing + avgExpenses.education + avgExpenses.living +
               avgExpenses.insurance + avgExpenses.tax + avgExpenses.other) / 10000
            )}万円
          </span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
        <div className="h-80">
          <Bar data={barData} options={options} />
        </div>
      </div>
      
      <div className="mt-2 text-sm text-gray-500">
        <p>※ 教育費は子供の年齢と教育方針に応じて変動します。収入や税金も年齢に応じて変化します。</p>
      </div>
    </div>
  );
};

export default ExpensesChart; 