import React, { ChangeEvent } from 'react';

interface InputProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'number' | 'tel' | 'password';
  placeholder?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
  min?: number;
  max?: number;
  step?: number;
  helpText?: string;
}

const Input: React.FC<InputProps> = ({
  label,
  name,
  type = 'text',
  placeholder,
  value,
  onChange,
  required = false,
  error,
  min,
  max,
  step,
  helpText,
}) => {
  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-gray-800">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        min={min}
        max={max}
        step={step}
        className={`w-full px-3 py-2 border ${
          error ? 'border-gray-800' : 'border-gray-300'
        } rounded-md shadow-sm focus:outline-none focus:ring-gray-500 focus:border-gray-800`}
      />
      {helpText && <p className="mt-1 text-sm text-gray-500">{helpText}</p>}
      {error && <p className="mt-1 text-sm text-gray-800">{error}</p>}
    </div>
  );
};

export default Input; 