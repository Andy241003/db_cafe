import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: 'danger' | 'warning' | 'primary';
  onConfirm: () => void;
  onCancel: () => void;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmVariant = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    const baseClass = 'px-4 py-2 rounded-lg font-medium transition-all duration-200';
    switch (confirmVariant) {
      case 'danger':
        return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2`;
      case 'warning':
        return `${baseClass} bg-amber-600 text-white hover:bg-amber-700 focus:ring-2 focus:ring-amber-500 focus:ring-offset-2`;
      case 'primary':
        return `${baseClass} bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`;
      default:
        return `${baseClass} bg-red-600 text-white hover:bg-red-700 focus:ring-2 focus:ring-red-500 focus:ring-offset-2`;
    }
  };

  const getIconColor = () => {
    switch (confirmVariant) {
      case 'danger':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-amber-600 bg-amber-100';
      case 'primary':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-red-600 bg-red-100';
    }
  };

  const getIcon = () => {
    switch (confirmVariant) {
      case 'danger':
        return <i className="fas fa-exclamation-triangle"></i>;
      case 'warning':
        return <i className="fas fa-exclamation-circle"></i>;
      case 'primary':
        return <i className="fas fa-question-circle"></i>;
      default:
        return <i className="fas fa-exclamation-triangle"></i>;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all duration-300 scale-100 animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Icon */}
          <div className="flex justify-center pt-6 pb-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl ${getIconColor()}`}>
              {getIcon()}
            </div>
          </div>
          
          {/* Content */}
          <div className="px-6 pb-6 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              {title}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {message}
            </p>
          </div>
          
          {/* Actions */}
          <div className="flex gap-3 px-6 pb-6">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all duration-200 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 ${getConfirmButtonClass()}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
      
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
};

export default ConfirmModal;

