import React from 'react';
import { AlertCircle, CheckCircle, InfoIcon, X } from 'lucide-react';

const Alert = ({ type = 'info', title, message, onClose, className = '' }) => {
  const styles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800'
  };

  const icons = {
    error: <AlertCircle className="text-red-600" />,
    success: <CheckCircle className="text-green-600" />,
    warning: <AlertCircle className="text-yellow-600" />,
    info: <InfoIcon className="text-blue-600" />
  };

  return (
    <div className={`border rounded-lg p-4 flex items-start space-x-3 ${styles[type]} ${className} animate-slide-in`}>
      <div className="flex-shrink-0 mt-0.5">
        {icons[type]}
      </div>
      <div className="flex-1">
        {title && <h3 className="font-semibold">{title}</h3>}
        {message && <p className="text-sm mt-1">{message}</p>}
      </div>
      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-current opacity-70 hover:opacity-100 transition"
        >
          <X size={18} />
        </button>
      )}
    </div>
  );
};

export default Alert;
