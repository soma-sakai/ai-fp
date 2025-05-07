import { jsPDF } from 'jspdf';
// autoTableを個別にインポート
import autoTable from 'jspdf-autotable';
import { BudgetDiagnosisResult, DiagnosisFormData } from '@/types';
import html2canvas from 'html2canvas';

/**
 * HTMLをPDFに変換する関数
 */
const renderHTMLToPDF = async (
  htmlContent: string, 
  fileName: string = '住宅予算診断結果.pdf'
): Promise<Blob> => {
  // 一時的なHTML要素を作成
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;
  tempDiv.style.position = 'absolute';
  tempDiv.style.left = '-9999px';
  tempDiv.style.width = '794px'; // A4幅に相当するピクセル数
  tempDiv.style.fontFamily = 'sans-serif';
  
  // DOMに追加
  document.body.appendChild(tempDiv);
  
  try {
    // HTML2Canvasでキャンバスに変換
    const canvas = await html2canvas(tempDiv, {
      scale: 1.5, // 高解像度
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff'
    });
    
    // キャンバスのサイズを取得
    const imgWidth = 210; // A4幅（mm）
    const pageHeight = 297; // A4高さ（mm）
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    // 複数ページに分割する必要があるか確認
    const pdfDoc = new jsPDF('p', 'mm', 'a4');
    let position = 0;
    
    // 1ページに収まらない場合は複数ページに分割
    while (position < imgHeight) {
      // 新しいページでない場合（最初のページを除く）
      if (position > 0) {
        pdfDoc.addPage();
      }
      
      // データURLからイメージを取得
      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      // 現在のページにイメージの一部を追加
      pdfDoc.addImage(
        imgData, 'JPEG', 
        0, -position, // x, y座標
        imgWidth, imgHeight // 幅、高さ
      );
      
      // 次のページのための位置を更新
      position += pageHeight;
    }
    
    // PDFデータを取得
    return pdfDoc.output('blob');
  } finally {
    // 一時要素を削除
    if (tempDiv && tempDiv.parentNode) {
      tempDiv.parentNode.removeChild(tempDiv);
    }
  }
};

/**
 * 予算診断結果のPDFを生成する関数
 */
export const generatePDF = async (
  formData: DiagnosisFormData, 
  result: BudgetDiagnosisResult
): Promise<Blob> => {
  try {
    // 診断結果をHTML形式で作成（日本語テキスト）
    const resultHtml = `
      <div style="font-family: sans-serif; color: #333; max-width: 700px; margin: 0 auto; padding: 20px;">
        <h1 style="text-align: center; font-size: 24px; margin-bottom: 30px;">住宅予算診断結果</h1>
        
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">お客様情報</h2>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; width: 40%; background-color: #f9f9f9;">お名前</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">メールアドレス</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.email}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">年齢</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.age}歳</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">家族構成</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${formData.familySize}人家族</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">年収</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${Number(formData.annualIncome).toLocaleString()}円</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">貯金額</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${Number(formData.savings).toLocaleString()}円</td>
            </tr>
            ${formData.mortgageLoanBalance ? `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">住宅ローン残高</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${Number(formData.mortgageLoanBalance).toLocaleString()}円</td>
            </tr>
            ` : ''}
            ${formData.monthlyMortgagePayment ? `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">住宅ローン月額返済額</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${Number(formData.monthlyMortgagePayment).toLocaleString()}円</td>
            </tr>
            ` : ''}
            ${formData.otherDebts ? `
            <tr>
              <td style="padding: 8px 12px; border: 1px solid #ddd; background-color: #f9f9f9;">その他負債額</td>
              <td style="padding: 8px 12px; border: 1px solid #ddd;">${Number(formData.otherDebts).toLocaleString()}円</td>
            </tr>
            ` : ''}
          </table>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">診断結果</h2>
          <div style="text-align: center; margin: 25px 0;">
            <div style="font-size: 22px; font-weight: bold; color: #e53e3e;">
              MAX予算ライン: ${result.maxBudget.toLocaleString()}円
            </div>
          </div>
        </div>
        
        <div style="margin-bottom: 30px;">
          <h2 style="font-size: 18px; margin-bottom: 15px; border-bottom: 1px solid #ddd; padding-bottom: 5px;">推奨事項</h2>
          <p style="line-height: 1.6; margin-bottom: 20px;">${result.recommendation}</p>
        </div>
        
        <div style="margin-top: 40px; font-size: 12px; color: #666;">
          <p>※この診断結果はあくまで参考値です。詳細は専門家にご相談ください。</p>
          <p>※次のステップとして、住宅購入に関する詳細な相談をお勧めします。</p>
        </div>
        
        <div style="margin-top: 50px; text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">
          AI簡易住宅予算診断ツール<br>
          診断日: ${new Date().toLocaleDateString('ja-JP')}
        </div>
      </div>
    `;
    
    // HTMLをPDFに変換
    return await renderHTMLToPDF(resultHtml);
  } catch (error) {
    console.error('PDFの生成中にエラーが発生しました:', error);
    // エラーが発生しても空のPDFを返す
    const doc = new jsPDF();
    doc.text('診断結果の生成中にエラーが発生しました', 20, 20);
    return doc.output('blob');
  }
}; 