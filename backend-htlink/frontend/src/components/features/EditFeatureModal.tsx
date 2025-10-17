import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar, faSwimmingPool, faUtensils, faWifi, faCar, faSpa, faDumbbell,
  faCocktail, faBed, faConciergeBell, faCoffee, faGamepad, faShoppingBag,
  faTaxi, faCrown, faUmbrellaBeach, faTimes, faLink, faTv, faUsers,
  faSignInAlt, faHotTub, faInfoCircle, faGift, faSignOutAlt, faKey, faParking,
  faBus, faPlaneDeparture, faCarSide, faHandshake, faWaterLadder,

  // newly added / suggested
  faSnowflake, faLock, faBell, faCalendarCheck, faMugHot, faGlassMartini,
  faLeaf, faIceCream, faStore, faList, faTicket, faBath, faHandsHelping,
  faTruck, faBoxOpen, faPaw, faLaptop, faBuilding, faChartLine, faThumbsUp,
  faChild, faMapSigns, faBicycle, faTshirt, faCampground,
  faCloudSun, faCalendar, faLanguage, faMap, faPoll, faQuestionCircle,
  faGlobe, faSmoking, faRoute, faShieldVirus, faFileContract,
  faMapMarkedAlt, faChalkboard
} from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../hooks/useCategories';

interface EditFeatureFormData {
  name: string;
  category: string;
  slug: string;
  icon: string;
  status: string;
}

interface Feature {
  id: number;
  slug: string;
  icon_key: string;
  category_id: number;
  tenant_id: number;
  is_system: boolean;
  title?: string;
  content?: string;
}

interface EditFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (featureId: number, featureData: EditFeatureFormData) => void;
  feature: Feature | null;
}

const EditFeatureModal: React.FC<EditFeatureModalProps> = ({ isOpen, onClose, onSave, feature }) => {
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useCategories();

  const [featureForm, setFeatureForm] = useState<EditFeatureFormData>({
    name: '',
    category: '',
    slug: '',
    icon: 'star',
    status: 'active'
  });

  // Update form when feature changes
  useEffect(() => {
    if (feature && isOpen) {
   
      const category = categories.find(cat => cat.id === feature.category_id);
      

      // Normalize icon_key - remove fa- prefix if exists and handle undefined
      const iconKey = feature.icon_key || 'star';
      const normalizedIcon = iconKey.startsWith('fa-') 
        ? iconKey.substring(3) 
        : iconKey;
  
      const formData = {
        name: feature.title || feature.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        category: category?.slug || '',
        slug: feature.slug,
        icon: normalizedIcon,
        status: feature.is_system ? 'inactive' : 'active'
      };

      setFeatureForm(formData);
      setSelectedIcon(normalizedIcon);
    }
  }, [feature, isOpen, categories]);

  const icons = [
    { icon: faStar, name: 'star' },
    { icon: faSwimmingPool, name: 'swimming-pool' },
    { icon: faUtensils, name: 'utensils' }, // nha-hang
    { icon: faWifi, name: 'wifi' },
    { icon: faCar, name: 'car' },
    { icon: faSpa, name: 'spa' },
    { icon: faDumbbell, name: 'dumbbell' },
    { icon: faCocktail, name: 'cocktail' },
    { icon: faBed, name: 'bed' },
    { icon: faConciergeBell, name: 'concierge-bell' },
    { icon: faCoffee, name: 'coffee' },
    { icon: faGamepad, name: 'gamepad' },
    { icon: faShoppingBag, name: 'shopping-bag' },
    { icon: faTaxi, name: 'taxi' },
    { icon: faCrown, name: 'crown' },
    { icon: faUmbrellaBeach, name: 'umbrella-beach' },
    { icon: faTv, name: 'tv' },
    { icon: faUsers, name: 'users' },
    { icon: faSignInAlt, name: 'check-in' },
    { icon: faHotTub, name: 'hot-tub-person' },
    { icon: faTimes, name: 'times' },
    { icon: faLink, name: 'link' },
    { icon: faInfoCircle, name: 'info-circle' },
    { icon: faGift, name: 'gift' },
    { icon: faSignOutAlt, name: 'check-out' },
    { icon: faKey, name: 'access' },
    { icon: faParking, name: 'parking' },
    { icon: faBus, name: 'shuttle-bus' },
    { icon: faPlaneDeparture, name: 'flight-service' },
    { icon: faCarSide, name: 'car-rental' },
    { icon: faHandshake, name: 'handshake' },
    { icon: faWaterLadder, name: 'water-ladder' },

    // service / room / dining / amenities
    { icon: faSnowflake, name: 'air-conditioning' },
    { icon: faLock, name: 'safe' },
    { icon: faConciergeBell, name: 'amenities' }, // reuse
    { icon: faBell, name: 'morning-call' },
    { icon: faUtensils, name: 'in-room-dining' },
    { icon: faCalendarCheck, name: 'restaurant-reservation' },
    { icon: faCocktail, name: 'bar-lounge' }, // reuse
    { icon: faMugHot, name: 'tea-lounge' },
    { icon: faGlassMartini, name: 'drink-corner' },
    { icon: faLeaf, name: 'halal-food' },
    { icon: faIceCream, name: 'ice-treat' },
    { icon: faStore, name: 'vending-machines' },
    { icon: faStore, name: 'convenience-store' },
    { icon: faList, name: 'menu' },
    { icon: faTicket, name: 'coupon' },

    // relaxation & health
    { icon: faBath, name: 'public-bath' },
    { icon: faHotTub, name: 'sauna' }, // reuse hot tub for sauna
    { icon: faHandsHelping, name: 'massage' },
    { icon: faSpa, name: 'beauty-spa' }, // reuse
    { icon: faDumbbell, name: 'fitness' }, // reuse
    { icon: faSwimmingPool, name: 'pool' }, // reuse
    { icon: faLeaf, name: 'yoga' },

    // services & amenities
    { icon: faConciergeBell, name: 'concierge' }, // reuse
    { icon: faLeaf, name: 'eco-cleaning' }, // reuse leaf
    { icon: faTshirt, name: 'coin-laundry' },
    { icon: faTruck, name: 'courier-service' },
    { icon: faBoxOpen, name: 'locker-room' },
    { icon: faPaw, name: 'pet-friendly' },
    { icon: faLaptop, name: 'workspace' },
    { icon: faBoxOpen, name: 'original-goods' },
    { icon: faBuilding, name: 'hotel-chain' },

    // business & events
    { icon: faUsers, name: 'conference-room' }, // reuse users
    { icon: faChalkboard, name: 'seminar' },
    { icon: faKey, name: 'rental-space' }, // reuse key
    { icon: faChartLine, name: 'facility-congestion' },

    // explore & activities
    { icon: faMapMarkedAlt, name: 'sightseeing' },
    { icon: faThumbsUp, name: 'recommended-activity' },
    { icon: faChild, name: 'playground' },
    { icon: faMapSigns, name: 'self-organized-tour' },
    { icon: faBicycle, name: 'bicycle-rental' },
    { icon: faTshirt, name: 'kimono-rental' },
    { icon: faCampground, name: 'camp' },
    { icon: faLeaf, name: 'sakura' },
    { icon: faCloudSun, name: 'weather' },
    { icon: faCalendar, name: 'local-events' },

    // info & instructions
    { icon: faLanguage, name: 'how-to-translate' },
    { icon: faMap, name: 'floor-guide' },
    { icon: faPoll, name: 'survey' },
    { icon: faQuestionCircle, name: 'q-and-a' },
    { icon: faGlobe, name: 'official-website' },

    // safety & regs
    { icon: faSmoking, name: 'smoking-area' },
    { icon: faRoute, name: 'evacuation-plan' },
    { icon: faShieldVirus, name: 'covid-measures' },
    { icon: faFileContract, name: 'accommodation-terms' }
  ];
  const selectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
    setFeatureForm(prev => ({ ...prev, icon: iconName }));
    setIconPickerOpen(false);
  };

  // Helper function to find icon by name, handling both normalized and database formats
  const findIconByName = (iconName: string) => {
    
    // Try exact match first
    let foundIcon = icons.find(i => i.name === iconName);
    if (foundIcon) {
      return foundIcon.icon;
    }
    
    // Try with fa- prefix removed
    const normalizedName = iconName.startsWith('fa-') ? iconName.substring(3) : iconName;
    foundIcon = icons.find(i => i.name === normalizedName);
    if (foundIcon) {
      return foundIcon.icon;
    }
    
    // Default fallback
    return faStar;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureForm.name || !featureForm.category || !feature) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(feature.id, featureForm);
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen || !feature) return null;

  const selectedIconObject = findIconByName(selectedIcon);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4" onClick={handleModalClick}>
      <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Edit Feature</h3>
          <button className="text-gray-400 hover:text-gray-600 text-2xl" onClick={onClose}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Feature Name *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={featureForm.name}
                  onChange={(e) => setFeatureForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Swimming Pool"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={featureForm.category}
                  onChange={(e) => setFeatureForm(prev => ({ ...prev, category: e.target.value }))}
                  required
                  disabled={categoriesLoading}
                >
                  <option value="">
                    {categoriesLoading ? 'Loading categories...' : 'Select category...'}
                  </option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.slug}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={featureForm.slug}
                  onChange={(e) => setFeatureForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., swimming-pool"
                  required
                />
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon</label>
                <div className="relative icon-picker-container">
                  <button 
                    type="button"
                    className="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors w-full text-left" 
                    onClick={(e) => {
                      e.preventDefault();
                      setIconPickerOpen(!iconPickerOpen);
                    }}
                  >
                    <FontAwesomeIcon icon={selectedIconObject} className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Click to change</span>
                  </button>
                  
                  {iconPickerOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1001] flex items-center justify-center p-4">
                      <div className="bg-white rounded-lg p-4 max-w-md w-full max-h-96 overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="text-lg font-semibold">Choose an Icon</h4>
                          <button 
                            type="button"
                            className="text-gray-400 hover:text-gray-600"
                            onClick={() => setIconPickerOpen(false)}
                          >
                            ×
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-3">
                          {icons.map(({ icon, name }) => (
                            <button
                              type="button"
                              key={name}
                              className={`w-12 h-12 border-2 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50 ${
                                selectedIcon === name ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-gray-200'
                              }`}
                              onClick={() => selectIcon(name)}
                            >
                              <FontAwesomeIcon icon={icon} className="text-lg" />
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={featureForm.status}
                  onChange={(e) => setFeatureForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Feature
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditFeatureModal;