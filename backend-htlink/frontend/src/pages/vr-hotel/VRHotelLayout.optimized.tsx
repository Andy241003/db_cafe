import React, { useState } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, Hotel, Home, DoorOpen, Utensils, Gift, Zap, BookOpen, Users, Settings, ChevronDown } from 'lucide-react';

// Types
interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  path: string;
}

// Constants
const MENU_ITEMS: MenuItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: Home, path: '/vr-hotel' },
  { id: 'rooms', label: 'Rooms', icon: DoorOpen, path: '/vr-hotel/rooms' },
  { id: 'dining', label: 'Dining', icon: Utensils, path: '/vr-hotel/dining' },
  { id: 'offers', label: 'Offers', icon: Gift, path: '/vr-hotel/offers' },
  { id: 'facilities', label: 'Facilities', icon: Zap, path: '/vr-hotel/facilities' },
  { id: 'policies', label: 'Policies', icon: BookOpen, path: '/vr-hotel/policies' },
  { id: 'rules', label: 'House Rules', icon: BookOpen, path: '/vr-hotel/rules' },
  { id: 'contact', label: 'Contact', icon: Users, path: '/vr-hotel/contact' },
  { id: 'settings', label: 'Settings', icon: Settings, path: '/vr-hotel/settings' }
];

// Custom hooks
const useAuth = () => {
  const navigate = useNavigate();
  
  const logout = () => {
    const keysToRemove = [
      'access_token', 'user', 'isAuthenticated', 
      'tenant_code', 'tenant_name', 'service_access', 'available_services'
    ];
    keysToRemove.forEach(key => localStorage.removeItem(key));
    navigate('/login');
  };
  
  const backToDashboard = () => navigate('/dashboard-selection');
  
  return { logout, backToDashboard };
};

const useNavigation = () => {
  const location = useLocation();
  
  const isActive = (path: string): boolean => {
    if (path === '/vr-hotel') {
      return location.pathname === '/vr-hotel' || location.pathname === '/vr-hotel/';
    }
    return location.pathname.startsWith(path);
  };
  
  return { isActive };
};

// Components
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const { logout, backToDashboard } = useAuth();
  const { isActive } = useNavigation();

  return (
    <aside 
      className={`${
        isOpen ? 'w-64' : 'w-20'
      } bg-gradient-to-b from-purple-700 to-purple-900 text-white shadow-lg transition-all duration-300 flex-col hidden md:flex`}
    >
      {/* Logo/Brand */}
      <div className="p-6 border-b border-purple-600">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-purple-500">
              <Hotel size={24} />
            </div>
          </div>
          {isOpen && (
            <div>
              <h1 className="text-lg font-bold">VR Hotel</h1>
              <p className="text-xs text-purple-300">Management</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        <ul className="space-y-2">
          {MENU_ITEMS.map(item => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <li key={item.id}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
                    active
                      ? 'bg-purple-500 text-white'
                      : 'text-purple-100 hover:bg-purple-600'
                  }`}
                  title={item.label}
                >
                  <Icon size={20} className="flex-shrink-0" />
                  {isOpen && <span className="text-sm font-medium">{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-purple-600 p-4 space-y-2">
        <button
          onClick={backToDashboard}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-purple-100 hover:bg-purple-600 transition-colors duration-200"
          title="Back to Dashboard"
        >
          <ChevronDown size={20} className="flex-shrink-0 rotate-90" />
          {isOpen && <span className="text-sm font-medium">Back</span>}
        </button>
        
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-200 hover:bg-red-900 transition-colors duration-200"
          title="Logout"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {isOpen && <span className="text-sm font-medium">Logout</span>}
        </button>
      </div>

      {/* Collapse Button */}
      <button
        onClick={onToggle}
        className="hidden md:flex w-full items-center justify-center p-4 text-purple-300 hover:text-white transition-colors"
        title={isOpen ? 'Collapse' : 'Expand'}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
    </aside>
  );
};

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const MobileMenu: React.FC<MobileMenuProps> = ({ isOpen, onClose }) => {
  const { isActive } = useNavigation();

  if (!isOpen) return null;

  return (
    <nav className="md:hidden bg-white border-b border-gray-200 p-4 space-y-2">
      {MENU_ITEMS.map(item => {
        const Icon = item.icon;
        const active = isActive(item.path);
        
        return (
          <Link
            key={item.id}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors duration-200 ${
              active
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Icon size={20} />
            <span className="font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

const VRHotelLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar isOpen={sidebarOpen} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header - Mobile Only */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4 flex items-center justify-between md:hidden">
          <div className="flex items-center gap-3">
            <Hotel size={24} className="text-purple-600" />
            <h1 className="text-lg font-bold text-gray-900">VR Hotel</h1>
          </div>
          
          <button
            onClick={toggleMobileMenu}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </header>

        <MobileMenu isOpen={mobileMenuOpen} onClose={closeMobileMenu} />

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VRHotelLayout;