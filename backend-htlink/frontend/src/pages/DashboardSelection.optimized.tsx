import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Building2, Hotel, Lock, LogOut } from 'lucide-react';
import { authAPI } from '../services/api';

interface ServiceAccessResponse {
  service_access: number;
  available_services: string[];
  user_id: number;
  email: string;
}

interface ServiceCardProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  bgColor: string;
  iconBgColor: string;
  buttonColor: string;
  barColor: string;
  canAccess: boolean;
  onSelect: () => void;
}

interface User {
  id: number;
  email: string;
  full_name?: string;
}

// Extract service card component for reusability
const ServiceCard: React.FC<ServiceCardProps> = ({
  title,
  description,
  icon: Icon,
  bgColor,
  iconBgColor,
  buttonColor,
  barColor,
  canAccess,
  onSelect
}) => {
  return (
    <div
      className={`relative rounded-2xl overflow-hidden shadow-lg transition-all duration-300 ${
        canAccess
          ? `cursor-pointer hover:shadow-2xl hover:-translate-y-2 ${bgColor}`
          : 'opacity-60 cursor-not-allowed bg-slate-100'
      }`}
      onClick={() => canAccess && onSelect()}
    >
      <div className={`absolute inset-0 ${bgColor.replace('bg-', 'bg-gradient-to-br from-')} opacity-10`}></div>
      
      <div className="p-8 relative z-10">
        <div className="flex items-center justify-between mb-6">
          <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl ${iconBgColor}`}>
            <Icon size={28} />
          </div>
          {!canAccess && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-semibold">
              <Lock size={14} />
              Locked
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-slate-900 mb-2">{title}</h2>
        <p className="text-slate-600 mb-6">{description}</p>

        <button
          onClick={canAccess ? onSelect : undefined}
          disabled={!canAccess}
          className={`w-full font-semibold py-3 rounded-lg transition-colors duration-200 ${
            canAccess
              ? `${buttonColor} hover:${buttonColor.replace('bg-', 'bg-').replace('-600', '-700')} text-white`
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {canAccess ? 'Access Dashboard' : 'Access Restricted'}
        </button>
      </div>

      <div className={`h-1 ${canAccess ? barColor : 'bg-slate-300'}`}></div>
    </div>
  );
};

// Custom hook for user data
const useUserAuth = () => {
  const navigate = useNavigate();
  
  const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
      navigate('/login');
      return null;
    }
    
    try {
      return JSON.parse(userStr);
    } catch {
      navigate('/login');
      return null;
    }
  };
  
  return { getCurrentUser };
};

// Custom hook for services data
const useServicesData = () => {
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState<ServiceAccessResponse | null>(null);
  const navigate = useNavigate();
  
  const fetchServices = async () => {
    try {
      const response = await authAPI.getUserServices();
      setServices(response);
      
      // Store in localStorage
      localStorage.setItem('service_access', response.service_access.toString());
      localStorage.setItem('available_services', JSON.stringify(response.available_services));
      
      return response;
    } catch (error) {
      console.error('Error fetching user services:', error);
      toast.error('Failed to load available services');
      setTimeout(() => navigate('/'), 2000);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  return { loading, services, fetchServices };
};

const DashboardSelection: React.FC = () => {
  const navigate = useNavigate();
  const { getCurrentUser } = useUserAuth();
  const { loading, services, fetchServices } = useServicesData();
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const initializeData = async () => {
      const user = getCurrentUser();
      if (user) {
        setCurrentUser(user);
        await fetchServices();
      }
    };

    initializeData();
  }, []);

  const handleServiceSelect = (serviceCode: 'travel-link' | 'vr-hotel') => {
    navigate(serviceCode === 'travel-link' ? '/' : '/vr-hotel');
  };

  const handleLogout = () => {
    // Clear all auth data
    const keysToRemove = [
      'access_token', 'user', 'isAuthenticated', 
      'tenant_code', 'tenant_name', 'selected_property_id', 
      'property_settings', 'service_access', 'available_services'
    ];
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-semibold text-slate-700">Đang tải...</p>
        </div>
      </div>
    );
  }

  const canAccessTravelLink = services?.available_services.includes('travel-link') ?? true;
  const canAccessVrHotel = services?.available_services.includes('vr-hotel') ?? false;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600 text-white mb-4">
            <Building2 size={32} />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-2">Select Your Dashboard</h1>
          <p className="text-slate-600">
            Welcome back, <span className="font-semibold">{currentUser?.full_name || currentUser?.email}</span>
          </p>
          <p className="text-sm text-slate-500 mt-1">Choose a service to access</p>
        </div>

        {/* Service Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <ServiceCard
            title="Travel Link"
            description="Manage your hotel properties, bookings, and reservations across multiple locations."
            icon={Building2}
            bgColor="bg-white"
            iconBgColor="bg-blue-100 text-blue-600"
            buttonColor="bg-blue-600"
            barColor="bg-blue-600"
            canAccess={canAccessTravelLink}
            onSelect={() => handleServiceSelect('travel-link')}
          />

          <ServiceCard
            title="VR Hotel"
            description="Create immersive virtual tours, manage rooms, dining options, and guest experiences."
            icon={Hotel}
            bgColor="bg-white"
            iconBgColor="bg-purple-100 text-purple-600"
            buttonColor="bg-purple-600"
            barColor="bg-purple-600"
            canAccess={canAccessVrHotel}
            onSelect={() => handleServiceSelect('vr-hotel')}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-md">
          <div className="text-sm text-slate-600">
            Tenant: <span className="font-semibold text-slate-900">{localStorage.getItem('tenant_name') || 'Default'}</span>
          </div>
          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>

        {/* Service Info */}
        {services && (
          <div className="mt-6 text-center text-xs text-slate-500">
            <p>Your account has access to: {services.available_services.map(s => s === 'travel-link' ? 'Travel Link' : 'VR Hotel').join(' & ')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardSelection;