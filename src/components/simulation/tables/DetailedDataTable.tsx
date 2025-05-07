'use client';

import React, { useState } from 'react';
import { YearlyBalance } from '@/lib/simulationCalculator';

interface DetailedDataTableProps {
  simulationData: YearlyBalance[];
}

const DetailedDataTable: React.FC<DetailedDataTableProps> = ({ simulationData }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [sortField, setSortField] = useState<string>('year');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // ソート関数
  const sortData = (data: YearlyBalance[]) => {
    return [...data].sort((a, b) => {
      let aValue: any = a;
      let bValue: any = b;
      
      // ネストしたフィールドの取得（例：expenses.housing）
      const fields = sortField.split('.');
      for (const field of fields) {
        aValue = aValue?.[field];
        bValue = bValue?.[field];
      }
      
      // null/undefined チェック
      if (aValue == null) return sortDirection === 'asc' ? -1 : 1;
      if (bValue == null) return sortDirection === 'asc' ? 1 : -1;
      
      // 数値比較
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      
      // 文字列比較
      return sortDirection === 'asc' 
        ? String(aValue).localeCompare(String(bValue))
        : String(bValue).localeCompare(String(aValue));
    });
  };
  
  // ページネーション
  const totalPages = Math.ceil(simulationData.length / rowsPerPage);
  const sortedData = sortData(simulationData);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );
  
  // ページ操作
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };
  
  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(totalPages, prev + 1));
  };
  
  // ソートハンドラ
  const handleSort = (field: string) => {
    if (field === sortField) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };
  
  // ソートインジケータ
  const getSortIndicator = (field: string) => {
    if (field !== sortField) return null;
    return sortDirection === 'asc' ? '↑' : '↓';
  };
  
  // 金額フォーマット
  const formatCurrency = (amount: number | undefined | null) => {
    if (amount === undefined || amount === null) return '0万円';
    return (amount / 10000).toLocaleString('ja-JP', { maximumFractionDigits: 1 }) + '万円';
  };
  
  // 重要年齢の判定
  const isImportantAge = (age: number) => {
    return age === 60 || age === 65 || age === 70 || age === 80;
  };
  
  // 行のスタイル判定
  const getRowStyle = (data: YearlyBalance) => {
    if (data.savings < 0) return 'bg-red-50';
    if (isImportantAge(data.age)) return 'bg-yellow-50';
    if (data.alerts && data.alerts.length > 0) return 'bg-orange-50';
    return '';
  };
  
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* テーブルコントロール */}
      <div className="p-4 bg-gray-50 border-b flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center">
          <span className="mr-2 text-sm">表示件数:</span>
          <select 
            value={rowsPerPage} 
            onChange={(e) => {
              setRowsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="border rounded p-1 text-sm"
          >
            <option value={5}>5件</option>
            <option value={10}>10件</option>
            <option value={20}>20件</option>
            <option value={50}>50件</option>
          </select>
        </div>
        
        <div className="text-sm text-gray-500">
          全{simulationData.length}件中 {(currentPage - 1) * rowsPerPage + 1}-
          {Math.min(currentPage * rowsPerPage, simulationData.length)}件を表示
        </div>
        
        <div className="flex items-center">
          <button 
            onClick={handlePrevPage} 
            disabled={currentPage === 1}
            className={`px-3 py-1 border rounded mr-1 text-sm ${
              currentPage === 1 ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
            }`}
          >
            前へ
          </button>
          <span className="mx-2 text-sm">
            {currentPage} / {totalPages}
          </span>
          <button 
            onClick={handleNextPage} 
            disabled={currentPage === totalPages}
            className={`px-3 py-1 border rounded text-sm ${
              currentPage === totalPages ? 'bg-gray-100 text-gray-400' : 'bg-white hover:bg-gray-50'
            }`}
          >
            次へ
          </button>
        </div>
      </div>
      
      {/* テーブル */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th 
                onClick={() => handleSort('year')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                年度 {getSortIndicator('year')}
              </th>
              <th 
                onClick={() => handleSort('age')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                年齢 {getSortIndicator('age')}
              </th>
              <th 
                onClick={() => handleSort('income')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                年収 {getSortIndicator('income')}
              </th>
              <th 
                onClick={() => handleSort('pension')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                年金 {getSortIndicator('pension')}
              </th>
              <th 
                onClick={() => handleSort('expenses.housing')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                住宅費 {getSortIndicator('expenses.housing')}
              </th>
              <th 
                onClick={() => handleSort('expenses.education')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                教育費 {getSortIndicator('expenses.education')}
              </th>
              <th 
                onClick={() => handleSort('expenses.living')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                生活費 {getSortIndicator('expenses.living')}
              </th>
              <th 
                onClick={() => handleSort('expenses.tax')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                税金 {getSortIndicator('expenses.tax')}
              </th>
              <th 
                onClick={() => handleSort('totalExpense')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                総支出 {getSortIndicator('totalExpense')}
              </th>
              <th 
                onClick={() => handleSort('balance')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                収支 {getSortIndicator('balance')}
              </th>
              <th 
                onClick={() => handleSort('savings')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                預金残高 {getSortIndicator('savings')}
              </th>
              <th 
                onClick={() => handleSort('investment.balance')}
                className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              >
                投資残高 {getSortIndicator('investment.balance')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.map((data, index) => (
              <tr 
                key={index} 
                className={`hover:bg-gray-50 ${getRowStyle(data)}`}
              >
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {data.year}年
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {data.age}歳
                  {isImportantAge(data.age) && (
                    <span className="ml-1 text-xs bg-yellow-200 text-yellow-800 px-1 rounded">
                      {data.age === 60 ? '定年' : 
                       data.age === 65 ? '年金' : 
                       data.age === 70 ? '後期高齢' : 
                       '高齢'}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.income)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {data.pension ? formatCurrency(data.pension) : '-'}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.expenses?.housing)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.expenses?.education)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.expenses?.living)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                  {formatCurrency(data.expenses?.tax)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900">
                  {formatCurrency(data.totalExpense)}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                  data.balance >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.balance)}
                </td>
                <td className={`px-3 py-2 whitespace-nowrap text-sm font-medium ${
                  data.savings >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatCurrency(data.savings)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-teal-600">
                  {formatCurrency(data.investment?.balance || 0)}
                  {data.investment?.yield && data.investment.yield > 0 && (
                    <span className="text-xs text-green-600 ml-1">
                      +{formatCurrency(data.investment.yield)}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 凡例 */}
      <div className="p-3 bg-gray-50 border-t text-xs text-gray-500">
        <div className="flex flex-wrap gap-3">
          <div>
            <span className="inline-block w-3 h-3 bg-yellow-50 border border-yellow-200 mr-1"></span>
            重要な年齢（60歳、65歳、70歳、80歳）
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-red-50 border border-red-200 mr-1"></span>
            預金残高がマイナスの年
          </div>
          <div>
            <span className="inline-block w-3 h-3 bg-orange-50 border border-orange-200 mr-1"></span>
            警告メッセージがある年
          </div>
        </div>
        <p className="mt-1">※ 列の見出しをクリックすると、その項目でソートできます。</p>
      </div>
    </div>
  );
};

export default DetailedDataTable;