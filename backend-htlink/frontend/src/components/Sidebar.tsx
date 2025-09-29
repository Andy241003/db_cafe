// src/components/Sidebar.tsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface NavItem {
  id: string;
  label: string;
  icon: string;
  path: string;
  badge?: string | number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

interface SidebarProps {
  onLogout: () => void;
  currentProperty?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onLogout, 
  currentProperty = "Tabi Tower Hotel" 
}) => {
  const location = useLocation();

  const navigationSections: NavSection[] = [
    {
      title: 'Main',
      items: [
        { id: 'dashboard', label: 'Dashboard', icon: 'fas fa-home', path: '/' },
        { id: 'categories', label: 'Categories', icon: 'fas fa-layer-group', path: '/categories' },
        { id: 'features', label: 'Features', icon: 'fas fa-puzzle-piece', path: '/features', badge: 12 },
        { id: 'properties', label: 'Properties', icon: 'fas fa-building', path: '/properties' },
      ]
    },
    {
      title: 'Content',
      items: [
        { id: 'media', label: 'Media Library', icon: 'fas fa-images', path: '/media' },
        { id: 'analytics', label: 'Analytics', icon: 'fas fa-chart-bar', path: '/analytics' },
      ]
    },
    {
      title: 'Management',
      items: [
        { id: 'users', label: 'Users & Roles', icon: 'fas fa-users', path: '/users' },
        { id: 'settings', label: 'Settings', icon: 'fas fa-cog', path: '/settings' },
      ]
    }
  ];

  const handleLogout = () => {
    if (window.confirm('Are you sure you want to logout?')) {
      onLogout();
    }
  };

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="sidebar">
      {/* Sidebar Header */}
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">
            <i className="fas fa-hotel"></i>
          </div>
          <div className="logo-text">HotelLink360</div>
        </div>
      </div>

      {/* Property Selector */}
      <div className="property-selector">
        <div className="property-label">Current Property</div>
        <div className="property-name">{currentProperty}</div>
      </div>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        {navigationSections.map((section) => (
          <div key={section.title} className="nav-section">
            <div className="nav-section-title">{section.title}</div>
            {section.items.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              >
                <i className={item.icon}></i>
                {item.label}
                {item.badge && (
                  <span className="nav-badge">{item.badge}</span>
                )}
              </Link>
            ))}
          </div>
        ))}
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="nav-item logout"
        >
          <i className="fas fa-sign-out-alt"></i>
          Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;