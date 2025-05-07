import React from 'react';
import { 
  CalendarIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  CurrencyYenIcon,
  UserGroupIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';

interface FeatureProps {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const Feature: React.FC<FeatureProps> = ({ icon, title, description }) => {
  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <div className="w-12 h-12 text-blue-600 mb-4">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
};

const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: <ChartBarIcon className="w-12 h-12" />,
      title: '正確な予算診断',
      description: '年収、家族構成、負債状況などを考慮して、あなたにぴったりの住宅予算を提案します。',
    },
    {
      icon: <DocumentTextIcon className="w-12 h-12" />,
      title: 'レポートのダウンロード',
      description: '診断結果はPDFでダウンロードできるので、後から確認したり、家族と共有したりすることができます。',
    },
    {
      icon: <CalendarIcon className="w-12 h-12" />,
      title: 'FPとの日程調整',
      description: '診断後すぐにファイナンシャルプランナーとの相談日程を調整できます。',
    },
    {
      icon: <CurrencyYenIcon className="w-12 h-12" />,
      title: '返済負担率の考慮',
      description: '年収に対する返済負担率を30%以内に保つよう計算し、無理のない予算を提案します。',
    },
    {
      icon: <UserGroupIcon className="w-12 h-12" />,
      title: '家族構成に応じた提案',
      description: '家族の人数に合わせて、必要な広さや予算を考慮した診断結果を提供します。',
    },
    {
      icon: <AcademicCapIcon className="w-12 h-12" />,
      title: 'AIによる高精度な計算',
      description: '複雑な計算もAIが瞬時に行い、最適な住宅予算を算出します。',
    },
  ];

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">AIによる住宅予算診断の特徴</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            複雑な計算は必要ありません。簡単な質問に答えるだけで、あなたの最適な住宅予算を診断します。
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Feature
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection; 