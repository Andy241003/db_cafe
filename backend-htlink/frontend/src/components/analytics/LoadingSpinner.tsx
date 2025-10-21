// src/components/analytics/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'medium', 
  text = 'Đang tải dữ liệu...' 
}) => {
  const sizeClasses = {
    small: 'w-4 h-4',
    medium: 'w-8 h-8',
    large: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center p-8">
      <div className={`${sizeClasses[size]} border-3 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3`}></div>
      <p className="text-lg font-semibold text-slate-700">{text}</p>
      <p className="text-sm text-slate-500 mt-1">Vui lòng chờ trong giây lát</p>
    </div>
  );
};

export default LoadingSpinner;