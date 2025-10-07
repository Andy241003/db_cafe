// src/components/analytics/DebugPanel.tsx
import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBug, faTimes, faPlay, faKey, faBuilding } from '@fortawesome/free-solid-svg-icons';

interface DebugPanelProps {
  onTestApi: () => void;
  onSetupAuth: (token: string, tenantId: string) => void;
  onClearAuth: () => void;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ onTestApi, onSetupAuth, onClearAuth }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [token, setToken] = useState('');
  const [tenantId, setTenantId] = useState('');

  if (!isOpen) {
    return (
      <div className="fixed top-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg shadow-lg hover:bg-purple-700 transition-colors"
        >
          <FontAwesomeIcon icon={faBug} />
          <span className="text-sm">Debug</span>
        </button>
      </div>
    );
  }

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 w-80">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-semibold text-gray-800 flex items-center gap-2">
          <FontAwesomeIcon icon={faBug} className="text-purple-600" />
          Debug Panel
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-400 hover:text-gray-600"
        >
          <FontAwesomeIcon icon={faTimes} />
        </button>
      </div>

      <div className="space-y-4">
        {/* Auth Setup */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Authentication</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Access Token</label>
              <input
                type="text"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Bearer token..."
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Tenant ID</label>
              <input
                type="text"
                value={tenantId}
                onChange={(e) => setTenantId(e.target.value)}
                placeholder="tenant-uuid"
                className="w-full px-2 py-1 text-xs border border-gray-300 rounded"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  onSetupAuth(token, tenantId);
                  setToken('');
                  setTenantId('');
                }}
                disabled={!token || !tenantId}
                className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <FontAwesomeIcon icon={faKey} className="mr-1" />
                Setup Auth
              </button>
              <button
                onClick={onClearAuth}
                className="flex-1 px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
              >
                Clear Auth
              </button>
            </div>
          </div>
        </div>

        {/* API Testing */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">API Testing</h4>
          <button
            onClick={onTestApi}
            className="w-full px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <FontAwesomeIcon icon={faPlay} />
            Test Analytics API
          </button>
        </div>

        {/* Current Status */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Status</h4>
          <div className="text-xs space-y-1">
            <div className="flex justify-between">
              <span>Token:</span>
              <span className={localStorage.getItem('access_token') ? 'text-green-600' : 'text-red-600'}>
                {localStorage.getItem('access_token') ? 'Set' : 'Not Set'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Tenant:</span>
              <span className={localStorage.getItem('tenant_id') ? 'text-green-600' : 'text-red-600'}>
                {localStorage.getItem('tenant_id') ? 'Set' : 'Not Set'}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Setup */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Quick Setup</h4>
          <button
            onClick={() => {
              onSetupAuth('demo-token', 'demo-tenant-id');
            }}
            className="w-full px-2 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            <FontAwesomeIcon icon={faBuilding} className="mr-1" />
            Use Demo Credentials
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugPanel;