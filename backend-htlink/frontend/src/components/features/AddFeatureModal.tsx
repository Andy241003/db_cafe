import React, { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faStar, faSwimmingPool, faUtensils, faWifi, faCar, faSpa, faDumbbell, 
  faCocktail, faBed, faConciergeBell, faCoffee, faGamepad, faShoppingBag, 
  faTaxi, faCrown, faUmbrellaBeach, faTimes, faLink,faTv, faUsers, faSignInAlt, faHotTub, faInfoCircle
} from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../hooks/useCategories';

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

export const AddFeatureModal: React.FC<AddFeatureModalProps> = ({ isOpen, onClose, onSave }) => {
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [iconPickerOpen, setIconPickerOpen] = useState(false);
  const { categories, loading: categoriesLoading } = useCategories();

  // Close icon picker when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (iconPickerOpen) {
        const target = event.target as HTMLElement;
        if (!target.closest('.icon-picker-container')) {
          setIconPickerOpen(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [iconPickerOpen]);
  
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

  // Quill editor configuration
  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link', 'image'],
      ['clean']
    ],
  };

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline',
    'list', 'bullet',
    'link', 'image'
  ];

  const icons = [
    { icon: faStar, name: 'star' }, 
    { icon: faSwimmingPool, name: 'swimming-pool' }, 
    { icon: faUtensils, name: 'utensils' }, 
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
    { icon: faSignInAlt, name: 'checkin' }, 
    { icon: faHotTub, name: 'hot-tub-person' }, 
    { icon: faInfoCircle, name: 'info-circle' } // mặc định hoặc fallback
  ];

  const selectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
    setFeatureForm(prev => ({ ...prev, icon: iconName }));
    setIconPickerOpen(false);
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
                <div className="relative icon-picker-container">
                  <button 
                    type="button"
                    className="flex items-center gap-3 p-2.5 border border-gray-300 rounded-lg bg-white cursor-pointer hover:border-blue-400 transition-colors w-full text-left" 
                    onClick={(e) => {
                      e.preventDefault();
                      console.log('Icon picker clicked, current state:', iconPickerOpen);
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
                              onClick={() => {
                                console.log('Selected icon:', name);
                                selectIcon(name);
                              }}
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

              
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
            <div className="border border-gray-300 rounded-lg overflow-hidden">
              <ReactQuill
                theme="snow"
                value={featureForm.description}
                onChange={(value: string) => setFeatureForm(prev => ({ ...prev, description: value }))}
                modules={quillModules}
                formats={quillFormats}
                placeholder="Feature description..."
                style={{ minHeight: '150px' }}
              />
            </div>
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