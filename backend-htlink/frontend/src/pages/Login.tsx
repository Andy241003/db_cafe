// Login.tsx - Updated to use Backend API
import React, { useState } from 'react';
import type { FormEvent } from 'react';
import { authAPI } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// TypeScript interfaces for type safety
interface LoginFormData {
  email: string;
  password: string;
}

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  
  // State management for form data
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  // doLogin function with real API
  const doLogin = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      console.log('Attempting login...');
      
      // Step 1: Login without tenant (backend will identify user's tenant)
      await authAPI.login({
        username: formData.email,
        password: formData.password
      });

      // Step 2: Get user data to determine tenant
      const userData = await authAPI.getCurrentUser();
      console.log('Login successful:', userData);
      
      // Step 3: Get tenant data from backend based on user's tenant_id
      try {
        const tenantResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/v1/tenants/${userData.tenant_id}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (tenantResponse.ok) {
          const tenantData = await tenantResponse.json();
          console.log('Tenant data from backend:', tenantData);
          
          // Save tenant info to localStorage
          localStorage.setItem('tenant_code', tenantData.code);
          localStorage.setItem('tenant_id', userData.tenant_id.toString());
          localStorage.setItem('tenant_name', tenantData.name || tenantData.code);
          
          console.log(`✅ User belongs to tenant: ${tenantData.code} (ID: ${userData.tenant_id}, Name: ${tenantData.name})`);
        } else if (tenantResponse.status === 404) {
          console.error('❌ Tenant not found! User assigned to deleted tenant.');
          throw new Error(`Your account is assigned to a tenant that no longer exists (ID: ${userData.tenant_id}). Please contact administrator.`);
        } else {
          console.error('Failed to fetch tenant data, response:', tenantResponse.status);
          throw new Error('Failed to load tenant information. Please try again.');
        }
      } catch (tenantError) {
        console.error('Error fetching tenant data:', tenantError);
        // Re-throw tenant errors for user to see
        throw tenantError;
      }
      
      // Step 4: Trigger auth state change using useAuth hook
      login(); // This will set isAuthenticated state and dispatch event
      
      // Step 5: Small delay to ensure state is updated, then redirect
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 100);
      
    } catch (err: any) {
      console.error('Login failed:', err);
      
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password link click
  const handleResetPassword = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    alert('Reset password functionality would be implemented here');
  };

  return (
    <div className="font-sans bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center min-h-screen p-5">
      <div className="bg-white w-full max-w-md py-12 px-9 rounded-2xl shadow-2xl">
        
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Hotel Dashboard Login</h2>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
            {error}
          </div>
        )}
        
        <form onSubmit={doLogin}>
          
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
              onChange={handleInputChange}
            />
          </div>
          
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input 
              type="password" 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm outline-none transition-all duration-200 bg-gray-50 text-gray-800 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:bg-white placeholder-gray-400" 
              name="password"
              id="password" 
              placeholder="test123" 
              required
              value={formData.password}
              onChange={handleInputChange}
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
            Forgot your password? <a href="#" onClick={handleResetPassword} className="text-blue-500 no-underline cursor-pointer bg-none border-none text-sm hover:underline">Reset</a>
          </p>
        </div>
        
      </div>
    </div>
  );
};

export default Login;