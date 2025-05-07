'use client';

import React, { useState, useEffect } from 'react';
import { YearlyBalance } from '@/lib/simulationCalculator';

// グラフコンポーネント
import FinancialOverviewChart from './charts/FinancialOverviewChart';
import AnnualBreakdownChart from './charts/AnnualBreakdownChart';
import AssetAllocationChart from './charts/AssetAllocationChart';
import DetailedDataTable from './tables/DetailedDataTable';

interface ResultsPanelProps {
  simulationData: YearlyBalance[];
  maxBudget: number;
}

const ResultsPanel: React.FC<ResultsPanelProps> = ({ simulationData, maxBudget }) => {
  // 表示タブの状態管理
  const [activeTab, setActiveTab] = useState<'overview' | 'annual' | 'assets' | 'data'>('overview');
  
  // データの有効性チェック
  if (!simulationData || simulationData.length === 0) {
    return (
      <div className="p-6 bg-white rounded-lg shadow">
        <p className="text-center text-gray-500">シミュレーションデータがありません</p>
      </div>
    );
  }
  
  // サマリーデータの計算
  const firstYear = simulationData[0] || {};
  const lastYear = simulationData[simulationData.length - 1] || {};
  const peakSavings = simulationData.reduce((max, current) => 
    (current.savings || 0) > (max.savings || 0) ? current : max, simulationData[0] || {savings: 0, year: 0});
  
  // 資金不足が発生する年を取得
  const negativeYear = simulationData.find(item => (item.savings || 0) < 0)?.year;
  
  // 総資産推移（現金 + 投資）の計算
  const totalAssets = simulationData.map(data => ({
    year: data.year,
    age: data.age,
    savings: data.savings || 0,
    investment: data.investment?.balance || 0,
    total: (data.savings || 0) + (data.investment?.balance || 0)
  }));
  
  // タブを切り替える関数
  const handleTabChange = (tab: 'overview' | 'annual' | 'assets' | 'data') => {
    setActiveTab(tab);
  };
  
  return (
    <div className="bg-gray-50 p-5 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">生涯資産シミュレーション</h2>
      
      {/* サマリーカード */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">適正住宅予算</h3>
          <p className="text-2xl font-bold text-blue-600">{Math.round(maxBudget / 10000).toLocaleString()}万円</p>
          <p className="text-xs text-gray-500 mt-1">収入や支出から算出した無理のない住宅予算</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">資産ピーク</h3>
          <p className="text-2xl font-bold text-green-600">
            {peakSavings && typeof peakSavings.savings === 'number' 
              ? Math.round((peakSavings.savings) / 10000).toLocaleString() 
              : 0}万円
            <span className="text-sm font-normal text-gray-500 ml-1">({peakSavings?.year || '-'}年)</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">貯蓄残高が最大になる年</p>
        </div>
        
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-medium text-gray-500">90歳時点の資産</h3>
          <p className="text-2xl font-bold text-purple-600">
            {Math.round(((lastYear?.savings || 0) + (lastYear?.investment?.balance || 0)) / 10000).toLocaleString()}万円
          </p>
          <p className="text-xs text-gray-500 mt-1">現金 + 投資資産の合計</p>
        </div>
      </div>
      
      {/* タブナビゲーション */}
      <div className="flex flex-wrap border-b border-gray-200 mb-6">
        <button
          onClick={() => handleTabChange('overview')}
          className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'overview' 
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          資産推移
        </button>
        <button
          onClick={() => handleTabChange('annual')}
          className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'annual' 
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          収支内訳
        </button>
        <button
          onClick={() => handleTabChange('assets')}
          className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'assets' 
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          資産配分
        </button>
        <button
          onClick={() => handleTabChange('data')}
          className={`mr-2 py-2 px-4 font-medium text-sm rounded-t-lg ${
            activeTab === 'data' 
              ? 'bg-white border-t border-l border-r border-gray-200 text-blue-600' 
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          詳細データ
        </button>
      </div>
      
      {/* タブコンテンツ */}
      <div className="bg-white p-5 rounded-lg shadow">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">資産推移チャート</h3>
            <FinancialOverviewChart simulationData={simulationData} />
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">ポイント: </span>
                {firstYear?.age || '-'}歳から始まる資産形成プランでは、
                {negativeYear 
                  ? `${negativeYear}年に資金不足が発生する可能性があります。早めの対策を検討しましょう。` 
                  : `生涯を通じて安定した資産を維持できる見込みです。`}
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'annual' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">年間収支内訳</h3>
            <AnnualBreakdownChart simulationData={simulationData} />
            <div className="mt-4 p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">ポイント: </span>
                支出内訳から、特に
                {simulationData.some(d => d.expenses.education > d.expenses.housing) 
                  ? '教育費が家計に大きな影響を与えています。' 
                  : '住宅費が家計に大きな影響を与えています。'}
                退職後は生活費の割合が増加します。
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'assets' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">資産配分の推移</h3>
            <AssetAllocationChart totalAssets={totalAssets} />
            <div className="mt-4 p-3 bg-purple-50 rounded-lg">
              <p className="text-sm text-gray-700">
                <span className="font-semibold">ポイント: </span>
                資産形成において
                {totalAssets.length > 0 && totalAssets[totalAssets.length - 1]?.investment > totalAssets[totalAssets.length - 1]?.savings 
                  ? '投資運用が大きく貢献しています。長期的な資産成長が見込めます。' 
                  : '現金資産が中心となっています。投資割合を増やすことで、さらなる資産形成が期待できます。'}
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'data' && (
          <div>
            <h3 className="text-lg font-semibold mb-4">生涯収支詳細データ</h3>
            <DetailedDataTable simulationData={simulationData} />
          </div>
        )}
      </div>
      
      {/* 前提条件 */}
      <div className="mt-6 p-4 bg-white rounded-lg shadow">
        <h3 className="text-md font-semibold mb-2">シミュレーション前提条件</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
          <div>
            <span className="font-medium">シミュレーション期間:</span> {firstYear?.age || '-'}歳〜{lastYear?.age || '-'}歳
          </div>
          <div>
            <span className="font-medium">初期年収:</span> {firstYear && typeof firstYear.income === 'number' 
              ? Math.round((firstYear.income) / 10000).toLocaleString() 
              : 0}万円
          </div>
          <div>
            <span className="font-medium">初期貯蓄額:</span> {firstYear && typeof firstYear.savings === 'number' 
              ? Math.round((firstYear.savings) / 10000).toLocaleString() 
              : 0}万円
          </div>
          <div>
            <span className="font-medium">退職年齢:</span> {simulationData.find(d => d.pension && d.pension > 0)?.age || 65}歳
          </div>
          <div>
            <span className="font-medium">年金受給額:</span> {Math.round((lastYear.pension || 0) / 10000)}万円/年
          </div>
          <div>
            <span className="font-medium">投資運用利回り:</span> {simulationData[0]?.investment?.yield ? 
              Math.round(((simulationData[0].investment.yield / (simulationData[0].investment.balance || 1)) * 100 * 100) / 100) : 4}%
          </div>
        </div>
      </div>
      
      {/* 印刷ボタン */}
      <div className="mt-6 text-right">
        <button 
          onClick={() => window.print()}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
        >
          結果を印刷する
        </button>
      </div>
    </div>
  );
};

export default ResultsPanel; 