'use client';

import React from 'react';
import Checkbox from '../ui/Checkbox';
import Button from '../ui/Button';

interface PrivacyPolicyStepProps {
  agreeToPrivacyPolicy: boolean;
  onAgreeChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
}

const PrivacyPolicyStep: React.FC<PrivacyPolicyStepProps> = ({
  agreeToPrivacyPolicy,
  onAgreeChange,
  onNext,
}) => {
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">プライバシーポリシー</h2>
      
      <div className="mb-6 h-64 overflow-y-auto p-4 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold mb-2">AI簡易住宅予算診断ツール プライバシーポリシー</h3>
        
        <p className="mb-4">
          当社は、お客様の個人情報を大切に取り扱い、個人情報保護に関する法令および社内規程を遵守いたします。
        </p>
        
        <h4 className="text-md font-medium mb-2">1. 収集する情報</h4>
        <p className="mb-3">
          当社は、AI簡易住宅予算診断ツールの利用にあたり、以下の情報を収集します。
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>お名前</li>
          <li>メールアドレス</li>
          <li>年齢</li>
          <li>家族構成</li>
          <li>年収</li>
          <li>貯金額</li>
          <li>住宅ローン残高（該当する場合）</li>
          <li>住宅ローン月額返済額（該当する場合）</li>
          <li>その他負債額（該当する場合）</li>
        </ul>
        
        <h4 className="text-md font-medium mb-2">2. 収集目的</h4>
        <p className="mb-4">
          収集した情報は、以下の目的で利用いたします。
        </p>
        <ul className="list-disc pl-5 mb-4">
          <li>住宅予算診断の実施</li>
          <li>診断結果の提供</li>
          <li>お客様への適切な情報提供とサービス向上</li>
          <li>当社からのお知らせや営業担当者との日程調整</li>
        </ul>
        
        <h4 className="text-md font-medium mb-2">3. 第三者提供</h4>
        <p className="mb-4">
          当社は、法令に基づく場合を除き、お客様の同意なく個人情報を第三者に提供することはありません。
        </p>
        
        <h4 className="text-md font-medium mb-2">4. セキュリティ</h4>
        <p className="mb-4">
          当社は、お客様の個人情報を安全に管理するため、適切なセキュリティ対策を講じています。
        </p>
        
        <h4 className="text-md font-medium mb-2">5. お問い合わせ</h4>
        <p className="mb-4">
          プライバシーポリシーに関するお問い合わせは、下記までご連絡ください。<br />
          メール: privacy@example.com
        </p>
      </div>
      
      <Checkbox
        name="agreeToPrivacyPolicy"
        checked={agreeToPrivacyPolicy}
        onChange={onAgreeChange}
        label={<span>上記のプライバシーポリシーに同意します</span>}
        required={true}
      />
      
      <div className="mt-6">
        <Button
          type="button"
          onClick={onNext}
          disabled={!agreeToPrivacyPolicy}
          fullWidth={true}
        >
          同意して次へ進む
        </Button>
      </div>
    </div>
  );
};

export default PrivacyPolicyStep; 