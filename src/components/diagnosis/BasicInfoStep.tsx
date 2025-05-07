'use client';

import React from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

interface BasicInfoStepProps {
  formData: {
    name: string;
    email: string;
  };
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNext: () => void;
  onBack: () => void;
  errors: {
    name?: string;
    email?: string;
  };
}

const BasicInfoStep: React.FC<BasicInfoStepProps> = ({
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
      <h2 className="text-2xl font-bold mb-4">基本情報</h2>
      
      <form onSubmit={handleSubmit}>
        <Input
          label="お名前"
          name="name"
          type="text"
          placeholder="山田 太郎"
          value={formData.name}
          onChange={onChange}
          required
          error={errors.name}
        />
        
        <Input
          label="メールアドレス"
          name="email"
          type="email"
          placeholder="example@example.com"
          value={formData.email}
          onChange={onChange}
          required
          error={errors.email}
          helpText="診断結果をこのメールアドレスに送信します"
        />
        
        <div className="mt-6 flex justify-between">
          <Button type="button" variant="outline" onClick={onBack}>
            戻る
          </Button>
          <Button type="submit">
            次へ
          </Button>
        </div>
      </form>
    </div>
  );
};

export default BasicInfoStep; 