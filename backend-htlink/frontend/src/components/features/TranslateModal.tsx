import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync, faCheck, faChevronDown, faSearch } from '@fortawesome/free-solid-svg-icons';
import { translationsApi } from '../../services/translationsApi';
import { localesApi } from '../../services/localesApi';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  locale: string;
  localeName: string;
  flagClass: string;
  status: 'published' | 'draft' | 'archived';
  updatedAt: string;
  content?: string;
  translations?: any[];
}

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: Post | null;
  onTranslate: (translationData: any) => void;
}

interface Locale {
  code: string;
  name: string;
  native_name?: string;
}

const TranslateModal: React.FC<TranslateModalProps> = ({ isOpen, onClose, post, onTranslate }) => {
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [originalContent, setOriginalContent] = useState('');
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
        // Get property settings to check supported languages
        const propertyId = localStorage.getItem('selected_property_id');

        // Always get all locales first
        const allLocales = await localesApi.getLocales();

        if (!propertyId) {
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

          // Filter by supported languages
          const filtered = allLocales.filter(locale => supportedLanguages.includes(locale.code));

          setAvailableLocales(filtered.length > 0 ? filtered : allLocales);
        } else {
          setAvailableLocales(allLocales);
        }
      } catch (error) {
        console.error('❌ Failed to load locales:', error);
        // Fallback to basic locales
        const fallback = [
          { code: 'en', name: 'English', native_name: 'English' },
          { code: 'vi', name: 'Vietnamese', native_name: 'Tiếng Việt' },
          { code: 'ja', name: 'Japanese', native_name: '日本語' },
          { code: 'ko', name: 'Korean', native_name: '한국어' }
        ];
        setAvailableLocales(fallback);
      }
    };

    loadLocales();
  }, [isOpen]);

  // Format HTML for better readability
  const formatHTML = (html: string): string => {
    if (!html) return '';
    
    return html
      // Add newlines after closing tags
      .replace(/<\/(h[1-6]|p|div|ul|ol|li|blockquote)>/gi, '</$1>\n')
      // Add newlines before opening tags
      .replace(/<(h[1-6]|p|div|ul|ol|li|blockquote)/gi, '\n<$1')
      // Add indentation for list items
      .replace(/<li>/gi, '  <li>')
      // Clean up multiple newlines
      .replace(/\n\n+/g, '\n\n')
      // Trim leading/trailing whitespace
      .trim();
  };

  useEffect(() => {
    if (post && isOpen) {
      // Set original content
      setOriginalContent(post.content || post.excerpt || '');

      // Check if translation already exists for target language
      const existingTranslation = post.translations?.find(t => t.locale === targetLanguage);

      if (existingTranslation) {
        // Use existing translation
        setTranslatedTitle(existingTranslation.title || '');
        setTranslatedContent(existingTranslation.content_html || existingTranslation.content || '');
      } else {
        // Auto-translate using API
        const autoTranslate = async () => {
          setIsRegenerating(true);
          try {
            const titleResult = await translationsApi.translateBatch(
              [post.title],
              targetLanguage,
              'auto',
              false,
              4
            );
            const contentResult = await translationsApi.translateBatch(
              [post.content || post.excerpt || ''],
              targetLanguage,
              'auto',
              true,
              4
            );

            setTranslatedTitle(titleResult[0] || post.title);
            // Format HTML for better readability
            const formattedContent = formatHTML(contentResult[0] || '');
            setTranslatedContent(formattedContent);
          } catch (error) {
            console.error('Auto-translation failed:', error);
            // Fallback to original
            setTranslatedTitle(post.title);
            setTranslatedContent(post.content || post.excerpt || '');
          } finally {
            setIsRegenerating(false);
          }
        };

        autoTranslate();
      }
    }
  }, [post, targetLanguage, isOpen]);

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const titleResult = await translationsApi.translateBatch(
        [post?.title || ''],
        targetLanguage,
        'auto',
        false,
        4
      );
      const contentResult = await translationsApi.translateBatch(
        [originalContent],
        targetLanguage,
        'auto',
        true,
        4
      );

      setTranslatedTitle(titleResult[0] || post?.title || '');
      // Format HTML for better readability
      const formattedContent = formatHTML(contentResult[0] || '');
      setTranslatedContent(formattedContent);
    } catch (error) {
      console.error('Regeneration failed:', error);
      alert('Failed to regenerate translation. Please try again.');
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleUseTranslation = () => {
    onTranslate({ 
      targetLanguage,
      title: translatedTitle,
      content: translatedContent
    });
    onClose();
  };

  if (!isOpen || !post) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
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

        {/* Language Selector - Outside scrollable area */}
        <div className="p-6 pb-0 flex-shrink-0 border-b border-slate-200">
          <div className="mb-6">
            <label className="font-semibold text-slate-700 mb-2 block">Translate to:</label>

            {/* Dropdown Select - Use Portal for proper rendering */}
            <div className="relative">
              <button
                ref={buttonRef}
                type="button"
                onClick={() => {
                  if (!isDropdownOpen && buttonRef.current) {
                    const rect = buttonRef.current.getBoundingClientRect();
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
            </div>

            {/* Dropdown Menu - Using Portal */}
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
                        const isDefault = post?.locale === locale.code;
                        const hasTranslation = post?.translations?.some((t: any) => t.locale === locale.code);
                        const isSelected = targetLanguage === locale.code;
                        const isDisabled = isDefault || hasTranslation;

                        return (
                          <button
                            key={locale.code}
                            onClick={() => {
                              if (!isDisabled) {
                                setTargetLanguage(locale.code);
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
                                : hasTranslation
                                  ? 'Translation already exists'
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
              💡 <strong>DeepL Translation:</strong> High-quality AI translation with hotel industry glossary (25+ terms)
            </p>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="p-6 pt-4 flex-grow overflow-y-auto">
          <div className="grid grid-cols-2 gap-6">
            {/* Original Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Original ({post.localeName})</h3>
              <div>
                <label className="text-sm font-medium text-slate-600">Title</label>
                <p className="mt-1 p-3 bg-slate-50 rounded-md text-sm font-semibold">{post.title}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Content</label>
                <div className="mt-1 p-3 bg-slate-50 rounded-md text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: post.content || post.excerpt }} />
              </div>
            </div>

            {/* Translated Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Translation ({targetLanguage})</h3>
              <div>
                <label className="text-sm font-medium text-slate-600">Title</label>
                <input type="text" value={translatedTitle} onChange={e => setTranslatedTitle(e.target.value)} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Content</label>
                <textarea 
                  value={translatedContent} 
                  onChange={e => setTranslatedContent(e.target.value)} 
                  rows={10} 
                  className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm font-mono"
                  placeholder="Translated content (HTML with images preserved)..."
                />
                <p className="mt-1 text-xs text-slate-500">
                  💡 Images from original content are automatically preserved in translation
                </p>
              </div>
            </div>
          </div>
        </div>

        <footer className="p-5 border-t border-slate-200 flex justify-between items-center bg-slate-50 rounded-b-2xl">
          <button 
            onClick={handleRegenerate}
            disabled={isRegenerating}
            className="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 bg-white border border-slate-300 flex items-center gap-2 hover:bg-slate-100 disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faSync} spin={isRegenerating} />
            {isRegenerating ? 'Regenerating...' : 'Regenerate'}
          </button>
          <div className="flex gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg font-semibold text-sm text-slate-700 bg-white border border-slate-300 hover:bg-slate-100">
              Cancel
            </button>
            <button 
              onClick={handleUseTranslation}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-green-600 flex items-center gap-2 hover:bg-green-700"
            >
              <FontAwesomeIcon icon={faCheck} />
              Use Translation
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default TranslateModal;