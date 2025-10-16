// src/components/categories/TranslateModal.tsx
import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom";
import type { Category, Language } from "../../types/categories";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync, faChevronDown, faSearch, faCheck } from '@fortawesome/free-solid-svg-icons';
import { localesApi } from '../../services/localesApi';
import type { Locale } from '../../services/localesApi';
import { usePropertySettings } from '../../hooks/usePropertySettings';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: Category | null;
  onAcceptTranslation: (
    categoryId: number,
    targetLang: Language,
    translatedData: { title: string; description: string }
  ) => void;
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  category,
  onAcceptTranslation,
}) => {
  const { settings: propertySettings } = usePropertySettings();
  const [targetLanguage, setTargetLanguage] = useState<Language>("vi");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");
  const [availableLocales, setAvailableLocales] = useState<Locale[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery('');
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  // Load available locales from Settings (supported languages)
  useEffect(() => {
    if (!isOpen) return;

    const loadLocales = async () => {
      try {
        console.log('🔄 [Categories] Loading locales for TranslateModal...');

        // Get property settings to check supported languages
        const propertyId = localStorage.getItem('selected_property_id');

        // Always get all locales first
        const allLocales = await localesApi.getLocales();
        console.log('📋 [Categories] All locales from API:', allLocales.length, allLocales.map(l => l.code));

        if (!propertyId) {
          console.log('⚠️ [Categories] No property selected, using all locales');
          setAvailableLocales(allLocales);
          return;
        }

        // Get property settings
        const response = await fetch(`/api/v1/properties/${propertyId}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('access_token')}`,
            'X-Tenant-Code': localStorage.getItem('tenant_code') || ''
          }
        });

        if (response.ok) {
          const property = await response.json();
          const supportedLanguages = property.settings_json?.localization?.supportedLanguages || ['en', 'vi'];
          console.log('✅ [Categories] Property supported languages:', supportedLanguages);

          // Filter by supported languages
          const filtered = allLocales.filter(locale => supportedLanguages.includes(locale.code));
          console.log('✅ [Categories] Filtered locales:', filtered.length, filtered.map(l => l.code));

          setAvailableLocales(filtered.length > 0 ? filtered : allLocales);
        } else {
          console.log('⚠️ [Categories] Failed to fetch property, using all locales');
          setAvailableLocales(allLocales);
        }
      } catch (error) {
        console.error('❌ [Categories] Failed to load locales:', error);
        // Fallback to basic locales
        const fallback = [
          { code: 'en', name: 'English', native_name: 'English' },
          { code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt' },
          { code: 'ja', name: 'Japanese', native_name: '日本語' },
          { code: 'ko', name: 'Korean', native_name: '한국어' }
        ];
        console.log('⚠️ [Categories] Using fallback locales:', fallback.map(l => l.code));
        setAvailableLocales(fallback);
      }
    };

    loadLocales();
  }, [isOpen]);

  // Get default locale from property settings
  const getDefaultLocale = (): Language => {
    return propertySettings.defaultLanguage as Language;
  };

  // Load category data and translations when modal opens
  useEffect(() => {
    if (!category || !isOpen) return;

    console.log('TranslateModal opened with category:', category);

    // Set original content (from default locale)
    const defaultLocale = getDefaultLocale();
    const defaultTranslation = category.translations?.[defaultLocale];

    const origTitle = defaultTranslation?.title || "";
    const origDesc = defaultTranslation?.description || "";

    setOriginalTitle(origTitle);
    setOriginalDescription(origDesc);

    // Pick a sensible default target language (first language that is not default)
    const selectable = availableLocales.map(l => l.code).filter(l => l !== defaultLocale);
    const defaultTarget = selectable.length > 0 ? selectable[0] as Language : defaultLocale;
    setTargetLanguage(defaultTarget);

    // Load existing translation for the target language if exists
    const existingTranslation = category.translations?.[defaultTarget];
    if (existingTranslation) {
      console.log('Found existing translation for', defaultTarget, ':', existingTranslation);
      setTranslatedTitle(existingTranslation.title || "");
      setTranslatedDescription(existingTranslation.description || "");
    } else {
      console.log('No existing translation for', defaultTarget, ', auto-translating...');
      // Auto-translate if no existing translation
      void autoTranslate(defaultTarget, origTitle, origDesc);
    }
  }, [category, isOpen]);

  const autoTranslate = async (targetLang: Language, title: string, description: string) => {
    if (!title && !description) return;

    setIsRegenerating(true);
    try {
      // Use translation API
      const { translationsApi } = await import('../../services/translationsApi');
      const textsToTranslate = [title, description].filter(t => t.trim());
      
      if (textsToTranslate.length > 0) {
        const results = await translationsApi.translateBatch(textsToTranslate, targetLang, 'auto', false, 4);
        if (Array.isArray(results) && results.length >= 1) {
          setTranslatedTitle(results[0] || title);
          setTranslatedDescription(results[1] || description);
        }
      }
    } catch (e) {
      console.warn('[TranslateModal] auto-translate failed', e);
      // Fallback to original
      setTranslatedTitle(title);
      setTranslatedDescription(description);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleLanguageChange = async (lang: Language) => {
    if (lang === getDefaultLocale() || isRegenerating) return;
    
    setTargetLanguage(lang);

    // Check if translation already exists
    const existing = category?.translations?.[lang];
    if (existing) {
      setTranslatedTitle(existing.title || "");
      setTranslatedDescription(existing.description || "");
    } else {
      // Auto-translate to this language
      await autoTranslate(lang, originalTitle, originalDescription);
    }
  };

  const handleRegenerate = async () => {
    await autoTranslate(targetLanguage, originalTitle, originalDescription);
  };

  const handleSave = () => {
    if (!category) {
      console.error('Cannot save: category is null');
      return;
    }
    if (!category.id) {
      console.error('Cannot save: category.id is undefined', category);
      alert('Error: Category ID is missing');
      return;
    }
    console.log('Saving translation for category:', category.id, 'language:', targetLanguage);
    onAcceptTranslation(category.id, targetLanguage, {
      title: translatedTitle,
      description: translatedDescription
    });
  };

  if (!isOpen || !category) return null;

  const defaultLocale = getDefaultLocale();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="p-5 border-b border-slate-200 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLanguage} className="text-xl text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">AI Translation</h2>
            <span className="px-2 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-semibold rounded-full">
              ⚡ DeepL Powered
            </span>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        {/* Language Selection - Outside scrollable area */}
        <div className="p-6 pb-0 flex-shrink-0 border-b border-slate-200">
          <label className="font-semibold text-slate-700 mb-3 block">Translate to:</label>

          {/* Dropdown Select */}
          <div className="relative">
            <button
              ref={buttonRef}
              type="button"
              onClick={() => {
                console.log('🖱️ [Categories] Dropdown clicked! Current:', isDropdownOpen, '→ New:', !isDropdownOpen, 'Locales:', availableLocales.length);

                if (!isDropdownOpen && buttonRef.current) {
                  const rect = buttonRef.current.getBoundingClientRect();
                  console.log('[Categories] Button position:', rect);
                  setDropdownPosition({
                    top: rect.bottom + window.scrollY,
                    left: rect.left + window.scrollX,
                    width: rect.width
                  });
                }

                setIsDropdownOpen(!isDropdownOpen);
              }}
              disabled={isRegenerating}
              className="w-full px-4 py-3 bg-white border-2 border-slate-300 rounded-lg text-left flex items-center justify-between hover:border-blue-500 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="flex items-center gap-2">
                <FontAwesomeIcon icon={faLanguage} className="text-slate-500" />
                <span className="font-medium text-slate-700">
                  {availableLocales.find(l => l.code === targetLanguage)?.native_name ||
                   availableLocales.find(l => l.code === targetLanguage)?.name ||
                   targetLanguage}
                </span>
                <span className="text-xs text-slate-500">
                  ({availableLocales.find(l => l.code === targetLanguage)?.code})
                </span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`text-slate-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {/* Dropdown Menu - Using Portal */}
          </div>

          {/* Render dropdown via Portal */}
          {isDropdownOpen && ReactDOM.createPortal(
            <>
              {/* Backdrop */}
              <div
                className="fixed inset-0 z-[250]"
                onClick={() => setIsDropdownOpen(false)}
              />

              {/* Dropdown */}
              <div
                ref={dropdownRef}
                className="fixed bg-white border-2 border-slate-300 rounded-lg shadow-2xl max-h-80 overflow-hidden"
                style={{
                  zIndex: 251,
                  top: `${dropdownPosition.top}px`,
                  left: `${dropdownPosition.left}px`,
                  width: `${dropdownPosition.width}px`
                }}
              >
                {/* Search Box */}
                <div className="p-3 border-b border-slate-200 sticky top-0 bg-white">
                  <div className="relative">
                    <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search languages..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                {/* Language List */}
                <div className="max-h-64 overflow-y-auto">
                  {availableLocales
                    .filter(locale => {
                      const query = searchQuery.toLowerCase();
                      return (
                        locale.name.toLowerCase().includes(query) ||
                        locale.native_name?.toLowerCase().includes(query) ||
                        locale.code.toLowerCase().includes(query)
                      );
                    })
                    .map(locale => {
                      const isDefault = defaultLocale === locale.code;
                      const hasTranslation = category?.translations?.[locale.code as Language];
                      const isSelected = targetLanguage === locale.code;
                      const isDisabled = isDefault;

                      return (
                        <button
                          key={locale.code}
                          onClick={() => {
                            if (!isDisabled) {
                              handleLanguageChange(locale.code as Language);
                              setIsDropdownOpen(false);
                              setSearchQuery('');
                            }
                          }}
                          disabled={isDisabled}
                          className={`w-full px-4 py-3 text-left flex items-center justify-between hover:bg-slate-50 transition-colors ${
                            isDisabled ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
                          } ${isSelected ? 'bg-blue-50 border-l-4 border-blue-600' : ''}`}
                          title={
                            isDefault
                              ? 'This is the original language'
                              : ''
                          }
                        >
                          <div className="flex flex-col">
                            <span className="font-medium text-slate-800">
                              {locale.native_name || locale.name}
                            </span>
                            <span className="text-xs text-slate-500">
                              {locale.name} ({locale.code})
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            {hasTranslation && (
                              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                <FontAwesomeIcon icon={faCheck} className="mr-1" />
                                Translated
                              </span>
                            )}
                            {isDefault && (
                              <span className="text-xs bg-slate-200 text-slate-600 px-2 py-1 rounded-full">
                                Original
                              </span>
                            )}
                            {isSelected && !isDisabled && (
                              <FontAwesomeIcon icon={faCheck} className="text-blue-600" />
                            )}
                          </div>
                        </button>
                      );
                    })}

                  {/* No Results */}
                  {availableLocales.filter(locale => {
                    const query = searchQuery.toLowerCase();
                    return (
                      locale.name.toLowerCase().includes(query) ||
                      locale.native_name?.toLowerCase().includes(query) ||
                      locale.code.toLowerCase().includes(query)
                    );
                  }).length === 0 && (
                    <div className="px-4 py-8 text-center text-slate-500">
                      <FontAwesomeIcon icon={faSearch} className="text-3xl mb-2 opacity-50" />
                      <p className="text-sm">No languages found</p>
                    </div>
                  )}
                </div>
              </div>
            </>,
            document.body
          )}

          {/* Helper Text */}
          <p className="mt-2 text-xs text-slate-500">
            💡 <strong>DeepL Translation:</strong> High-quality AI translation with hotel industry glossary
          </p>
        </div>

        {/* Content */}
        <div className="p-6 flex-grow overflow-y-auto space-y-6">
          {/* Original Content */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-800">Original ({defaultLocale.toUpperCase()})</h3>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Title</label>
                <div className="mt-1 p-3 bg-slate-50 rounded-md text-sm border border-slate-200">
                  {originalTitle || <span className="text-slate-400">No title</span>}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <div className="mt-1 p-3 bg-slate-50 rounded-md text-sm border border-slate-200">
                  {originalDescription || <span className="text-slate-400">No description</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Translation */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-semibold text-slate-800">Translation ({targetLanguage.toUpperCase()})</h3>
              <button
                onClick={handleRegenerate}
                disabled={isRegenerating}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FontAwesomeIcon icon={faSync} className={isRegenerating ? 'animate-spin' : ''} />
                {isRegenerating ? 'Translating...' : 'Regenerate'}
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-slate-600">Title</label>
                <input
                  type="text"
                  value={translatedTitle}
                  onChange={(e) => setTranslatedTitle(e.target.value)}
                  className="mt-1 w-full p-3 border border-green-200 bg-green-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Translated title"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Description</label>
                <textarea
                  value={translatedDescription}
                  onChange={(e) => setTranslatedDescription(e.target.value)}
                  rows={4}
                  className="mt-1 w-full p-3 border border-green-200 bg-green-50 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-green-400"
                  placeholder="Translated description"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isRegenerating}
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Use Translation
          </button>
        </div>
      </div>
    </div>
  );
};

