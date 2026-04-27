// src/components/TranslationModal.tsx
import { faArrowRotateLeft, faFloppyDisk } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState, useCallback, useMemo, useEffect } from 'react';

interface TranslationField {
  key: string;
  label: string;
  type: 'input' | 'textarea';
  rows?: number;
  required?: boolean;
}

interface TranslationModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (translations: Record<string, Record<string, string>>) => Promise<void>;
  fields: TranslationField[];
  initialData?: Record<string, Record<string, string>>; // { vi: {...}, en: {...} }
  supportedLanguages?: string[];
  title?: string;
}

const LANGUAGE_CONFIG = {
  vi: { name: 'Vietnamese', flag: 'VN', shortLabel: 'VI' },
  en: { name: 'English', flag: 'GB', shortLabel: 'EN' },
  zh: { name: 'Chinese', flag: 'CN', shortLabel: 'ZH' },
  'zh-TW': { name: 'Traditional Chinese', flag: 'TW', shortLabel: 'ZH-TW' },
  ja: { name: 'Japanese', flag: 'JP', shortLabel: 'JA' },
  ko: { name: 'Korean', flag: 'KR', shortLabel: 'KO' },
  th: { name: 'Thai', flag: 'TH', shortLabel: 'TH' },
  yue: { name: 'Cantonese', flag: 'HK', shortLabel: 'YUE' },
};

const getLanguageDisplay = (locale: string) => {
  return LANGUAGE_CONFIG[locale as keyof typeof LANGUAGE_CONFIG] || { name: locale.toUpperCase(), flag: locale.toUpperCase(), shortLabel: locale.toUpperCase() };
};

const TranslationModal: React.FC<TranslationModalProps> = ({
  visible,
  onClose,
  onSave,
  fields,
  initialData = {},
  supportedLanguages = ['vi', 'en'],
  title = 'Edit Translations',
}) => {
  const [currentLocale, setCurrentLocale] = useState<string>(supportedLanguages[0]);
  const [translations, setTranslations] = useState<Record<string, Record<string, string>>>(initialData);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setTranslations(initialData);
      setCurrentLocale(supportedLanguages[0]);
    }
  }, [visible, initialData, supportedLanguages]);

  const hasChanges = useMemo(() => {
    return JSON.stringify(translations) !== JSON.stringify(initialData);
  }, [translations, initialData]);

  const handleFieldChange = useCallback((locale: string, fieldKey: string, value: string) => {
    setTranslations(prev => ({
      ...prev,
      [locale]: {
        ...(prev[locale] || {}),
        [fieldKey]: value,
      },
    }));
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(translations);
      onClose();
    } catch (error) {
      console.error('Failed to save translations:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    if (hasChanges && !window.confirm('You have unsaved changes. Are you sure you want to cancel?')) {
      return;
    }
    onClose();
  }, [hasChanges, onClose]);

  if (!visible) return null;

  const currentData = translations[currentLocale] || {};

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-900 px-6 py-4 text-white">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-slate-300 mt-1">
            Manage content in multiple languages
          </p>
        </div>

        {/* Language Tabs */}
        <div className="border-b border-slate-200 bg-slate-50 px-6">
          <div className="flex gap-1 -mb-px">
            {supportedLanguages.map((locale) => {
              const config = getLanguageDisplay(locale);
              
              const isActive = currentLocale === locale;
              return (
                <button
                  key={locale}
                  onClick={() => setCurrentLocale(locale)}
                  className={`px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {config.shortLabel}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-5">
            {fields.map((field) => {
              const value = currentData[field.key] || '';
              const baseInputClass = "w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none";
              
              return (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {field.label}
                    {field.required && <span className="text-red-500 ml-1">*</span>}
                  </label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={value}
                      onChange={(e) => handleFieldChange(currentLocale, field.key, e.target.value)}
                      rows={field.rows || 4}
                      className={baseInputClass}
                      placeholder={`Enter ${field.label.toLowerCase()} in ${getLanguageDisplay(currentLocale).name}`}
                    />
                  ) : (
                    <input
                      type="text"
                      value={value}
                      onChange={(e) => handleFieldChange(currentLocale, field.key, e.target.value)}
                      className={baseInputClass}
                      placeholder={`Enter ${field.label.toLowerCase()} in ${getLanguageDisplay(currentLocale).name}`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Progress Indicator */}
          <div className="mt-6 pt-6 border-t border-slate-200">
            <p className="text-sm text-slate-600 mb-3">Translation Progress:</p>
            <div className="flex gap-2">
              {supportedLanguages.map((locale) => {
                const config = getLanguageDisplay(locale);
                
                const localeData = translations[locale] || {};
                const filledFields = fields.filter(f => localeData[f.key]?.trim()).length;
                const progress = (filledFields / fields.length) * 100;
                const isComplete = progress === 100;
                
                return (
                  <div key={locale} className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-slate-600">
                        {config.flag} {config.name}
                      </span>
                      <span className={`text-xs font-medium ${isComplete ? 'text-green-600' : 'text-slate-500'}`}>
                        {filledFields}/{fields.length}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 px-6 py-4 bg-slate-50 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            disabled={isSaving}
            className="px-5 py-2.5 rounded-lg font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            <FontAwesomeIcon icon={faArrowRotateLeft} className="mr-2" />
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving || !hasChanges}
            className="px-5 py-2.5 rounded-lg font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <FontAwesomeIcon icon={faFloppyDisk} className="mr-2" />
            {isSaving ? 'Saving...' : 'Save Translations'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TranslationModal;


