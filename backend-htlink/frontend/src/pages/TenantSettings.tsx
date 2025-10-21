// src/pages/TenantSettings.tsx
import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faSave, 
  faSpinner, 
  faGlobe,
  faBuilding,
  faCode,
  faLanguage,
  faToggleOn,
  faToggleOff
} from '@fortawesome/free-solid-svg-icons';
import { tenantApi } from '../services/tenantApi';
import type { TenantSettings } from '../services/tenantApi';

interface NotificationState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}

const TenantSettings: React.FC = () => {
  const [settings, setSettings] = useState<TenantSettings | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    default_locale: 'en',
    fallback_locale: 'en',
    is_active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notification, setNotification] = useState<NotificationState>({
    message: '',
    type: 'info',
    visible: false
  });

  const localeOptions = [
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Tiếng Việt' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'es', name: 'Español' },
  ];

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type, visible: true });
    setTimeout(() => {
      setNotification(prev => ({ ...prev, visible: false }));
    }, 4000);
  };

  const loadTenantSettings = async () => {
    try {
      setLoading(true);
      
      // Check if user is authenticated and has tenant info
      const token = localStorage.getItem('access_token');
      const isAuth = localStorage.getItem('isAuthenticated') === 'true';
      const tenantCode = localStorage.getItem('tenant_code');
      
      if (!token || !isAuth || !tenantCode) {
        showNotification('Please login to view tenant settings', 'error');
        return;
      }

      const response = await tenantApi.getCurrentTenant();
      const tenantData = response.data;
      
      setSettings(tenantData);
      setFormData({
        name: tenantData.name || '',
        code: tenantData.code || tenantCode,
        default_locale: tenantData.default_locale || 'en',
        fallback_locale: tenantData.fallback_locale || 'en',
        is_active: tenantData.is_active !== undefined ? tenantData.is_active : true,
      });
      
      // Update localStorage with fresh tenant data
      if (tenantData.code !== tenantCode) {
        localStorage.setItem('tenant_code', tenantData.code);
        localStorage.setItem('tenant_name', tenantData.name || tenantData.code);
      }
      
    } catch (error: any) {
      console.error('Error loading tenant settings:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Failed to load tenant settings';
      showNotification(errorMessage, 'error');
      
      // Reset form if tenant not found
      setSettings(null);
      setFormData({
        name: '',
        code: localStorage.getItem('tenant_code') || '',
        default_locale: 'en',
        fallback_locale: 'en',
        is_active: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await tenantApi.updateCurrentTenant(formData);
      showNotification('Tenant settings updated successfully!', 'success');
      await loadTenantSettings(); // Reload to get updated data
    } catch (error) {
      console.error('Error updating tenant settings:', error);
      showNotification('Failed to update tenant settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  useEffect(() => {
    loadTenantSettings();
  }, []);

  // Listen for auth state changes to reload tenant settings
  useEffect(() => {
    const handleAuthChange = () => {
      // Reload tenant settings when auth state changes (e.g., tenant switch)
      loadTenantSettings();
    };

    // Listen for tenant changes in localStorage
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tenant_code' || e.key === 'tenant_id') {
        loadTenantSettings();
      }
    };

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <FontAwesomeIcon icon={faSpinner} spin size="2x" className="text-blue-600 mb-4" />
          <p className="text-lg font-semibold text-slate-700">Đang tải dữ liệu...</p>
          <p className="text-sm text-slate-500 mt-2">Vui lòng chờ trong giây lát</p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-slate-800 bg-slate-50 min-h-screen">
      {/* Success Message */}
      {notification.visible && (
        <div className={`fixed top-5 right-5 z-[1000] flex items-center gap-2 rounded-lg border ${
          notification.type === 'success' ? 'border-green-200 bg-green-100 text-green-800' :
          notification.type === 'error' ? 'border-red-200 bg-red-100 text-red-800' :
          'border-blue-200 bg-blue-100 text-blue-800'
        } p-3`}>
          <i className={`fas ${
            notification.type === 'success' ? 'fa-check-circle' :
            notification.type === 'error' ? 'fa-exclamation-circle' :
            'fa-info-circle'
          }`}></i>
          {notification.message}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        {/* Breadcrumb */}
        <nav className="mb-4 text-sm">
          <ol className="flex items-center gap-2 text-slate-500">
            <li><a href="/" className="hover:text-blue-600">Dashboard</a></li>
            <li><i className="fas fa-chevron-right text-xs"></i></li>
            <li><a href="/settings" className="hover:text-blue-600">Management</a></li>
            <li><i className="fas fa-chevron-right text-xs"></i></li>
            <li className="text-slate-900">Tenant Settings</li>
          </ol>
        </nav>

        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Tenant Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your organization settings and preferences</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={loadTenantSettings}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <FontAwesomeIcon icon={faSpinner} className="animate-spin" />
              ) : (
                <i className="fas fa-sync-alt"></i>
              )}
              Refresh
            </button>
            <a
              href="/settings"
              className="rounded-lg bg-slate-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 flex items-center gap-2"
            >
              <i className="fas fa-cog"></i>
              Property Settings
            </a>
          </div>
        </div>

        {/* Main Settings Content */}
        <div className="grid gap-6">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                  <FontAwesomeIcon icon={faBuilding} />
                </div>
                Basic Information
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Organization Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter organization name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  <FontAwesomeIcon icon={faCode} className="mr-2" />
                  Tenant Code
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => handleInputChange('code', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter tenant code"
                />
                <p className="mt-1 text-xs text-slate-500">
                  Used for API access and domain identification
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-700 text-white">
                  <FontAwesomeIcon icon={faLanguage} />
                </div>
                Localization Settings
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Default Language
                </label>
                <select
                  value={formData.default_locale}
                  onChange={(e) => handleInputChange('default_locale', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {localeOptions.map(locale => (
                    <option key={locale.code} value={locale.code}>
                      {locale.name} ({locale.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Fallback Language
                </label>
                <select
                  value={formData.fallback_locale}
                  onChange={(e) => handleInputChange('fallback_locale', e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                >
                  {localeOptions.map(locale => (
                    <option key={locale.code} value={locale.code}>
                      {locale.name} ({locale.code})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-700 text-white">
                  <FontAwesomeIcon icon={faGlobe} />
                </div>
                Status & Information
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-slate-900">Active Status</h3>
                  <p className="text-sm text-slate-500">Enable or disable this tenant</p>
                </div>
                <button
                  onClick={() => handleInputChange('is_active', !formData.is_active)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                    formData.is_active 
                      ? 'bg-green-100 text-green-800 hover:bg-green-200' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <FontAwesomeIcon 
                    icon={formData.is_active ? faToggleOn : faToggleOff} 
                    className={formData.is_active ? 'text-green-600' : 'text-slate-400'} 
                  />
                  {formData.is_active ? 'Active' : 'Inactive'}
                </button>
              </div>

              {settings && (
                <div className="space-y-3 text-sm">
                  <div>
                    <span className="font-medium text-slate-600">ID:</span>
                    <span className="ml-2 text-slate-900">{settings.id}</span>
                  </div>
                  <div>
                    <span className="font-medium text-slate-600">Created:</span>
                    <span className="ml-2 text-slate-900">
                      {new Date(settings.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  {settings.updated_at && (
                    <div>
                      <span className="font-medium text-slate-600">Updated:</span>
                      <span className="ml-2 text-slate-900">
                        {new Date(settings.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {settings.plan_id && (
                    <div>
                      <span className="font-medium text-slate-600">Plan ID:</span>
                      <span className="ml-2 text-slate-900">{settings.plan_id}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Save Button Section */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <a
              href="/settings"
              className="rounded-lg bg-slate-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-slate-700 flex items-center justify-center gap-2"
            >
              <i className="fas fa-arrow-left"></i>
              Back to Properties
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {saving ? (
                <>
                  <FontAwesomeIcon icon={faSpinner} spin />
                  Saving...
                </>
              ) : (
                <>
                  <FontAwesomeIcon icon={faSave} />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default TenantSettings;