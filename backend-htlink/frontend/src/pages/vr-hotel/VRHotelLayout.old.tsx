import React, { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Hotel, Home, Info, Bed, Utensils, Gift, Droplets, FileText, BookOpen, Phone, Settings, Eye, LogOut, ArrowLeftRight, Grid, Bell, Search } from 'lucide-react';
import './VRHotel.css';

const VRHotelLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.clear();
      navigate('/login');
    }
  };

  const getUserInitials = () => {
    const name = currentUser?.full_name || currentUser?.email || 'AD';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleDisplay = () => {
    const roleMap: { [key: string]: string} = {
      'OWNER': 'Full Access',
      'ADMIN': 'Administrator',
      'EDITOR': 'Editor',
      'VIEWER': 'Viewer'
    };
    return roleMap[currentUser?.role] || currentUser?.role || 'User';
  };

  const managementItems = [
    { path: '/vr-hotel', label: 'Dashboard', icon: Home },
    { path: '/vr-hotel/introduction', label: 'Introduction', icon: Info },
    { path: '/vr-hotel/rooms', label: 'Rooms', icon: Bed },
    { path: '/vr-hotel/dining', label: 'Dining', icon: Utensils },
    { path: '/vr-hotel/offers', label: 'Offers', icon: Gift },
    { path: '/vr-hotel/facilities', label: 'Facilities', icon: Droplets },
    { path: '/vr-hotel/policies', label: 'Policies', icon: FileText },
    { path: '/vr-hotel/rules', label: 'Rules', icon: BookOpen },
    { path: '/vr-hotel/contact', label: 'Contact', icon: Phone },
  ];

  const isActive = (path: string) => {
    if (path === '/vr-hotel') {
      return location.pathname === '/vr-hotel' || location.pathname === '/vr-hotel/';
    }
    return location.pathname.startsWith(path);
  };

  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/vr-hotel' || path === '/vr-hotel/') return 'Dashboard';
    if (path.includes('/introduction')) return 'Introduction';
    if (path.includes('/rooms')) return 'Rooms';
    if (path.includes('/dining')) return 'Dining';
    if (path.includes('/offers')) return 'Offers';
    if (path.includes('/facilities')) return 'Facilities';
    if (path.includes('/policies')) return 'Policies';
    if (path.includes('/rules')) return 'House Rules';
    if (path.includes('/contact')) return 'Contact';
    if (path.includes('/settings')) return 'Settings';
    return 'Dashboard';
  };

  return (
    <div className="vr-hotel-layout">
      {/* Sidebar */}
      <div className="vr-sidebar">
        {/* Header */}
        <div className="vr-sidebar-header">
          <div className="vr-logo">
            <div className="vr-logo-icon">
              <Hotel size={20} />
            </div>
            <div className="vr-logo-text">Link Hotel VR</div>
          </div>
        </div>

        {/* Property Selector */}
        <div className="vr-property-selector">
          <div className="vr-property-label">Current Hotel</div>
          <div className="vr-property-name">Link Hotel VR360</div>
        </div>

        {/* Dashboard Switcher */}
        <div className="vr-dashboard-switcher">
          <div className="vr-current-dashboard">
            <div className="vr-dashboard-indicator">
              <Hotel size={16} />
              <span>VR Hotel</span>
            </div>
          </div>
          <div className="vr-switch-option" onClick={() => navigate('/')}>
            <ArrowLeftRight size={16} />
            <span>Switch to Travel Link</span>
          </div>
          <div className="vr-switch-option" onClick={() => navigate('/dashboard-selection')}>
            <Grid size={16} />
            <span>All Dashboards</span>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="vr-nav-menu">
          {/* MANAGEMENT Section */}
          <div className="vr-nav-section">
            <div className="vr-nav-section-title">MANAGEMENT</div>
            {managementItems.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.path}
                  href={item.path}
                  className={`vr-nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(item.path);
                  }}
                >
                  <Icon size={18} />
                  {item.label}
                </a>
              );
            })}
          </div>

          {/* SETTINGS Section */}
          <div className="vr-nav-section">
            <div className="vr-nav-section-title">SETTINGS</div>
            <a
              href="/vr-hotel/settings"
              className={`vr-nav-item ${isActive('/vr-hotel/settings') ? 'active' : ''}`}
              onClick={(e) => {
                e.preventDefault();
                navigate('/vr-hotel/settings');
              }}
            >
              <Settings size={18} />
              Settings
            </a>
            <a
              href="https://hotel-vr-demo.netlify.app/"
              className="vr-nav-item"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Eye size={18} />
              View Website
            </a>
            <a
              href="#"
              className="vr-nav-item logout"
              onClick={(e) => {
                e.preventDefault();
                handleLogout();
              }}
            >
              <LogOut size={18} />
              Logout
            </a>
          </div>
        </nav>
      </div>

      {/* Main Content Wrapper */}
      <div className="vr-main-wrapper">
        {/* Header */}
        <header className="vr-header">
          <div className="vr-header-left">
            <h1>{getPageTitle()}</h1>
          </div>
          <div className="vr-header-right">
            <div className="vr-search-box">
              <Search className="vr-search-icon" size={18} />
              <input type="text" placeholder="Search..." />
            </div>
            <button className="vr-notification-btn">
              <Bell size={20} />
              <span className="vr-notification-badge"></span>
            </button>
            <div className="vr-user-menu">
              <div className="vr-user-avatar">{getUserInitials()}</div>
              <div className="vr-user-info">
                <div className="vr-user-name">
                  {currentUser?.full_name || currentUser?.email || 'Admin'}
                </div>
                <div className="vr-user-role">{getRoleDisplay()}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="vr-main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default VRHotelLayout;
