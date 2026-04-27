// src/components/ActivityTestPanel.tsx
import React, { useState } from 'react';
import { analyticsAPI } from '../services/api';

const ActivityTestPanel: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string>('');

  const testRecentActivities = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const activities = await analyticsAPI.getRecentActivities(10);
      setResult({
        type: 'Recent Activities',
        data: activities,
        count: activities.length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recent activities');
    } finally {
      setLoading(false);
    }
  };

  const testAllActivities = async () => {
    setLoading(true);
    setError('');
    setResult(null);
    
    try {
      const activities = await analyticsAPI.getAllActivities(50, 30);
      setResult({
        type: 'All Activities (30 days)',
        data: activities,
        count: activities.length
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch all activities');
    } finally {
      setLoading(false);
    }
  };

  const testDirectAPI = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/activity-logs/public?limit=10&days=7&tenant_id=1', {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult({
        type: 'Direct API Call (Public)',
        data: data,
        count: Array.isArray(data) ? data.length : 'N/A'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to call API directly');
    } finally {
      setLoading(false);
    }
  };

  const seedSampleData = async () => {
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await fetch('/api/v1/activity-logs/public/seed?count=15&tenant_id=1', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setResult({
        type: 'Seed Sample Data (Public)',
        data: data,
        count: data.count || 'N/A'
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to seed sample data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 bg-white border border-slate-200 rounded-lg">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Activity API Test Panel</h3>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={testRecentActivities}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          Test Recent Activities
        </button>

        <button
          onClick={testAllActivities}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Test All Activities
        </button>

        <button
          onClick={testDirectAPI}
          disabled={loading}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          Test Direct API
        </button>

        <button
          onClick={seedSampleData}
          disabled={loading}
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
        >
          Seed Sample Data
        </button>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div className="mt-4">
          <h4 className="font-semibold text-slate-900 mb-2">
            {result.type} - Count: {result.count}
          </h4>
          <pre className="bg-slate-100 p-4 rounded text-sm overflow-auto max-h-96">
            {JSON.stringify(result.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default ActivityTestPanel;

