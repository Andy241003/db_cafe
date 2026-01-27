// src/components/layout/VRHotelSidebar.tsx
import {
    faBed,
    faBookOpen,
    faBuilding,
    faFileContract,
    faFileExport,
    faGear,
    faHome,
    faHotel,
    faImages,
    faInfoCircle,
    faLanguage,
    faPhone,
    faRightFromBracket,
    faRightLeft,
    faShieldAlt,
    faTableCells,
    faTicket,
    faUsers,
    faUtensils,
    faWaterLadder
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { usePermissions, useServiceAccess } from '../../hooks/usePermissions';
import { propertiesApi } from '../../services/propertiesApi';

const VRHotelSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentHotelName, setCurrentHotelName] = useState<string>('Link Hotel VR360');
  const [currentPropertyId, setCurrentPropertyId] = useState<number | null>(null);
  const [properties, setProperties] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { canAccessTravelLink, hasMultipleServices } = useServiceAccess();
  const permissions = usePermissions();

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
          setCurrentHotelName(selectedProperty.property_name);
          setCurrentPropertyId(selectedProperty.id);
          localStorage.setItem('current_property_name', selectedProperty.property_name);
          localStorage.setItem('selected_property_id', selectedProperty.id.toString());
          localStorage.setItem('current_property_id', selectedProperty.id.toString());
        } else {
          setCurrentHotelName('No Property');
        }
      } catch (error) {
        console.error('Error loading properties:', error);
        setCurrentHotelName('Unknown Property');
      }
    };

    loadProperties();

    // Listen for property changes
    const handlePropertyChange = (e: CustomEvent) => {
      if (e.detail?.propertyName) {
        setCurrentHotelName(e.detail.propertyName);
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
    setCurrentHotelName(property.property_name);
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

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      localStorage.clear();
      navigate("/login");
    }
  };

  const isActive = (path: string) => {
    if (path === '/vr-hotel') {
      return location.pathname === '/vr-hotel' || location.pathname === '/vr-hotel/';
    }
    return location.pathname.startsWith(path);
  };

  // Define nav items
  const navItems = [
    {
      section: 'CORE ADMIN',
      links: [
        { path: '/admin/tenants', icon: faShieldAlt, label: 'Tenants', visible: permissions.canManageTenant },
        { path: '/admin/properties', icon: faBuilding, label: 'Properties', visible: permissions.canManageUsers },
        { path: '/admin/users', icon: faUsers, label: 'Users', visible: permissions.canManageUsers },
        { path: '/admin/languages', icon: faLanguage, label: 'Languages', visible: permissions.canManageTenant },
      ],
    },
    {
      section: 'MANAGEMENT',
      links: [
        { path: '/vr-hotel', icon: faHome, label: 'Dashboard', visible: true },
        { path: '/vr-hotel/introduction', icon: faInfoCircle, label: 'Introduction', visible: true },
        { path: '/vr-hotel/services', icon: faShieldAlt, label: 'Services', visible: true },
        { path: '/vr-hotel/rooms', icon: faBed, label: 'Rooms', visible: true },
        { path: '/vr-hotel/dining', icon: faUtensils, label: 'Dining', visible: true },
        { path: '/vr-hotel/offers', icon: faTicket, label: 'Offers', visible: true },
        { path: '/vr-hotel/facilities', icon: faWaterLadder, label: 'Facilities', visible: true },
        { path: '/vr-hotel/media', icon: faImages, label: 'Media Library', visible: true },
        { path: '/vr-hotel/policies', icon: faFileContract, label: 'Policies', visible: true },
        { path: '/vr-hotel/rules', icon: faBookOpen, label: 'Rules', visible: true },
        { path: '/vr-hotel/contact', icon: faPhone, label: 'Contact', visible: true },
      ],
    },
    {
      section: 'SETTINGS',
      links: [
        { path: '/vr-hotel/settings', icon: faGear, label: 'Settings', visible: true },
        { path: '/vr-hotel/export-import', icon: faFileExport, label: 'Export / Import', visible: true },
      ],
    },
  ];

  return (
    <aside className="bg-slate-800 text-slate-100 w-64 fixed h-full overflow-y-auto hidden sm:block">
      <div className="p-6 flex items-center gap-3">
        <div className="bg-purple-600 p-2 rounded-lg">
          <FontAwesomeIcon icon={faHotel} size="lg" />
        </div>
        <span className="text-xl font-bold">VR Hotel 360</span>
      </div>

      {/* Property Selector */}
      <div className="px-6 py-4 border-y border-slate-700">
        <label className="text-xs text-slate-400">Current Property</label>
        <button
          onClick={() => setIsModalOpen(true)}
          className="w-full mt-1 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors text-left"
        >
          <span className="text-base font-semibold text-white truncate block">{currentHotelName}</span>
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
                    <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <FontAwesomeIcon icon={faBuilding} className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-white text-base">{property.property_name}</div>
                      {property.city && (
                        <div className="text-sm text-slate-400 mt-0.5">{property.city}</div>
                      )}
                    </div>
                    {property.id === currentPropertyId && (
                      <div className="w-3 h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
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
            <span>VR Hotel</span>
          </div>
          <button
            onClick={() => canAccessTravelLink && navigate('/')}
            disabled={!canAccessTravelLink}
            className={`w-full flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-colors ${
              canAccessTravelLink
                ? 'text-slate-300 hover:bg-slate-700 cursor-pointer'
                : 'text-slate-500 cursor-not-allowed opacity-50'
            }`}
            title={!canAccessTravelLink ? 'Upgrade your account to access Travel Link' : ''}
          >
            <FontAwesomeIcon icon={faRightLeft} className="w-4 h-4" />
            <span>Switch to Travel Link</span>
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
                          // Store context when navigating to Core Admin or Settings from VR Hotel
                          if (isCoreAdmin || isSettings) {
                            localStorage.setItem('admin_context', 'vr-hotel');
                          }
                        }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          active
                            ? 'bg-purple-600 text-white'
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

export default VRHotelSidebar;
