'use client';

import React, { useState } from 'react';
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

interface InvestmentChartProps {
  simulationData: {
    age: number;
    year: number;
    investment?: {
      balance: number;
      yield: number;
      contribution?: number;
      withdrawals?: number;
    };
  }[];
}

const InvestmentChart: React.FC<InvestmentChartProps> = ({ simulationData }) => {
  // 期間選択のために、開始年と終了年を特定
  const years = simulationData.map(d => d.year);
  const startYear = Math.min(...years);
  const endYear = Math.max(...years);
  
  // 表示期間を状態として管理
  const [displayRange, setDisplayRange] = useState({
    start: startYear,
    end: endYear
  });
  
  // 表示するデータをフィルタリング
  const filteredData = simulationData.filter(
    data => data.year >= displayRange.start && data.year <= displayRange.end
  );
  
  // 投資利回りの累計を計算
  const cumulativeYield = filteredData.reduce((acc, item, index) => {
    const previousValue = index > 0 ? acc[index - 1] : 0;
    acc.push(previousValue + (item.investment?.yield || 0));
    return acc;
  }, [] as number[]);
  
  // ラベルとデータの準備
  const labels = filteredData.map(data => `${data.year}年`);
  
  const data = {
    labels,
    datasets: [
      {
        label: '資産運用残高',
        data: filteredData.map(data => Math.round((data.investment?.balance || 0) / 10000)), // 万円単位に変換
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        tension: 0.2,
        fill: true,
        pointRadius: filteredData.map((_, i) => i % 5 === 0 ? 3 : 0), // 5年ごとにポイントを表示
        borderWidth: 2,
      },
      {
        label: '年間運用益',
        data: filteredData.map(data => Math.round((data.investment?.yield || 0) / 10000)), // 万円単位に変換
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        tension: 0.2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        yAxisID: 'y1',
        borderWidth: 2,
      },
      {
        label: '累計運用益',
        data: cumulativeYield.map(value => Math.round(value / 10000)),
        borderColor: 'rgb(153, 102, 255)',
        backgroundColor: 'rgba(153, 102, 255, 0.2)',
        tension: 0.2,
        borderDash: [3, 3],
        fill: false,
        pointRadius: 0,
        yAxisID: 'y1',
        borderWidth: 2,
        hidden: true, // デフォルトでは非表示
      }
    ],
  };
  
  // Chart.jsの型定義に合わせたオプション
  const options: ChartOptions<'line'> = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 15
        }
      },
      title: {
        display: true,
        text: '資産運用残高の推移（万円）',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.y}万円`;
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
          text: '残高（万円）',
        },
        // グラフが見やすいようY軸の範囲を調整
        suggestedMin: 0,
      },
      y1: {
        position: 'right',
        ticks: {
          callback: function(value) {
            return `${value}万円`;
          },
        },
        title: {
          display: true,
          text: '運用益（万円）',
        },
        grid: {
          drawOnChartArea: false,
        },
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
  
  // 期間選択用のランチャー
  const renderPeriodSelector = () => {
    const periods = [
      { label: '全期間', start: startYear, end: endYear },
      { label: '直近20年', start: Math.max(startYear, endYear - 20), end: endYear },
      { label: '老後期間', start: Math.max(startYear, filteredData.find(d => d.age >= 65)?.year || startYear), end: endYear },
      { label: '現役期間', start: startYear, end: Math.min(endYear, filteredData.find(d => d.age >= 65)?.year || endYear) }
    ];
    
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {periods.map((period, index) => (
          <button
            key={index}
            className={`px-3 py-1 text-sm rounded-full border 
              ${displayRange.start === period.start && displayRange.end === period.end 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            onClick={() => setDisplayRange({ start: period.start, end: period.end })}
          >
            {period.label}
          </button>
        ))}
      </div>
    );
  };
  
  // 投資サマリー
  const renderInvestmentSummary = () => {
    const totalYield = cumulativeYield[cumulativeYield.length - 1];
    const lastBalance = filteredData[filteredData.length - 1]?.investment?.balance || 0;
    const firstBalance = filteredData[0]?.investment?.balance || 0;
    const totalGrowthRate = lastBalance > 0 ? ((lastBalance - firstBalance) / firstBalance) * 100 : 0;
    
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div className="bg-teal-50 p-3 rounded">
          <p className="text-xs text-gray-500">最終資産残高</p>
          <p className="font-bold text-teal-700">{Math.round(lastBalance / 10000).toLocaleString()}万円</p>
        </div>
        <div className="bg-purple-50 p-3 rounded">
          <p className="text-xs text-gray-500">累計運用益</p>
          <p className="font-bold text-purple-700">{Math.round(totalYield / 10000).toLocaleString()}万円</p>
        </div>
        <div className="bg-blue-50 p-3 rounded">
          <p className="text-xs text-gray-500">期間</p>
          <p className="font-bold text-blue-700">{displayRange.end - displayRange.start + 1}年間</p>
        </div>
        <div className="bg-pink-50 p-3 rounded">
          <p className="text-xs text-gray-500">総成長率</p>
          <p className="font-bold text-pink-700">{Math.round(totalGrowthRate)}%</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="w-full bg-white p-4 rounded-lg shadow">
      {renderPeriodSelector()}
      {renderInvestmentSummary()}
      <div className="h-80">
        <Line data={data} options={options} />
      </div>
      <div className="mt-2 text-sm text-gray-500">
        <p>※ 資産運用は長期的な視点で見ることが重要です。累計運用益を表示するには凡例の「累計運用益」をクリックしてください。</p>
      </div>
    </div>
  );
};

export default InvestmentChart; 