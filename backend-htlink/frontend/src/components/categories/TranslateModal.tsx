// src/components/categories/TranslateModal.tsx
import React, { useState, useEffect } from "react";
import type { Category, Language } from "../../types/categories";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync } from '@fortawesome/free-solid-svg-icons';

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

const AVAILABLE_LANGS = [
  { code: "vi" as Language, flag: "🇻🇳", label: "Tiếng Việt" },
  { code: "en" as Language, flag: "🇬🇧", label: "English" },
  { code: "ja" as Language, flag: "🇯🇵", label: "日本語" },
  { code: "ko" as Language, flag: "🇰🇷", label: "한국어" },
  { code: "fr" as Language, flag: "🇫🇷", label: "Français" },
];

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  category,
  onAcceptTranslation,
}) => {
  const [targetLanguage, setTargetLanguage] = useState<Language>("vi");
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [originalTitle, setOriginalTitle] = useState("");
  const [originalDescription, setOriginalDescription] = useState("");
  const [translatedTitle, setTranslatedTitle] = useState("");
  const [translatedDescription, setTranslatedDescription] = useState("");

  // Get default locale from category
  const getDefaultLocale = (): Language => {
    // Assume 'en' is default, or you can add a field to Category type
    return "en";
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
    const selectable = AVAILABLE_LANGS.map(l => l.code).filter(l => l !== defaultLocale);
    const defaultTarget = selectable.length > 0 ? selectable[0] : defaultLocale;
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLanguage} className="text-xl text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">AI Translation</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        {/* Language Selection */}
        <div className="p-6 border-b border-slate-200">
          <label className="font-semibold text-slate-700 mb-3 block">Translate to:</label>
          <div className="flex gap-2 flex-wrap">
            {AVAILABLE_LANGS.map(lang => {
              const isDefault = defaultLocale === lang.code;
              const isActive = targetLanguage === lang.code;
              const isDisabled = isDefault || isRegenerating;

              return (
                <button
                  key={lang.code}
                  onClick={() => handleLanguageChange(lang.code)}
                  disabled={isDisabled}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    isDefault
                      ? 'bg-slate-200 text-slate-500 opacity-60 cursor-not-allowed'
                      : isActive
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                  title={isDefault ? 'This is the default locale' : (isRegenerating ? 'Translating...' : '')}
                >
                  {lang.flag} {lang.label}
                </button>
              );
            })}
          </div>
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
        <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-300 rounded-lg text-slate-700 bg-white hover:bg-slate-50 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isRegenerating}
            className="px-5 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Use Translation
          </button>
        </div>
      </div>
    </div>
  );
};

