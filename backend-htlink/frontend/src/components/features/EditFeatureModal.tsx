import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';
import { useCategories } from '../../hooks/useCategories';
import { getUniqueIcons, findIconByName as getIconByName, DEFAULT_ICON } from '../../config/icons';

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

  // Get default language from property settings
  const getDefaultLanguage = () => {
    try {
      const storedSettings = localStorage.getItem('property_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        return parsed.defaultLanguage || 'en';
      }
    } catch (error) {
      // Silent fallback
    }
    return 'en';
  };

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

  // Use centralized icon configuration (unique icons only for picker)
  const icons = getUniqueIcons();
  
  const selectIcon = (iconName: string) => {
    setSelectedIcon(iconName);
    setFeatureForm(prev => ({ ...prev, icon: iconName }));
    setIconPickerOpen(false);
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

  const selectedIconObject = getIconByName(selectedIcon) || DEFAULT_ICON;

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
                  {categories.map((category) => {
                    const defaultLang = getDefaultLanguage();
                    // Get translated title with fallback chain
                    const categoryTitle = category.translations?.[defaultLang]?.title || 
                                         category.translations?.en?.title || 
                                         category.name || 
                                         category.slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    return (
                      <option key={category.id} value={category.slug}>
                        {categoryTitle}
                      </option>
                    );
                  })}
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
                  autoComplete="off"
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