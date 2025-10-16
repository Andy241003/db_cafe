// src/components/layout/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faHotel, faHome, faLayerGroup, faPuzzlePiece, faBuilding,
  faImages, faChartLine, faUsers, faCog, faSignOutAlt, faGlobe, faHistory
} from '@fortawesome/free-solid-svg-icons';
import { propertiesApi } from '../../services/propertiesApi';
import { usePermissions } from '../../hooks/usePermissions';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPropertyName, setCurrentPropertyName] = useState<string>('Loading...');
  const permissions = usePermissions();

  // Load current property name
  useEffect(() => {
    const loadPropertyName = async () => {
      try {
        // Try to get property name from localStorage first
        const storedPropertyName = localStorage.getItem('current_property_name');
        if (storedPropertyName) {
          setCurrentPropertyName(storedPropertyName);
          return;
        }

        // If not in localStorage, fetch from API
        const properties = await propertiesApi.getProperties();
        if (properties && properties.length > 0) {
          // Use first property as default
          const propertyName = properties[0].property_name;
          setCurrentPropertyName(propertyName);
          localStorage.setItem('current_property_name', propertyName);
        } else {
          setCurrentPropertyName('No Property');
        }
      } catch (error) {
        console.error('Error loading property name:', error);
        setCurrentPropertyName('Unknown Property');
      }
    };

    loadPropertyName();

    // Listen for property changes
    const handlePropertyChange = (e: CustomEvent) => {
      if (e.detail?.propertyName) {
        setCurrentPropertyName(e.detail.propertyName);
        localStorage.setItem('current_property_name', e.detail.propertyName);
      }
    };

    window.addEventListener('propertyChanged' as any, handlePropertyChange);

    return () => {
      window.removeEventListener('propertyChanged' as any, handlePropertyChange);
    };
  }, []);

  // Define nav items with role-based visibility
  const navItems = [
    {
      section: 'Main',
      links: [
        { path: '/', icon: faHome, label: 'Dashboard', visible: true },
        { path: '/categories', icon: faLayerGroup, label: 'Categories', visible: true },
        { path: '/features', icon: faPuzzlePiece, label: 'Features', visible: true },
        { path: '/properties', icon: faBuilding, label: 'Properties', visible: true },
      ],
    },
    {
      section: 'Content',
      links: [
        { path: '/media', icon: faImages, label: 'Media Library', visible: true },
        { path: '/analytics', icon: faChartLine, label: 'Analytics', visible: true },
      ],
    },
    {
      section: 'Management',
      links: [
        { path: '/users', icon: faUsers, label: 'Users', visible: permissions.canManageUsers },
        { path: '/activities', icon: faHistory, label: 'Activity Log', visible: true },
        { path: '/settings', icon: faCog, label: 'Property Settings', visible: true },
        { path: '/tenant-settings', icon: faGlobe, label: 'Tenant Settings', visible: permissions.canManageTenant },
      ],
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // In a real app, you'd clear tokens, etc.
      navigate("/login");
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
  };

  return (
    <aside className="bg-slate-800 text-slate-100 w-64 fixed h-full overflow-y-auto hidden sm:block">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-blue-600 p-2 rounded-lg">
          <FontAwesomeIcon icon={faHotel} size="lg" />
        </div>
        <span className="text-xl font-bold">HotelLink360</span>
      </div>

      <div className="px-6 py-4 border-y border-slate-700">
        <label className="text-xs text-slate-400">Current Property</label>
        <div className="text-base font-semibold mt-1">{currentPropertyName}</div>
      </div>

      <nav className="p-6">
        {navItems.map((section) => {
          // Filter visible links
          const visibleLinks = section.links.filter(link => link.visible);

          // Don't render section if no visible links
          if (visibleLinks.length === 0 && section.section !== 'Management') {
            return null;
          }

          return (
            <div key={section.section} className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.section}</h3>
              <ul>
                {visibleLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        isActive(link.path)
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                      }`}
                    >
                      <FontAwesomeIcon icon={link.icon} className="w-5 h-5" />
                      <span>{link.label}</span>
                    </Link>
                  </li>
                ))}
                {section.section === 'Management' && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <FontAwesomeIcon icon={faSignOutAlt} className="w-5 h-5" />
                      <span>Logout</span>
                    </button>
                  </li>
                )}
              </ul>
            </div>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;
