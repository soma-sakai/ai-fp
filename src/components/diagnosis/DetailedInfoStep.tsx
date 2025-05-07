'use client';

import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface DetailedInfoStepProps {
  formData: {
    savings: number | '';
    mortgageLoanBalance?: number | '';
    monthlyMortgagePayment?: number | '';
    otherDebts?: number | '';
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: {
    savings?: string;
    mortgageLoanBalance?: string;
    monthlyMortgagePayment?: string;
    otherDebts?: string;
  };
}

const DetailedInfoStep: React.FC<DetailedInfoStepProps> = ({
  formData,
  onChange,
  onNext,
  onBack,
  errors,
}) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">詳細情報</h2>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="貯金額（万円）"
          name="savings"
          type="number"
          placeholder="300"
          value={formData.savings}
          onChange={onChange}
          required
          min={0}
          step={10}
          error={errors.savings}
          helpText="現在の貯金額を万円単位で入力してください"
        />
        
        <Input
          label="住宅ローン残高（万円）"
          name="mortgageLoanBalance"
          type="number"
          placeholder="0"
          value={formData.mortgageLoanBalance === undefined ? '' : formData.mortgageLoanBalance}
          onChange={onChange}
          min={0}
          step={10}
          error={errors.mortgageLoanBalance}
          helpText="現在の住宅ローン残高がある場合、万円単位で入力してください"
        />
        
        <Input
          label="住宅ローン月額返済額（万円）"
          name="monthlyMortgagePayment"
          type="number"
          placeholder="0"
          value={formData.monthlyMortgagePayment === undefined ? '' : formData.monthlyMortgagePayment}
          onChange={onChange}
          min={0}
          step={0.1}
          error={errors.monthlyMortgagePayment}
          helpText="現在の住宅ローン月額返済額がある場合、万円単位で入力してください"
        />
        
        <Input
          label="その他負債額（万円）"
          name="otherDebts"
          type="number"
          placeholder="0"
          value={formData.otherDebts === undefined ? '' : formData.otherDebts}
          onChange={onChange}
          min={0}
          step={10}
          error={errors.otherDebts}
          helpText="カードローンや教育ローンなど、その他の負債の合計額を万円単位で入力してください"
        />
        
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            戻る
          </Button>
          <Button type="submit">
            診断結果を見る
          </Button>
        </div>
      </form>
    </div>
  );
};

export default DetailedInfoStep; 