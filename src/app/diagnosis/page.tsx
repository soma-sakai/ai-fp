'use client';

import React from 'react';
import DiagnosisSteps from '@/components/diagnosis/DiagnosisSteps';

export default function DiagnosisPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-8">住宅予算AI診断</h1>
      <DiagnosisSteps />
    </div>
  );
}
