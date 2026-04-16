// src/components/layout/CafeSidebar.tsx
import {
  faBriefcase,
  faBullhorn,
  faCalendarAlt,
  faChartLine,
  faCoffee,
  faGear,
  faGlobe,
  faHome,
  faImages,
  faInfo,
  faMapMarkerAlt,
  faPhone,
  faRightFromBracket,
  faShieldAlt,
  faUtensils,
  faWarehouse
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions } from '../../hooks/usePermissions';

const CafeSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const permissions = usePermissions();

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to logout?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  const isActive = (path: string) => {
    if (path === '/cafe') {
      return location.pathname === '/cafe' || location.pathname === '/cafe/';
    }
    return location.pathname.startsWith(path);
  };

  // Define nav items - All English
  const navItems = [
    {
      section: 'SYSTEM ADMIN',
      links: [
        { path: '/cafe/tenants', icon: faShieldAlt, label: 'Tenants', visible: permissions.canManageTenant || permissions.isAdmin },
        { path: '/cafe/users', icon: faBriefcase, label: 'Users', visible: permissions.canManageUsers },
      ],
    },
    {
      section: 'CONTENT MANAGEMENT',
      links: [
        { path: '/cafe', icon: faChartLine, label: 'Dashboard', visible: true },
        { path: '/cafe/home', icon: faHome, label: 'Home', visible: true },
        { path: '/cafe/about', icon: faInfo, label: 'About', visible: true },
        { path: '/cafe/menu', icon: faUtensils, label: 'Menu', visible: true },
        { path: '/cafe/space', icon: faWarehouse, label: 'Spaces', visible: true },
        { path: '/cafe/branches', icon: faMapMarkerAlt, label: 'Branches', visible: true },
        { path: '/cafe/events', icon: faCalendarAlt, label: 'Events', visible: true },
        { path: '/cafe/careers', icon: faBriefcase, label: 'Careers', visible: true },
        { path: '/cafe/promotions', icon: faBullhorn, label: 'Promotions', visible: true },
        { path: '/cafe/gallery', icon: faImages, label: 'Gallery', visible: true },
        { path: '/cafe/contact', icon: faPhone, label: 'Contact', visible: true },
      ],
    },
    {
      section: 'SETTINGS',
      links: [
        { path: '/cafe/languages', icon: faGlobe, label: 'Languages', visible: true },
        { path: '/cafe/settings', icon: faGear, label: 'Settings', visible: true },
      ],
    },
  ];

  return (
    <aside className="bg-gradient-to-b from-slate-800 to-slate-900 text-white w-64 fixed h-full overflow-y-auto hidden sm:block">
      <div className="p-4 flex items-center gap-2.5 border-b border-slate-700">
        <div className="bg-blue-600 p-1.5 rounded-lg">
          <FontAwesomeIcon icon={faCoffee} className="w-5 h-5" />
        </div>
        <span className="text-lg font-bold">Coffee House</span>
      </div>

      <nav className="p-6">
        {navItems.map((section) => {
          // Filter visible links
          const visibleLinks = section.links.filter(link => link.visible);
          
          // Don't render section if no visible links
          if (visibleLinks.length === 0) {
            return null;
          }
          
          return (
            <div key={section.section} className="mb-6">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.section}</h3>
              <ul>
                {visibleLinks.map((link) => {
                  const active = isActive(link.path);
                  const isCoreAdmin = link.path.startsWith('/admin');
                  const isSettings = link.path === '/settings';
                  
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => {
                          // Store context when navigating to Core Admin or Settings from Cafe
                          if (isCoreAdmin || isSettings) {
                            localStorage.setItem('admin_context', 'cafe');
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          active
                            ? 'bg-blue-600 text-white shadow-lg'
                            : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                        }`}
                      >
                        <FontAwesomeIcon icon={link.icon} className="w-5 h-5" />
                        <span>{link.label}</span>
                      </Link>
                    </li>
                  );
                })}
                {section.section === 'SETTINGS' && (
                  <li>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors w-full text-slate-300 hover:bg-slate-700 hover:text-white"
                    >
                      <FontAwesomeIcon icon={faRightFromBracket} className="w-5 h-5" />
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

export default CafeSidebar;

