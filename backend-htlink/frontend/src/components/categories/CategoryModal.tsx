// src/components/categories/CategoryModal.tsx

import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { RequestIconModal } from './RequestIconModal';
import type { Category, CategoryFormData, Language } from '../../types/categories';
import { localesApi, type Locale } from '../../services/localesApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faTimes } from '@fortawesome/free-solid-svg-icons';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void>;
  category?: Category;
}

const availableIcons: string[] = [
  'star', 'swimming-pool', 'utensils', 'wifi', 'car', 'spa', 'dumbbell',
  'cocktail', 'bed', 'concierge-bell', 'coffee', 'gamepad', 'shopping-bag',
  'taxi', 'crown', 'umbrella-beach', 'tv', 'users', 'check-in', 'hot-tub-person',
  'times', 'link', 'info-circle', 'gift', 'check-out', 'access', 'parking',
  'shuttle-bus', 'flight-service', 'car-rental', 'handshake', 'water-ladder',
  'air-conditioning', 'safe', 'amenities', 'morning-call', 'in-room-dining',
  'restaurant-reservation', 'bar-lounge', 'tea-lounge', 'drink-corner',
  'halal-food', 'ice-treat', 'vending-machines', 'convenience-store', 'menu',
  'coupon', 'public-bath', 'sauna', 'massage', 'beauty-spa', 'fitness', 'pool',
  'yoga', 'concierge', 'eco-cleaning', 'coin-laundry', 'courier-service',
  'locker-room', 'pet-friendly', 'workspace', 'original-goods', 'hotel-chain',
  'conference-room', 'seminar', 'rental-space', 'facility-congestion',
  'sightseeing', 'recommended-activity', 'playground', 'self-organized-tour',
  'bicycle-rental', 'kimono-rental', 'camp', 'sakura', 'weather', 'local-events',
  'how-to-translate', 'floor-guide', 'survey', 'q-and-a', 'official-website',
  'smoking-area', 'evacuation-plan', 'covid-measures', 'accommodation-terms',
  'facebook', 'tiktok', 'instagram', 'youtube', 'twitter', 'linkedin',
  'pinterest', 'snapchat', 'telegram', 'whatsapp', 'tabi-life-loyalty-program'
];

const iconMap: Record<string, string> = {
  // ==== SOLID ICONS (fas) ====
  'star': 'fas fa-star',
  'swimming-pool': 'fas fa-swimming-pool',
  'utensils': 'fas fa-utensils',
  'wifi': 'fas fa-wifi',
  'car': 'fas fa-car',
  'spa': 'fas fa-spa',
  'dumbbell': 'fas fa-dumbbell',
  'cocktail': 'fas fa-cocktail',
  'bed': 'fas fa-bed',
  'concierge-bell': 'fas fa-concierge-bell',
  'coffee': 'fas fa-coffee',
  'gamepad': 'fas fa-gamepad',
  'shopping-bag': 'fas fa-shopping-bag',
  'taxi': 'fas fa-taxi',
  'crown': 'fas fa-crown',
  'umbrella-beach': 'fas fa-umbrella-beach',
  'tv': 'fas fa-tv',
  'users': 'fas fa-users',
  'check-in': 'fas fa-sign-in-alt',
  'hot-tub-person': 'fas fa-hot-tub',
  'times': 'fas fa-times',
  'link': 'fas fa-link',
  'info-circle': 'fas fa-info-circle',
  'gift': 'fas fa-gift',
  'check-out': 'fas fa-sign-out-alt',
  'access': 'fas fa-key',
  'parking': 'fas fa-parking',
  'shuttle-bus': 'fas fa-bus',
  'flight-service': 'fas fa-plane-departure',
  'car-rental': 'fas fa-car-side',
  'handshake': 'fas fa-handshake',
  'water-ladder': 'fas fa-water-ladder',
  'air-conditioning': 'fas fa-snowflake',
  'safe': 'fas fa-lock',
  'amenities': 'fas fa-concierge-bell',
  'morning-call': 'fas fa-bell',
  'in-room-dining': 'fas fa-utensils',
  'restaurant-reservation': 'fas fa-calendar-check',
  'bar-lounge': 'fas fa-cocktail',
  'tea-lounge': 'fas fa-mug-hot',
  'drink-corner': 'fas fa-glass-martini',
  'halal-food': 'fas fa-leaf',
  'ice-treat': 'fas fa-ice-cream',
  'vending-machines': 'fas fa-store',
  'convenience-store': 'fas fa-store',
  'menu': 'fas fa-list',
  'coupon': 'fas fa-ticket',
  'public-bath': 'fas fa-bath',
  'sauna': 'fas fa-hot-tub',
  'massage': 'fas fa-hands-helping',
  'beauty-spa': 'fas fa-spa',
  'fitness': 'fas fa-dumbbell',
  'pool': 'fas fa-swimming-pool',
  'yoga': 'fas fa-leaf',
  'concierge': 'fas fa-concierge-bell',
  'eco-cleaning': 'fas fa-leaf',
  'coin-laundry': 'fas fa-tshirt',
  'courier-service': 'fas fa-truck',
  'locker-room': 'fas fa-box-open',
  'pet-friendly': 'fas fa-paw',
  'workspace': 'fas fa-laptop',
  'original-goods': 'fas fa-box-open',
  'hotel-chain': 'fas fa-building',
  'conference-room': 'fas fa-users',
  'seminar': 'fas fa-chalkboard',
  'rental-space': 'fas fa-key',
  'facility-congestion': 'fas fa-chart-line',
  'sightseeing': 'fas fa-map-marked-alt',
  'recommended-activity': 'fas fa-thumbs-up',
  'playground': 'fas fa-child',
  'self-organized-tour': 'fas fa-map-signs',
  'bicycle-rental': 'fas fa-bicycle',
  'kimono-rental': 'fas fa-tshirt',
  'camp': 'fas fa-campground',
  'sakura': 'fas fa-leaf',
  'weather': 'fas fa-cloud-sun',
  'local-events': 'fas fa-calendar',
  'how-to-translate': 'fas fa-language',
  'floor-guide': 'fas fa-map',
  'survey': 'fas fa-poll',
  'q-and-a': 'fas fa-question-circle',
  'official-website': 'fas fa-globe',
  'smoking-area': 'fas fa-smoking',
  'evacuation-plan': 'fas fa-route',
  'covid-measures': 'fas fa-shield-virus',
  'accommodation-terms': 'fas fa-file-contract',
  'tabi-life-loyalty-program': 'fas fa-certificate',

  // ==== BRAND ICONS (fab) ====
  'facebook': 'fab fa-facebook',
  'tiktok': 'fab fa-tiktok',
  'instagram': 'fab fa-instagram',
  'youtube': 'fab fa-youtube',
  'twitter': 'fab fa-twitter',
  'linkedin': 'fab fa-linkedin',
  'pinterest': 'fab fa-pinterest',
  'snapchat': 'fab fa-snapchat',
  'telegram': 'fab fa-telegram',
  'whatsapp': 'fab fa-whatsapp'
};

// Helper function to get language name from code
const getLanguageName = (code: string): string => {
  const languageNames: Record<string, string> = {
    'en': 'English',
    'en-US': 'English (US)',
    'vi': 'Vietnamese',
    'zh-TW': 'Chinese (Traditional)',
    'es': 'Spanish',
    'it': 'Italian',
    'fr': 'French',
    'de': 'German',
    'ja': 'Japanese',
    'ko': 'Korean'
  };
  return languageNames[code] || code.toUpperCase();
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  // Get settings from localStorage directly - no API dependency
  const [propertySettings, setPropertySettings] = useState(() => {
    // Try to load from localStorage immediately
    try {
      const storedSettings = localStorage.getItem('property_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        return parsed;
      }
    } catch (error) {
      // Silent fallback
    }
    
    // Only fallback if no localStorage data
    return {
      defaultLanguage: 'en',
      fallbackLanguage: 'en', 
      supportedLanguages: ['en', 'vi'],
      timezone: 'Asia/Ho_Chi_Minh',
      dateFormat: 'DD/MM/YYYY'
    };
  });

  const loadSettingsFromLocalStorage = () => {
    try {
      const storedSettings = localStorage.getItem('property_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        setPropertySettings(parsed);
        return parsed;
      }
    } catch (error) {
      // Silent fallback
    }
    
    return propertySettings;
  };
  
  const [activeTab, setActiveTab] = useState<Language>('en');
  const [isRequestIconModalOpen, setIsRequestIconModalOpen] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [activeTabs, setActiveTabs] = useState<Language[]>([]); // Will be set from propertySettings
  const [showLanguageDropdown, setShowLanguageDropdown] = useState(false);
  const [iconSearch, setIconSearch] = useState('');
  const languageDropdownRef = React.useRef<HTMLDivElement>(null);
  const addButtonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  // Helper to create translations object based on supported languages
  const buildEmptyTranslations = (codes: string[]) => {
    const translations: any = {};
    codes.forEach(code => {
      translations[code] = { title: '', description: '' };
    });
    return translations as CategoryFormData['translations'];
  };

  const [formData, setFormData] = useState<CategoryFormData>(() => ({
    slug: '',
    icon: '',
    translations: buildEmptyTranslations(propertySettings.supportedLanguages)
  }));

  // Close language dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is on dropdown content
      const target = event.target as Node;
      if (languageDropdownRef.current && !languageDropdownRef.current.contains(target)) {
        // Also check if it's the Portal dropdown content
        const portalDropdown = document.querySelector('[style*="z-index: 10001"]');
        if (!portalDropdown || !portalDropdown.contains(target)) {
          setShowLanguageDropdown(false);
        }
      }
    };

    if (showLanguageDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [showLanguageDropdown]);
  
  // Load settings from localStorage when modal opens + listen for updates
  useEffect(() => {
    if (isOpen) {
      loadSettingsFromLocalStorage();
      
      // Listen for updates from Settings page
      const handleSettingsUpdate = (event: any) => {
        if (event.detail?.supportedLanguages) {
          setPropertySettings(event.detail);
        }
      };
      
      window.addEventListener('property-settings-updated', handleSettingsUpdate);
      
      return () => {
        window.removeEventListener('property-settings-updated', handleSettingsUpdate);
      };
    }
  }, [isOpen]);

  // Load available locales from API (filtered by supported languages)
  useEffect(() => {
    const loadLocales = async () => {
      try {
        const allLocales = await localesApi.getLocales();

        // Filter locales by supported languages from property settings
        const supported = allLocales.filter(locale => 
          propertySettings.supportedLanguages.includes(locale.code)
        );

        // Use filtered locales if found, otherwise fallback to Settings languages with default names
        let finalLocales: Locale[] = [];
        if (supported.length > 0) {
          finalLocales = supported;
        } else {
          // Create locale objects from Settings supportedLanguages with default names
          finalLocales = propertySettings.supportedLanguages.map((code: string) => ({
            code,
            name: getLanguageName(code),
            native_name: getLanguageName(code)
          }));
        }
        
        setAvailableLocales(finalLocales);

        // Initialize with default + fallback languages
        const defaultLang = propertySettings.defaultLanguage as Language;
        const fallbackLang = propertySettings.fallbackLanguage as Language;
        
        const initialTabs: Language[] = [defaultLang];
        if (fallbackLang !== defaultLang) {
          initialTabs.push(fallbackLang);
        }
        
        setActiveTabs(initialTabs);
        setActiveTab(defaultLang);
      } catch (error) {
        // Fallback: create locales from Settings supportedLanguages
        const fallbackLocales = propertySettings.supportedLanguages.map((code: string) => ({
          code,
          name: getLanguageName(code),
          native_name: getLanguageName(code)
        }));
        setAvailableLocales(fallbackLocales);
        
        const defaultLang = propertySettings.defaultLanguage as Language;
        const fallbackLang = propertySettings.fallbackLanguage as Language;
        
        const initialTabs: Language[] = [defaultLang];
        if (fallbackLang !== defaultLang) {
          initialTabs.push(fallbackLang);
        }
        
        setActiveTabs(initialTabs);
        setActiveTab(defaultLang);
      }
    };
    
    if (isOpen) {
      loadLocales();
    }
  }, [isOpen, propertySettings]);

  useEffect(() => {
    // When category or active tabs change, ensure translations keys match active tabs
    const allLanguageCodes = [...new Set([...activeTabs, ...propertySettings.supportedLanguages])];

    if (category) {
      const translations: any = buildEmptyTranslations(allLanguageCodes);
      // Fill with existing translations when present
      Object.entries(category.translations || {}).forEach(([code, value]) => {
        if (allLanguageCodes.includes(code)) {
          translations[code] = {
            title: (value as any).title || '',
            description: (value as any).description || ''
          };
        }
      });

      setFormData({
        slug: category.slug,
        icon: category.icon,
        translations
      });
    } else {
      const newTranslations = buildEmptyTranslations(allLanguageCodes);
      setFormData({
        slug: '',
        icon: '',
        translations: newTranslations
      });
    }
  }, [category, isOpen, activeTabs, propertySettings.supportedLanguages]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    
    if (!formData.icon) {
      alert('Please select an icon');
      return;
    }
    
    await onSave(formData);
    onClose();
  };

  const generateSlug = (title: string): void => {
    const slug = title.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSlugChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData(prev => ({ ...prev, slug: event.target.value }));
  };

  const handleIconSelect = (icon: string): void => {
    setFormData(prev => ({ ...prev, icon }));
  };

  const handleTabChange = (lang: Language): void => {
    setActiveTab(lang);
  };

  const handleTitleChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeTab as keyof typeof prev.translations]: {
          ...prev.translations[activeTab as keyof typeof prev.translations],  
          title: value
        }
      }
    }));

    // Generate slug only when editing the default language
    if (activeTab === propertySettings.defaultLanguage) {
      generateSlug(value);
    }
  };  

  const handleDescriptionChange = (event: React.ChangeEvent<HTMLTextAreaElement>): void => {
    const value = event.target.value;
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [activeTab]: {
          ...prev.translations[activeTab as keyof typeof prev.translations],
          description: value
        }
      }
    }));
  };

  const handleOpenRequestIconModal = (): void => {
    setIsRequestIconModalOpen(true);
  };

  const handleCloseRequestIconModal = (): void => {
    setIsRequestIconModalOpen(false);
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style={{zIndex: 9999}}>
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold">
              {category ? 'Edit Category' : 'Add New Category'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Language Tabs - Default + Fallback + Add Button */}
            <div className="mb-6">
              <div className="flex gap-2 pb-2 border-b border-gray-200 items-center">
                {/* Active Language Tabs */}
                {activeTabs.map((langCode) => {
                  // Always create a locale object for display, even if not in API
                  let locale = availableLocales.find(l => l.code === langCode);
                  if (!locale) {
                    // Create fallback locale object
                    locale = {
                      code: langCode,
                      name: getLanguageName(langCode),
                      native_name: getLanguageName(langCode)
                    };
                  }

                  return (
                    <div key={langCode} className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTabChange(langCode)}
                        className={`px-4 py-2 font-medium text-sm rounded-lg whitespace-nowrap transition-colors ${
                          activeTab === langCode
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {locale.native_name || locale.name} ({locale.code.toUpperCase()})
                      </button>

                      {/* Remove button (only if not default or fallback) */}
                      {langCode !== propertySettings.defaultLanguage &&
                       langCode !== propertySettings.fallbackLanguage && (
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTabs(prev => prev.filter(l => l !== langCode));
                            if (activeTab === langCode) {
                              setActiveTab(propertySettings.defaultLanguage as Language);
                            }
                          }}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTimes} className="text-xs" />
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Add Language Button */}
                <div className="relative" ref={languageDropdownRef}>
                  <button
                    ref={addButtonRef}
                    type="button"
                    onClick={() => {
                      if (!showLanguageDropdown && addButtonRef.current) {
                        const rect = addButtonRef.current.getBoundingClientRect();
                        const position = {
                          top: rect.bottom + window.scrollY + 4,
                          left: rect.left + window.scrollX,
                          width: Math.max(rect.width, 250)
                        };
                        setDropdownPosition(position);
                      }
                      
                      setShowLanguageDropdown(!showLanguageDropdown);
                    }}
                    className="w-8 h-8 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center relative z-10"
                  >
                    <FontAwesomeIcon icon={faPlus} className="text-sm" />
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                💡 Default: {propertySettings.defaultLanguage.toUpperCase()} | Fallback: {propertySettings.fallbackLanguage.toUpperCase()}
              </p>
            </div>

            {/* Language Content - Title First */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title ({availableLocales.find(l => l.code === activeTab)?.name || activeTab.toUpperCase()})
                </label>
                <input
                  type="text"
                  value={formData.translations[activeTab as keyof typeof formData.translations]?.title || ''}
                  onChange={handleTitleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Category title"
                  required={activeTab === 'en'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description ({availableLocales.find(l => l.code === activeTab)?.name || activeTab.toUpperCase()})
                </label>
                <textarea
                  value={formData.translations[activeTab as keyof typeof formData.translations]?.description || ''}
                  onChange={handleDescriptionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Brief description of this category"
                />
              </div>
            </div>

            {/* Slug Field - Moved After Title/Description */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category Slug (URL-friendly identifier)
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={handleSlugChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., vip-services"
                required
              />
            </div>

            {/* Icon Selection */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Category Icon
                </label>
                <button
                  type="button"
                  onClick={handleOpenRequestIconModal}
                  className="text-xs bg-green-50 hover:bg-green-100 text-green-700 px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Yêu cầu thêm icon
                </button>
              </div>
              
              {/* Search Bar */}
              <div className="mb-3">
                <input
                  type="text"
                  placeholder="🔍 Search icons... (e.g., wifi, pool, spa)"
                  value={iconSearch}
                  onChange={(e) => setIconSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Selected Icon Preview */}
              {formData.icon && (
                <div className="mb-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-lg flex items-center justify-center text-lg">
                    <i className={iconMap[formData.icon] || 'fas fa-box'}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">Selected: {formData.icon}</p>
                    <p className="text-xs text-gray-500">{iconMap[formData.icon]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, icon: '' }))}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </div>
              )}

              {/* Icon Grid with Scroll */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="max-h-[280px] overflow-y-auto p-3 bg-gray-50">
                  <div className="grid grid-cols-10 gap-1.5">
                    {availableIcons
                      .filter(icon => 
                        iconSearch === '' || 
                        icon.toLowerCase().includes(iconSearch.toLowerCase()) ||
                        (iconMap[icon] || '').toLowerCase().includes(iconSearch.toLowerCase())
                      )
                      .map((icon: string) => (
                        <button
                          key={icon}
                          type="button"
                          onClick={() => handleIconSelect(icon)}
                          title={icon}
                          className={`group relative w-full aspect-square border rounded-md flex items-center justify-center text-sm transition-all ${
                            formData.icon === icon
                              ? 'border-blue-500 bg-blue-500 text-white shadow-md scale-105'
                              : 'border-gray-300 bg-white hover:border-blue-400 hover:shadow-sm hover:scale-105'
                          }`}
                        >
                          <i className={iconMap[icon] || 'fas fa-box'}></i>
                          
                          {/* Tooltip on hover */}
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                            {icon}
                          </span>
                        </button>
                      ))}
                  </div>
                  
                  {/* No results message */}
                  {availableIcons.filter(icon => 
                    iconSearch === '' || 
                    icon.toLowerCase().includes(iconSearch.toLowerCase()) ||
                    (iconMap[icon] || '').toLowerCase().includes(iconSearch.toLowerCase())
                  ).length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <i className="fas fa-search text-3xl mb-2"></i>
                      <p className="text-sm">No icons found for "{iconSearch}"</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 justify-end pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Save Category
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Portal Dropdown outside modal */}
      {showLanguageDropdown && ReactDOM.createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 10000 }}
            onClick={() => setShowLanguageDropdown(false)}
          />
          
          {/* Dropdown */}
          <div 
            className="fixed bg-white rounded-lg shadow-xl border border-gray-200"
            style={{ 
              zIndex: 10001,
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              minWidth: '280px',
              maxHeight: '300px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
            }}
          >
            {/* Header */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm font-medium text-gray-700">Add Language</p>
              <p className="text-xs text-gray-500">Choose from supported languages</p>
            </div>
            
            {(() => {
              // Filter by supported languages only (not all available locales)
              const supportedLocales = availableLocales.filter(locale => 
                propertySettings.supportedLanguages.includes(locale.code)
              );
              // Remove languages that are already in active tabs
              const remainingLocales = supportedLocales.filter(locale => 
                !activeTabs.includes(locale.code as Language)
              );
              
              if (remainingLocales.length === 0) {
                return (
                  <div className="px-4 py-6 text-center">
                    <div className="text-gray-400 mb-2">
                      <FontAwesomeIcon icon={faPlus} className="text-2xl" />
                    </div>
                    <p className="text-sm text-gray-500">All supported languages added</p>
                  </div>
                );
              }
              
              return (
                <div className="py-1 max-h-48 overflow-y-auto">
                  {remainingLocales.map(locale => (
                    <button
                      key={locale.code}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Add to active tabs and switch to it
                        const newTabs = [...activeTabs, locale.code as Language];
                        
                        setActiveTabs(newTabs);
                        setActiveTab(locale.code as Language);
                        
                        // Ensure formData includes the new language
                        setFormData(prev => ({
                          ...prev,
                          translations: {
                            ...prev.translations,
                            [locale.code]: { title: '', description: '' }
                          }
                        }));
                        
                        // Close dropdown after brief delay
                        setTimeout(() => {
                          setShowLanguageDropdown(false);
                        }, 100);
                      }}
                      className="w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors flex items-center gap-3 cursor-pointer"
                    >
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 text-sm">
                          {locale.native_name || locale.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {locale.code.toUpperCase()}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              );
            })()}
          </div>
        </>,
        document.body
      )}

      {/* Request Icon Modal */}
      <RequestIconModal
        isOpen={isRequestIconModalOpen}
        onClose={handleCloseRequestIconModal}
      />
    </>
  );
};