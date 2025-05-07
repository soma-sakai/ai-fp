import React from 'react';

interface ProgressBarProps {
  steps: string[];
  currentStep: number;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ steps, currentStep }) => {
  const progress = ((currentStep) / (steps.length - 1)) * 100;
  
  return (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {steps.map((step, index) => (
          <div
            key={index}
            className={`relative flex flex-col items-center ${
              index === 0 ? 'justify-start' : index === steps.length - 1 ? 'justify-end' : 'justify-center'
            }`}
          >
            <div
              className={`z-10 flex items-center justify-center w-8 h-8 rounded-full ${
                index <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-500'
              }`}
            >
              {index + 1}
            </div>
            <p
              className={`mt-2 text-xs font-medium ${
                index <= currentStep ? 'text-blue-600' : 'text-gray-500'
              }`}
            >
              {step}
            </p>
          </div>
        ))}
      </div>
      <div className="relative w-full h-2 bg-gray-200 rounded-full">
        <div
          className="absolute top-0 left-0 h-2 bg-blue-600 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
    </div>
  );
};

export default ProgressBar; 