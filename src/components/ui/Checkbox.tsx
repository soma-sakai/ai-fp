import React, { ChangeEvent } from 'react';

interface CheckboxProps {
  label: React.ReactNode;
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
  error?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  name,
  checked,
  onChange,
  required = false,
  error,
}) => {
  return (
    <div className="mb-4">
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            id={name}
            name={name}
            type="checkbox"
            checked={checked}
            onChange={onChange}
            required={required}
            className="h-4 w-4 text-gray-800 border-gray-300 rounded focus:ring-gray-500"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={name} className="text-gray-700">
            {label}
            {required && <span className="text-gray-800 ml-1">*</span>}
          </label>
        </div>
      </div>
      {error && <p className="mt-1 text-sm text-gray-800">{error}</p>}
    </div>
  );
};

export default Checkbox; 