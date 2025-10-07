// src/components/analytics/RealTimeStats.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircle, faEye, faUsers } from '@fortawesome/free-solid-svg-icons';

interface RealTimeStatsProps {
  activeUsers: number;
  currentPageViews: number;
}

const RealTimeStats: React.FC<RealTimeStatsProps> = ({ 
  activeUsers, 
  currentPageViews 
}) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faCircle} className="text-green-500 text-xs animate-pulse" />
          Real-time Activity
        </h4>
        <span className="text-xs text-gray-500">Live</span>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FontAwesomeIcon icon={faUsers} className="text-blue-500 text-sm" />
            <span className="text-xs text-gray-600">Active Users</span>
          </div>
          <div className="text-lg font-bold text-gray-800">{activeUsers.toLocaleString()}</div>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-1">
            <FontAwesomeIcon icon={faEye} className="text-green-500 text-sm" />
            <span className="text-xs text-gray-600">Page Views</span>
          </div>
          <div className="text-lg font-bold text-gray-800">{currentPageViews.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeStats;