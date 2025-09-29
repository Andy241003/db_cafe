// src/components/layout/Sidebar.tsx
import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faHotel, faHome, faLayerGroup, faPuzzlePiece, faBuilding, 
  faImages, faChartLine, faUsers, faCog, faSignOutAlt
} from '@fortawesome/free-solid-svg-icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      section: 'Main',
      links: [
        { path: '/', icon: faHome, label: 'Dashboard' },
        { path: '/categories', icon: faLayerGroup, label: 'Categories' },
        { path: '/features', icon: faPuzzlePiece, label: 'Features' },
        { path: '/properties', icon: faBuilding, label: 'Properties' },
      ],
    },
    {
      section: 'Content',
      links: [
        { path: '/media', icon: faImages, label: 'Media Library' },
        { path: '/analytics', icon: faChartLine, label: 'Analytics' },
      ],
    },
    {
      section: 'Management',
      links: [
        { path: '/users', icon: faUsers, label: 'Users' },
        { path: '/settings', icon: faCog, label: 'Settings' },
      ],
    },
  ];

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      // In a real app, you'd clear tokens, etc.
      console.log("Logging out...");
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
        <div className="text-base font-semibold mt-1">Tabi Tower Hotel</div>
      </div>

      <nav className="p-6">
        {navItems.map((section) => (
          <div key={section.section} className="mb-6">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{section.section}</h3>
            <ul>
              {section.links.map((link) => (
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
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
