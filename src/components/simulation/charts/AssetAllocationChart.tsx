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

interface AssetData {
  year: number;
  age: number;
  savings: number;
  investment: number;
  total: number;
}

interface AssetAllocationChartProps {
  totalAssets: AssetData[];
}

const AssetAllocationChart: React.FC<AssetAllocationChartProps> = ({ totalAssets }) => {
  // 期間選択オプション
  const periods = [
    { label: '全期間', value: 'all' },
    { label: '現役期間', value: 'working' },
    { label: '退職後', value: 'retirement' },
    { label: '直近20年', value: 'last20' }
  ];
  
  const [selectedPeriod, setSelectedPeriod] = useState<string>('all');
  
  // 表示データのフィルタリング
  const filteredData = (() => {
    // 退職年齢を65歳と仮定
    const retirementYear = totalAssets.find(d => d.age >= 65)?.year || totalAssets[totalAssets.length - 1].year;
    const lastYear = totalAssets[totalAssets.length - 1].year;
    
    switch (selectedPeriod) {
      case 'working':
        return totalAssets.filter(d => d.year < retirementYear);
      case 'retirement':
        return totalAssets.filter(d => d.year >= retirementYear);
      case 'last20':
        return totalAssets.filter(d => d.year > lastYear - 20);
      default:
        return totalAssets;
    }
  })();
  
  // 5年ごとに表示するようにデータを間引く
  const sampledData = filteredData.filter((_, index) => 
    index === 0 || index === filteredData.length - 1 || index % 5 === 0
  );
  
  // 積み上げグラフ用データの作成
  const labels = sampledData.map(data => `${data.year}年`);
  
  const data = {
    labels,
    datasets: [
      {
        label: '現金資産',
        data: sampledData.map(data => Math.round(data.savings / 10000)),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
      {
        label: '投資資産',
        data: sampledData.map(data => Math.round(data.investment / 10000)),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      }
    ]
  };
  
  // 資産割合の推移
  const assetRatioData = {
    labels,
    datasets: [
      {
        label: '現金割合',
        data: sampledData.map(data => 
          data.total > 0 ? Math.round((data.savings / data.total) * 100) : 0
        ),
        backgroundColor: 'rgba(54, 162, 235, 0.8)',
        barPercentage: 0.6,
      },
      {
        label: '投資割合',
        data: sampledData.map(data => 
          data.total > 0 ? Math.round((data.investment / data.total) * 100) : 0
        ),
        backgroundColor: 'rgba(75, 192, 192, 0.8)',
        barPercentage: 0.6,
      }
    ]
  };
  
  // チャートオプション
  const stackedOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: '資産構成の推移（万円）',
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
          footer: function(tooltipItems) {
            let sum = 0;
            tooltipItems.forEach(item => {
              sum += item.parsed.y;
            });
            return `合計: ${sum.toLocaleString()}万円`;
          }
        }
      }
    },
    scales: {
      x: {
        stacked: true,
        title: {
          display: true,
          text: '年度'
        }
      },
      y: {
        stacked: true,
        title: {
          display: true,
          text: '資産額（万円）'
        },
        ticks: {
          callback: function(value) {
            return `${value.toLocaleString()}万円`;
          }
        }
      }
    }
  };
  
  const ratioOptions: ChartOptions<'bar'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      title: {
        display: true,
        text: '資産割合の推移（%）',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            return `${label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: {
          display: true,
          text: '年度'
        }
      },
      y: {
        min: 0,
        max: 100,
        title: {
          display: true,
          text: '割合（%）'
        },
        ticks: {
          callback: function(value) {
            return `${value}%`;
          }
        }
      }
    }
  };
  
  // 統計データの計算
  const lastData = sampledData[sampledData.length - 1];
  const cashRatio = lastData.total > 0 ? (lastData.savings / lastData.total) * 100 : 0;
  const investmentRatio = lastData.total > 0 ? (lastData.investment / lastData.total) * 100 : 0;
  
  // 資産構成比率の最適なバランスを評価
  const getBalanceComment = () => {
    if (lastData.age < 40) {
      return investmentRatio >= 60 
        ? "若年層として理想的な資産配分です" 
        : "若年層はより積極的な投資配分が理想的です";
    } else if (lastData.age < 60) {
      return investmentRatio >= 40 && investmentRatio <= 70
        ? "中年層として適切なバランスの資産配分です"
        : "中年層は40-70%程度の投資配分が理想的です";
    } else {
      return investmentRatio <= 40
        ? "退職後の安定性を重視した適切な配分です"
        : "退職後はより安全資産の割合を増やすことをご検討ください";
    }
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div>
          <span className="font-medium mr-2">期間:</span>
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="px-3 py-1 border border-gray-300 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {periods.map((period) => (
              <option key={period.value} value={period.value}>
                {period.label}
              </option>
            ))}
          </select>
        </div>
        
        <div className="ml-auto text-sm">
          <span className="font-semibold">最終時点の資産構成: </span>
          <span className="bg-blue-100 px-2 py-1 rounded-full ml-1">現金 {Math.round(cashRatio)}%</span>
          <span className="bg-teal-100 px-2 py-1 rounded-full ml-1">投資 {Math.round(investmentRatio)}%</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="h-80 bg-white p-4 rounded-lg shadow">
          <Bar data={data} options={stackedOptions} />
        </div>
        
        <div className="h-80 bg-white p-4 rounded-lg shadow">
          <Bar data={assetRatioData} options={ratioOptions} />
        </div>
      </div>
      
      <div className="p-3 bg-purple-50 rounded-lg">
        <p className="text-sm text-gray-700">
          <span className="font-semibold">資産配分評価: </span>
          {getBalanceComment()}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          ※ 一般的に若年層は成長を重視した投資配分、退職後は安定性を重視した配分が望ましいとされています。
          年齢や状況に応じた適切な配分をご検討ください。
        </p>
      </div>
    </div>
  );
};

export default AssetAllocationChart; 