import { jsPDF } from 'jspdf';
// autoTableを個別にインポート
import autoTable from 'jspdf-autotable';
import { BudgetDiagnosisResult, DiagnosisFormData } from '@/types';

/**
 * 予算診断結果のPDFを生成する関数
 */
export const generatePDF = (
  formData: DiagnosisFormData, 
  result: BudgetDiagnosisResult
): Blob => {
  try {
    // ドキュメントを作成
    const doc = new jsPDF();
    
    // タイトル
    doc.setFontSize(20);
    doc.text('住宅予算診断結果', 105, 20, { align: 'center' });
    
    // 顧客情報 - autoTableを使用
    doc.setFontSize(14);
    doc.text('お客様情報', 15, 40);
    
    const userInfo = [
      ['お名前', formData.name],
      ['メールアドレス', formData.email],
      ['年齢', `${formData.age}歳`],
      ['家族構成', `${formData.familySize}人家族`],
      ['年収', `${Number(formData.annualIncome).toLocaleString()}万円`],
      ['貯金額', `${Number(formData.savings).toLocaleString()}万円`]
    ];
    
    // 条件付きでデータを追加
    if (formData.mortgageLoanBalance) {
      userInfo.push(['住宅ローン残高', `${Number(formData.mortgageLoanBalance).toLocaleString()}万円`]);
    }
    
    if (formData.monthlyMortgagePayment) {
      userInfo.push(['住宅ローン月額返済額', `${Number(formData.monthlyMortgagePayment).toLocaleString()}万円`]);
    }
    
    if (formData.otherDebts) {
      userInfo.push(['その他負債額', `${Number(formData.otherDebts).toLocaleString()}万円`]);
    }
    
    // autoTableを使用してテーブルを描画
    autoTable(doc, {
      startY: 45,
      head: [['項目', '内容']],
      body: userInfo,
      theme: 'striped',
      headStyles: { fillColor: [66, 139, 202] },
      margin: { left: 15, right: 15 }
    });
    
    // 診断結果
    const finalY = (doc as any).lastAutoTable.finalY || 45;
    doc.setFontSize(16);
    doc.text('診断結果', 15, finalY + 20);
    
    doc.setFontSize(20);
    doc.setTextColor(255, 0, 0);
    doc.text(`MAX予算ライン: ${result.maxBudget.toLocaleString()}円`, 105, finalY + 40, { align: 'center' });
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    
    // 推奨事項
    doc.text('推奨事項:', 15, finalY + 60);
    
    // 長いテキストを複数行に分割して表示
    const recommendation = result.recommendation;
    const maxWidth = 180;
    const splitText = doc.splitTextToSize(recommendation, maxWidth);
    doc.text(splitText, 15, finalY + 70);
    
    // 補足説明
    doc.text('※この診断結果はあくまで参考値です。詳細は専門家にご相談ください。', 15, finalY + 90);
    doc.text('※次のステップとして、住宅購入に関する詳細な相談をお勧めします。', 15, finalY + 100);
    
    // フッター
    doc.setFontSize(10);
    doc.text('AI簡易住宅予算診断ツール', 105, 280, { align: 'center' });
    doc.text('診断日: ' + new Date().toLocaleDateString('ja-JP'), 105, 285, { align: 'center' });
    
    return doc.output('blob');
  } catch (error) {
    console.error('PDFの生成中にエラーが発生しました:', error);
    // エラーが発生しても空のPDFを返す
    const doc = new jsPDF();
    doc.text('診断結果の生成中にエラーが発生しました', 20, 20);
    return doc.output('blob');
  }
}; 