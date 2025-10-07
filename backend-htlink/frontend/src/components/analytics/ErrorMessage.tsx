// src/components/analytics/ErrorMessage.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faRedo } from '@fortawesome/free-solid-svg-icons';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ message, onRetry }) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
      <FontAwesomeIcon icon={faExclamationTriangle} className="text-red-500 text-3xl mb-4" />
      <h3 className="text-red-800 font-semibold mb-2">Error Loading Analytics</h3>
      <p className="text-red-600 text-sm text-center mb-4 max-w-md">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          <FontAwesomeIcon icon={faRedo} />
          Try Again
        </button>
      )}
    </div>
  );
};

export default ErrorMessage;