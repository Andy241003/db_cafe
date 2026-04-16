import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { FormEvent } from 'react';
import { authAPI } from '../services/api';
import { useAuth } from '../hooks/useAuth';
import { getApiBaseUrl } from '../utils/api';

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginError {
  message: string;
  type: 'auth' | 'tenant' | 'service' | 'network';
}

// Custom hooks for login logic
const useLoginForm = () => {
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData({ email: '', password: '' });
  }, []);

  return { formData, handleInputChange, resetForm };
};

const useLoginProcess = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<LoginError | null>(null);
  const { login } = useAuth();
  const loginInFlightRef = useRef(false);

  const clearError = useCallback(() => setError(null), []);

  const setLoginError = useCallback((message: string, type: LoginError['type'] = 'auth') => {
    setError({ message, type });
  }, []);

  const performLogin = useCallback(async (credentials: LoginFormData): Promise<any> => {
    try {
      await authAPI.login({
        username: credentials.email,
        password: credentials.password
      });
      
      return await authAPI.getCurrentUser();
    } catch (err: any) {
      throw {
        type: 'auth',
        message: err.response?.data?.detail || err.message || 'Login failed'
      };
    }
  }, []);

  const fetchTenantData = useCallback(async (tenantId: number): Promise<any> => {
    try {
      const tenantUrl = `${getApiBaseUrl()}/tenants/${tenantId}`;
      const response = await fetch(tenantUrl, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw {
            type: 'tenant',
            message: `Your account is assigned to a tenant that no longer exists (ID: ${tenantId}). Please contact administrator.`
          };
        }
        throw {
          type: 'tenant',
          message: 'Failed to load tenant information. Please try again.'
        };
      }

      return await response.json();
    } catch (error: any) {
      throw error.type ? error : {
        type: 'tenant',
        message: 'Network error while loading tenant data.'
      };
    }
  }, []);

  const fetchServiceAccess = useCallback(async () => {
    try {
      return await authAPI.getUserServices();
    } catch (error) {
      console.warn('Failed to load service access, using defaults:', error);
      return {
        service_access: 0,
        available_services: ['travel-link']
      };
    }
  }, []);

  const saveUserData = useCallback((userData: any) => {
    localStorage.setItem('user', JSON.stringify(userData));
  }, []);

  const saveTenantData = useCallback((tenantData: any, tenantId: number) => {
    localStorage.setItem('tenant_code', tenantData.code);
    localStorage.setItem('tenant_id', tenantId.toString());
    localStorage.setItem('tenant_name', tenantData.name || tenantData.code);
  }, []);

  const saveServiceData = useCallback((serviceData: any) => {
    localStorage.setItem('service_access', serviceData.service_access.toString());
    localStorage.setItem('available_services', JSON.stringify(serviceData.available_services));
  }, []);

  const redirectToDashboard = useCallback(() => {
    // Trigger auth state change
    login();
    
    // Multiple redirect strategies for reliability
    const redirect = () => window.location.href = '/dashboard-selection';
    
    // Immediate redirect
    redirect();
    
    // Fallback redirects
    setTimeout(() => {
      if (window.location.pathname === '/login') {
        window.location.replace('/dashboard-selection');
      }
    }, 100);
    
    setTimeout(() => {
      if (window.location.pathname === '/login') {
        window.location.reload();
      }
    }, 1000);
  }, [login]);

  const executeLogin = useCallback(async (formData: LoginFormData) => {
    if (loginInFlightRef.current || isLoading) {
      return;
    }
    loginInFlightRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Authenticate user
      const userData = await performLogin(formData);
      saveUserData(userData);

      // Step 2: Load tenant data
      const tenantData = await fetchTenantData(userData.tenant_id);
      saveTenantData(tenantData, userData.tenant_id);

      // Step 3: Load service access
      const serviceData = await fetchServiceAccess();
      saveServiceData(serviceData);

      // Step 4: Redirect to dashboard
      redirectToDashboard();

    } catch (err: any) {
      console.error('Login error:', err);
      setLoginError(err.message, err.type);
    } finally {
      loginInFlightRef.current = false;
      setIsLoading(false);
    }
  }, [
    performLogin, fetchTenantData, fetchServiceAccess,
    saveUserData, saveTenantData, saveServiceData,
    redirectToDashboard, setLoginError, isLoading
  ]);

  return {
    isLoading,
    error,
    executeLogin,
    clearError
  };
};

// Components
interface LoginFormProps {
  formData: LoginFormData;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: FormEvent) => void;
  isLoading: boolean;
  error: LoginError | null;
}

const LoginForm: React.FC<LoginFormProps> = ({
  formData,
  onInputChange,
  onSubmit,
  isLoading,
  error
}) => (
  <div className="font-sans bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center min-h-screen p-5">
    <div className="bg-white w-full max-w-md py-12 px-9 rounded-2xl shadow-2xl">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Hotel Dashboard Login</h2>
      </div>

      {error && (
        <div className={`mb-4 p-3 border rounded-lg ${
          error.type === 'auth' ? 'bg-red-100 border-red-400 text-red-700' :
          error.type === 'tenant' ? 'bg-yellow-100 border-yellow-400 text-yellow-700' :
          'bg-red-100 border-red-400 text-red-700'
        }`}>
          {error.message}
        </div>
      )}
      
      <form onSubmit={onSubmit}>
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
          <input 
            type="email" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white placeholder-gray-400" 
            name="email"
            id="email" 
            placeholder="test@demo.com" 
            required
            value={formData.email}
            onChange={onInputChange}
            disabled={isLoading}
          />
        </div>
        
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
          <input 
            type="password" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white placeholder-gray-400" 
            name="password"
            id="password" 
            placeholder="Enter your password" 
            required
            value={formData.password}
            onChange={onInputChange}
            disabled={isLoading}
          />
        </div>

        <div className="mt-2">
          <button 
            type="submit" 
            disabled={isLoading}
            className="w-full bg-blue-500 text-white border-none px-4 py-3 rounded-lg cursor-pointer text-base font-medium transition-colors duration-200 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Logging in...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 3a1 1 0 011 1v12a1 1 0 11-2 0V4a1 1 0 011-1zm7.707 3.293a1 1 0 010 1.414L9.414 9H17a1 1 0 110 2H9.414l1.293 1.293a1 1 0 01-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Login
              </>
            )}
          </button>
        </div>
      </form>
      
      <div className="text-center mt-5 text-sm text-gray-600">
        <p>
          Forgot your password? 
          <button 
            type="button"
            className="text-blue-500 ml-1 hover:underline bg-none border-none cursor-pointer"
            onClick={() => alert('Reset password functionality would be implemented here')}
          >
            Reset
          </button>
        </p>
      </div>
    </div>
  </div>
);

const Login: React.FC = () => {
  const { formData, handleInputChange, resetForm } = useLoginForm();
  const { isLoading, error, executeLogin, clearError } = useLoginProcess();

  // Clear localStorage on mount
  useEffect(() => {
    localStorage.clear();
  }, []);

  // Clear error when form data changes
  useEffect(() => {
    if (error) {
      clearError();
    }
  }, [formData.email, formData.password, error, clearError]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    executeLogin(formData);
  }, [executeLogin, formData]);

  return (
    <LoginForm
      formData={formData}
      onInputChange={handleInputChange}
      onSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
    />
  );
};

export default Login;
