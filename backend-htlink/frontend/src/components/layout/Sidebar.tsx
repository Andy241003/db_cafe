// src/components/layout/Sidebar.tsx
import {
    faBuilding,
    faChartLine,
    faCog,
    faHistory,
    faHome,
    faHotel,
    faImages,
    faLanguage,
    faLayerGroup,
    faPuzzlePiece,
    faRightLeft,
    faShieldAlt,
    faSignOutAlt,
    faTableCells,
    faUsers
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions, useServiceAccess } from '../../hooks/usePermissions';
import { propertiesApi } from '../../services/propertiesApi';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPropertyName, setCurrentPropertyName] = useState<string>('Loading...');
  const [currentPropertyId, setCurrentPropertyId] = useState<number | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const permissions = usePermissions();
  const { canAccessVrHotel, hasMultipleServices } = useServiceAccess();

  // Load properties list
  useEffect(() => {
    const loadProperties = async () => {
      try {
        const propertiesList = await propertiesApi.getProperties();
        setProperties(propertiesList);

        // Get stored property ID or use first one
        const storedPropertyId = localStorage.getItem('selected_property_id');
        let selectedProperty;

        if (storedPropertyId) {
          selectedProperty = propertiesList.find((p: any) => p.id === parseInt(storedPropertyId));
        }

        if (!selectedProperty && propertiesList.length > 0) {
          selectedProperty = propertiesList[0];
        }

        if (selectedProperty) {
          setCurrentPropertyName(selectedProperty.property_name);
          setCurrentPropertyId(selectedProperty.id);
          localStorage.setItem('current_property_name', selectedProperty.property_name);
          localStorage.setItem('selected_property_id', selectedProperty.id.toString());
          localStorage.setItem('current_property_id', selectedProperty.id.toString());
        } else {
          setCurrentPropertyName('No Property');
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        setCurrentPropertyName('Unknown Property');
      }
    };

    loadProperties();

    // Listen for property changes
    const handlePropertyChange = (e: CustomEvent) => {
      if (e.detail?.propertyName) {
        setCurrentPropertyName(e.detail.propertyName);
        localStorage.setItem('current_property_name', e.detail.propertyName);
      }
      if (e.detail?.propertyId) {
        setCurrentPropertyId(e.detail.propertyId);
      }
    };

    window.addEventListener('propertyChanged' as any, handlePropertyChange);

    return () => {
      window.removeEventListener('propertyChanged' as any, handlePropertyChange);
    };
  }, []);

  // Handle property switch
  const handlePropertySwitch = (property: any) => {
    setCurrentPropertyName(property.property_name);
    setCurrentPropertyId(property.id);
    setIsModalOpen(false);

    // Update localStorage
    localStorage.setItem('current_property_name', property.property_name);
    localStorage.setItem('selected_property_id', property.id.toString());
    localStorage.setItem('current_property_id', property.id.toString());

    // Dispatch event for other components
    window.dispatchEvent(
      new CustomEvent('propertyChanged', {
        detail: { propertyName: property.property_name, propertyId: property.id },
      })
    );

    // Reload page to refresh data
    window.location.reload();
  };

  // Define nav items with role-based visibility
  const navItems = [
    {
      section: 'Core Admin',
      links: [
        { path: '/admin/tenants', icon: faShieldAlt, label: 'Tenants', visible: permissions.canManageTenant },
        { path: '/admin/properties', icon: faBuilding, label: 'Properties', visible: permissions.canManageUsers },
        { path: '/admin/users', icon: faUsers, label: 'Users', visible: permissions.canManageUsers },
        { path: '/admin/languages', icon: faLanguage, label: 'Languages', visible: permissions.canManageTenant },
      ],
    },
    {
      section: 'Travel Link',
      links: [
        { path: '/', icon: faHome, label: 'Dashboard', visible: true },
        { path: '/categories', icon: faLayerGroup, label: 'Categories', visible: true },
        { path: '/features', icon: faPuzzlePiece, label: 'Features', visible: true },
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
      section: 'Settings',
      links: [
        { path: '/activities', icon: faHistory, label: 'Activity Log', visible: true },
        { path: '/settings', icon: faCog, label: 'Property Settings', visible: true },
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

      {/* Property Selector */}
      <div className="px-6 py-4 border-y border-slate-700">
        <label className="text-xs text-slate-400">Current Property</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
        >
          <span className="text-base font-semibold text-white truncate block">{currentPropertyName}</span>
          {properties.length > 1 && (
            <span className="text-xs text-slate-400 mt-1 block">Click to switch property</span>
          )}
        </button>
      </div>

      {/* Property Selection Modal - Using Portal */}
      {isModalOpen && ReactDOM.createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]" onClick={() => setIsModalOpen(false)}>
          <div className="bg-slate-800 rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-bold text-white">Select Property</h3>
              <p className="text-sm text-slate-400 mt-1">Choose a property to switch to</p>
            </div>

            {/* Properties List */}
            <div className="max-h-96 overflow-y-auto">
              {properties.map((property) => (
                <button
                  key={property.id}
                  onClick={() => handlePropertySwitch(property)}
                  className={`w-full px-6 py-4 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 last:border-b-0 ${
                    property.id === currentPropertyId ? 'bg-slate-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-base">{property.property_name}</div>
                      {property.city && (
                        <div className="text-sm text-slate-400 mt-0.5">{property.city}</div>
                      )}
                    </div>
                    {property.id === currentPropertyId && (
                      <div className="w-3 h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Dashboard Switcher */}
      {hasMultipleServices && (
        <div className="px-6 py-4 border-b border-slate-700 space-y-2">
          <div className="px-3 py-2 flex items-center gap-2 text-sm font-medium text-slate-300">
            <FontAwesomeIcon icon={faHotel} className="w-4 h-4" />
            <span>Travel Link</span>
          </div>
          <button
            onClick={() => canAccessVrHotel && navigate('/vr-hotel')}
            disabled={!canAccessVrHotel}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              canAccessVrHotel
                ? 'text-slate-300 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title={!canAccessVrHotel ? 'Upgrade your account to access VR Hotel' : ''}
          >
            <FontAwesomeIcon icon={faRightLeft} className="w-4 h-4" />
            <span>Switch to VR Hotel</span>
          </button>
          <button
            onClick={() => navigate('/dashboard-selection')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <FontAwesomeIcon icon={faTableCells} className="w-4 h-4" />
            <span>All Dashboards</span>
          </button>
        </div>
      )}

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
                {visibleLinks.map((link) => {
                  const isCoreAdmin = link.path.startsWith('/admin');
                  const isSettings = link.path === '/settings';
                  
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        onClick={() => {
                          // Store context when navigating to Core Admin or Settings from Travel Link
                          if (isCoreAdmin || isSettings) {
                            localStorage.setItem('admin_context', 'travel-link');
                          }
                        }}
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
                  );
                })}
                {section.section === 'Settings' && (
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

