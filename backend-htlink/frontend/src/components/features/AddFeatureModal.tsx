import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, faSwimmingPool, faUtensils, faWifi, faCar, faSpa, faDumbbell, 
  faCocktail, faBed, faConciergeBell, faCoffee, faGamepad, faShoppingBag, 
  faTaxi, faCrown, faUmbrellaBeach, faTimes, faLink
} from '@fortawesome/free-solid-svg-icons';

interface FormData {
  name: string;
  category: string;
  vrLink: string;
  slug: string;
  target: string;
  icon: string;
  color: string;
  description: string;
  status: string;
}

interface AddFeatureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (featureData: FormData) => void;
}

const AddFeatureModal: React.FC<AddFeatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('linear-gradient(135deg, #3b82f6, #1d4ed8)');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  
  const [featureForm, setFeatureForm] = useState<FormData>({
    name: '',
    category: '',
    vrLink: '',
    slug: '',
    target: 'self',
    icon: 'star',
    color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    description: '',
    status: 'active'
  });

  const icons = [
    { icon: faStar, name: 'star' }, { icon: faSwimmingPool, name: 'swimming-pool' }, 
    { icon: faUtensils, name: 'utensils' }, { icon: faWifi, name: 'wifi' }, 
    { icon: faCar, name: 'car' }, { icon: faSpa, name: 'spa' },
    { icon: faDumbbell, name: 'dumbbell' }, { icon: faCocktail, name: 'cocktail' }, 
    { icon: faBed, name: 'bed' }, { icon: faConciergeBell, name: 'concierge-bell' }, 
    { icon: faCoffee, name: 'coffee' }, { icon: faGamepad, name: 'gamepad' }, 
    { icon: faShoppingBag, name: 'shopping-bag' }, { icon: faTaxi, name: 'taxi' }, 
    { icon: faCrown, name: 'crown' }, { icon: faUmbrellaBeach, name: 'umbrella-beach' }
  ];

  const colors = [
    'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    'linear-gradient(135deg, #ef4444, #dc2626)',
    'linear-gradient(135deg, #10b981, #059669)',
    'linear-gradient(135deg, #f59e0b, #d97706)',
    'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    'linear-gradient(135deg, #06b6d4, #0891b2)',
    'linear-gradient(135deg, #ec4899, #db2777)',
    'linear-gradient(135deg, #667eea, #764ba2)'
  ];

  const selectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
    setFeatureForm(prev => ({ ...prev, icon: iconName }));
    setIconPickerOpen(false);
  };

  const selectColor = (color: string) => {
    setSelectedColor(color);
    setFeatureForm(prev => ({ ...prev, color }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!featureForm.name || !featureForm.category) {
      alert('Please fill in all required fields');
      return;
    }
    onSave(featureForm);
    // Reset form
    setFeatureForm({
      name: '',
      category: '',
      vrLink: '',
      slug: '',
      target: 'self',
      icon: 'star',
      color: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      description: '',
      status: 'active'
    });
    setSelectedIcon('star');
    setSelectedColor('linear-gradient(135deg, #3b82f6, #1d4ed8)');
    onClose();
  };

  const handleModalClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedIconObject = icons.find(i => i.name === selectedIcon)?.icon || faStar;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[1000] flex items-center justify-center p-4" onClick={handleModalClick}>
      <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
          <h3 className="text-xl font-semibold text-gray-800">Add New Feature</h3>
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
                >
                  <option value="">Select category...</option>
                  <option value="general">General</option>
                  <option value="services">Services</option>
                  <option value="facilities">Facilities</option>
                  <option value="activities">Activities</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slug / External Link *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  value={featureForm.slug}
                  onChange={(e) => setFeatureForm(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="e.g., swimming-pool or https://example.com"
                  required
                />
                <small className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                  <FontAwesomeIcon icon={faLink} className="text-gray-400" /> Enter a slug for internal page or a full URL.
                </small>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Open Link In</label>
                <div className="flex gap-5 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="featureTarget"
                      value="self"
                      className="accent-blue-600 w-4 h-4"
                      checked={featureForm.target === 'self'}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, target: e.target.value }))}
                    />
                    Current Page
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                    <input
                      type="radio"
                      name="featureTarget"
                      value="blank"
                      className="accent-blue-600 w-4 h-4"
                      checked={featureForm.target === 'blank'}
                      onChange={(e) => setFeatureForm(prev => ({ ...prev, target: e.target.value }))}
                    />
                    New Tab
                  </label>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Icon</label>
                <div className="relative">
                  <div className="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer" onClick={() => setIconPickerOpen(!iconPickerOpen)}>
                    <FontAwesomeIcon icon={selectedIconObject} className="w-5 h-5 text-blue-600" />
                    <span className="text-sm text-gray-600">Click to change</span>
                  </div>
                  {iconPickerOpen && (
                    <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg p-3 shadow-lg z-10 mt-1">
                      <div className="grid grid-cols-6 gap-2">
                        {icons.map(({ icon, name }) => (
                          <div
                            key={name}
                            className="w-10 h-10 border border-gray-200 rounded-md flex items-center justify-center cursor-pointer transition-all hover:border-blue-500 hover:text-blue-500 hover:bg-blue-50"
                            onClick={() => selectIcon(name)}
                          >
                            <FontAwesomeIcon icon={icon} className="text-lg" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              value={featureForm.description}
              onChange={(e) => setFeatureForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Feature description..."
              rows={3}
            />
          </div>

          <div className="mb-6">
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

          <div className="flex gap-3 justify-end pt-6 border-t border-gray-200">
            <button type="button" className="px-5 py-2.5 bg-gray-100 text-gray-800 border border-gray-300 rounded-lg text-sm font-medium transition-all hover:bg-gray-200" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="px-5 py-2.5 bg-green-600 text-white rounded-lg text-sm font-medium transition-all hover:bg-green-700">
              Create Feature
            </button>
          </div>
        </form>
      </div>
      
    </div>
  );
};

export default AddFeatureModal;