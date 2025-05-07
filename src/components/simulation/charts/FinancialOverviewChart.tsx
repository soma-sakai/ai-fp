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
import { YearlyBalance } from '@/lib/simulationCalculator';

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

interface FinancialOverviewChartProps {
  simulationData: YearlyBalance[];
}

const FinancialOverviewChart: React.FC<FinancialOverviewChartProps> = ({ simulationData }) => {
  // データのフォーマット
  const labels = simulationData.map(data => `${data.year}年`);
  
  // 預金残高と投資残高、収入データを準備
  const savingsData = simulationData.map(data => 
    Math.round(data.savings / 10000)
  );
  
  const investmentData = simulationData.map(data => 
    Math.round((data.investment?.balance || 0) / 10000)
  );
  
  const totalAssetData = simulationData.map(data => 
    Math.round((data.savings + (data.investment?.balance || 0)) / 10000)
  );
  
  const incomeData = simulationData.map(data => 
    Math.round(data.income / 10000)
  );
  
  const chartData = {
    labels,
    datasets: [
      {
        label: '預貯金',
        data: savingsData,
        borderColor: 'rgba(80, 80, 80, 1)',
        backgroundColor: 'rgba(80, 80, 80, 0.1)',
        tension: 0.2,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: '投資資産',
        data: investmentData,
        borderColor: 'rgba(120, 120, 120, 1)',
        backgroundColor: 'rgba(120, 120, 120, 0.1)',
        tension: 0.2,
        fill: true,
        pointRadius: 0,
        borderWidth: 2,
        yAxisID: 'y',
      },
      {
        label: '総資産',
        data: totalAssetData,
        borderColor: 'rgba(40, 40, 40, 1)',
        backgroundColor: 'rgba(40, 40, 40, 0)',
        borderWidth: 3,
        tension: 0.2,
        pointRadius: simulationData.map((_, i) => i % 5 === 0 ? 3 : 0), // 5年ごとにポイント表示
        fill: false,
        borderDash: [],
        yAxisID: 'y',
      },
      {
        label: '年収',
        data: incomeData,
        borderColor: 'rgba(160, 160, 160, 1)',
        backgroundColor: 'rgba(160, 160, 160, 0)',
        borderWidth: 2,
        tension: 0.1,
        pointRadius: 0,
        fill: false,
        borderDash: [5, 5],
        yAxisID: 'y1',
      },
    ],
  };
  
  const options: ChartOptions<'line'> = {
    responsive: true,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 15,
        }
      },
      title: {
        display: true,
        text: '生涯の資産推移と年収',
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
            return `${label}: ${value.toLocaleString()}万円`;
          },
        },
      },
    },
    scales: {
      y: {
        type: 'linear' as const,
        display: true,
        position: 'left' as const,
        title: {
          display: true,
          text: '資産額（万円）',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
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
        min: 0,
        max: Math.max(...incomeData) * 1.2,
      },
      x: {
        title: {
          display: true,
          text: '年度',
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)',
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
    <div className="w-full h-96 bg-white rounded-lg">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default FinancialOverviewChart; 