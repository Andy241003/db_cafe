// src/components/analytics/ApiStatus.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faWifi, faExclamationTriangle } from '@fortawesome/free-solid-svg-icons';

interface ApiStatusProps {
  isConnected: boolean;
  lastUpdate?: Date;
}

const ApiStatus: React.FC<ApiStatusProps> = ({ isConnected, lastUpdate }) => {
  const [showDetails, setShowDetails] = useState(false);

  const formatLastUpdate = (date?: Date) => {
    if (!date) return 'Never';
    
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div 
        className={`flex items-center gap-2 px-3 py-2 rounded-lg shadow-lg cursor-pointer transition-all ${
          isConnected 
            ? 'bg-green-50 border border-green-200 text-green-700' 
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}
        onClick={() => setShowDetails(!showDetails)}
      >
        <FontAwesomeIcon 
          icon={isConnected ? faWifi : faExclamationTriangle} 
          className="text-sm"
        />
        <FontAwesomeIcon 
          icon={faCircle} 
          className={`text-xs ${isConnected ? 'text-green-500 animate-pulse' : 'text-red-500'}`}
        />
        <span className="text-xs font-medium">
          {isConnected ? 'API Connected' : 'API Offline'}
        </span>
      </div>
      
      {showDetails && (
        <div className="absolute bottom-full mb-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-48">
          <div className="text-xs text-gray-600 space-y-1">
            <div className="flex justify-between">
              <span>Status:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Last Update:</span>
              <span>{formatLastUpdate(lastUpdate)}</span>
            </div>
            <div className="border-t pt-1 mt-2">
              <div className="text-xs text-gray-500">
                {isConnected ? 'Using live data' : 'Using mock data'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiStatus;