'use client';

import React, { useState } from 'react';

interface BalanceTableProps {
  simulationData: {
    age: number;
    year: number;
    income: number;
    expenses: {
      housing: number;
      education: number;
      living: number;
      insurance: number;
      tax: number;
      other: number;
      [key: string]: number;
    };
    totalExpense: number;
    balance: number;
    savings: number;
    investment?: {
      balance: number;
      yield: number;
    };
    pension?: number;
    mortgage?: {
      principal: number;
      interest: number;
    };
    alerts?: string[];
  }[];
}

const BalanceTable: React.FC<BalanceTableProps> = ({ simulationData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortKey, setSortKey] = useState<string>('year');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // ソートロジック
  const sortedData = [...simulationData].sort((a, b) => {
    let aValue, bValue;
    
    // ネストしたプロパティへのアクセス
    if (sortKey.includes('.')) {
      const [parent, child] = sortKey.split('.');
      aValue = a[parent as keyof typeof a]?.[child as any] || 0;
      bValue = b[parent as keyof typeof b]?.[child as any] || 0;
    } else {
      aValue = a[sortKey as keyof typeof a] || 0;
      bValue = b[sortKey as keyof typeof b] || 0;
    }
    
    return sortOrder === 'asc' ? 
      (aValue > bValue ? 1 : -1) : 
      (aValue < bValue ? 1 : -1);
  });
  
  // 表示するデータの処理
  const totalPages = Math.ceil(sortedData.length / rowsPerPage);
  const currentData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  
  const handleRowsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setRowsPerPage(Number(e.target.value));
    setCurrentPage(1); // 1ページ目に戻る
  };
  
  // ソート切り替え
  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };
  
  // 重要な年のハイライト（退職年など）
  const isImportantYear = (age: number) => {
    return age === 60 || age === 65 || age === 70;
  };
  
  // 金額フォーマット
  const formatCurrency = (amount: number) => {
    return (amount / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 }) + '万円';
  };
  
  // ソートアイコン
  const getSortIcon = (key: string) => {
    if (sortKey !== key) return null;
    return sortOrder === 'asc' ? '↑' : '↓';
  };
  
  // アラートアイコン表示
  const renderAlertIcon = (data: typeof simulationData[0]) => {
    if (data.alerts && data.alerts.length > 0) {
      return (
        <div className="relative group">
          <span className="text-red-600 cursor-pointer">
            ⚠️
          </span>
          <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block bg-red-50 border border-red-200 rounded p-2 shadow-lg z-10 w-64">
            <ul className="text-xs text-red-800">
              {data.alerts.map((alert: string, idx: number) => (
                <li key={idx} className="mb-1">・{alert}</li>
              ))}
            </ul>
          </div>
        </div>
      );
    }
    return null;
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
        <div>
          <span className="mr-2">表示件数:</span>
          <select 
            value={rowsPerPage} 
            onChange={handleRowsPerPageChange}
            className="border rounded p-1"
          >
            <option value="5">5件</option>
            <option value="10">10件</option>
            <option value="20">20件</option>
            <option value="30">30件</option>
          </select>
        </div>
        <div className="text-sm text-gray-600">
          <span>※ 列見出しをクリックするとソートできます。⚠️マークにカーソルを合わせるとアラート内容が表示されます。</span>
        </div>
        <div>
          <span className="mr-2">
            {currentPage} / {totalPages} ページ
          </span>
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className={`px-2 py-1 border rounded mr-1 ${currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}`}
          >
            前へ
          </button>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className={`px-2 py-1 border rounded ${currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'}`}
          >
            次へ
          </button>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('year')}
              >
                年 {getSortIcon('year')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('age')}
              >
                年齢 {getSortIcon('age')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('income')}
              >
                年収 {getSortIcon('income')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expenses.housing')}
              >
                住宅費 {getSortIcon('expenses.housing')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expenses.education')}
              >
                教育費 {getSortIcon('expenses.education')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expenses.living')}
              >
                生活費 {getSortIcon('expenses.living')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('expenses.tax')}
              >
                税金 {getSortIcon('expenses.tax')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('pension')}
              >
                年金 {getSortIcon('pension')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('investment.balance')}
              >
                投資残高 {getSortIcon('investment.balance')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('balance')}
              >
                収支 {getSortIcon('balance')}
              </th>
              <th 
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleSort('savings')}
              >
                貯蓄残高 {getSortIcon('savings')}
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                アラート
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentData.map((data, index) => (
              <tr 
                key={index} 
                className={`
                  ${data.savings < 0 ? 'bg-red-50' : ''}
                  ${isImportantYear(data.age) ? 'bg-yellow-50' : ''}
                  ${data.alerts && data.alerts.length > 0 ? 'bg-orange-50' : ''}
                  hover:bg-gray-50
                `}
              >
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900 font-medium">
                  {data.year}年
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {data.age}歳
                  {isImportantYear(data.age) && (
                    <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                      {data.age === 60 ? '定年' : data.age === 65 ? '年金' : '後期高齢'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.income)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.expenses.housing)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.expenses.education)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.expenses.living)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(data.expenses.tax)}</td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {data.pension ? formatCurrency(data.pension) : '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.investment?.balance || 0)}
                  {data.investment?.yield ? (
                    <span className="text-xs text-green-600 ml-1">
                      (+{formatCurrency(data.investment.yield)})
                    </span>
                  ) : null}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${data.balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(data.balance)}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap text-sm font-bold ${data.savings < 0 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatCurrency(data.savings)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm">
                  {renderAlertIcon(data)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      <div className="bg-gray-50 p-3 border-t border-gray-200 text-xs text-gray-500">
        <p>※ 「年齢」列の黄色マークは重要な年齢を示しています。
           「貯蓄残高」列の赤字は資金不足を示しています。
           オレンジ背景の行には注意が必要です。</p>
      </div>
    </div>
  );
};

export default BalanceTable; 