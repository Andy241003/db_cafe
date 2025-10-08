// src/components/properties/TranslateModal.tsx
import React, { useState, useEffect } from 'react';
import type { HotelPost, TranslationData } from '../../types/properties';
import { localesApi } from '../../services/localesApi';
import type { Locale } from '../../services/localesApi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync, faCheck } from '@fortawesome/free-solid-svg-icons';
import { translationsApi } from '../../services/translationsApi';

interface TranslateModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: HotelPost | null;
  onSave: (translationData: TranslationData) => void;
}

export const TranslateModal: React.FC<TranslateModalProps> = ({
  isOpen,
  onClose,
  post,
  onSave
}) => {
  const [languages, setLanguages] = useState<Array<Locale>>([
    { code: 'en', name: 'English' },
    { code: 'vi', name: 'Vietnamese' },
    { code: 'ja', name: 'Japanese' },
    { code: 'ko', name: 'Korean' }
  ]);
  const [targetLanguage, setTargetLanguage] = useState<string>('en');
  const [originalContent, setOriginalContent] = useState<string>('');
  const [translatedContent, setTranslatedContent] = useState<string>('');
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (!post) return;
    // initialize original content
    setOriginalContent(post.content || '');

    // fetch available locales from backend, fallback to built-in list
    (async () => {
      let available: Array<Locale> = [
        { code: 'en', name: 'English' },
        { code: 'vi', name: 'Vietnamese' },
        { code: 'ja', name: 'Japanese' },
        { code: 'ko', name: 'Korean' }
      ];
      try {
        const remote = await localesApi.getLocales();
        if (Array.isArray(remote) && remote.length > 0) {
          available = remote;
          setLanguages(remote);
          console.debug('[TranslateModal] loaded locales:', remote.map(r => r.code));
        } else {
          setLanguages(available);
        }
      } catch (e) {
        console.warn('[TranslateModal] failed to load locales, using fallback', e);
        setLanguages(available);
      }

      // pick a sensible default target language (first language that is not the post's locale)
      const selectable = available.map(l => l.code).filter(l => l !== (post.locale || 'en'));
      const defaultLang = selectable.length > 0 ? selectable[0] : (post.locale || 'en');
      setTargetLanguage(defaultLang);

      // load existing translation for the defaultLang if exists; otherwise trigger auto-translate
      const existing = (post.translations || []).find(t => t.locale === defaultLang);
      if (existing && existing.content) {
        setTranslatedContent(existing.content);
      } else {
        // If there's no existing translation, attempt to auto-translate now
        if ((post.content || '').trim()) {
          setIsRegenerating(true);
          try {
            const results = await translationsApi.translateBatch([post.content || ''], defaultLang, 'auto', true, 4);
            if (Array.isArray(results) && results.length > 0) {
              setTranslatedContent(results[0]);
            } else {
              setTranslatedContent(getTranslatedContent(defaultLang, post.content));
            }
          } catch (e) {
            console.warn('[TranslateModal] auto-translate failed on open, using fallback', e);
            setTranslatedContent(getTranslatedContent(defaultLang, post.content));
          } finally {
            setIsRegenerating(false);
          }
        } else {
          setTranslatedContent(getTranslatedContent(defaultLang, post.content));
        }
      }
    })();
  }, [post]);


  const getTranslatedContent = (lang: string, original: string) => {
    if (lang === 'vi') return '<strong>Chào mừng đến với Khách sạn Tabi Tower</strong><br>Trải nghiệm sự sang trọng và thoải mái...';
    if (lang === 'ja') return '<strong>タビタワーホテルへようこそ</strong><br>ホーチミン市の中心部で贅沢と快適さを体験してください...';
    return original;
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      // Use translation service to translate the original content into targetLanguage
      const results = await translationsApi.translateBatch([originalContent], targetLanguage, 'auto', true, 4);
      if (Array.isArray(results) && results.length > 0) {
        setTranslatedContent(results[0]);
      }
    } catch (e) {
      console.warn('Translation regenerate failed, falling back to mock', e);
      setTranslatedContent(getTranslatedContent(targetLanguage, originalContent) + ' (regenerated)');
    } finally {
      setIsRegenerating(false);
    }
  };

  // Helper to translate to a selected language (used when user clicks a language)
  const translateToLanguage = async (lang: string) => {
    // If no original content, nothing to do
    if (!originalContent || originalContent.trim() === '') {
      setTranslatedContent('');
      return;
    }

    setIsRegenerating(true);
    try {
      const results = await translationsApi.translateBatch([originalContent], lang, 'auto', true, 4);
      if (Array.isArray(results) && results.length > 0) {
        setTranslatedContent(results[0]);
      }
    } catch (e) {
      console.warn('[TranslateModal] translateToLanguage failed', e);
      setTranslatedContent(getTranslatedContent(lang, originalContent));
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleSave = () => {
    // Only translate content — pass locale and content to parent
    onSave({ locale: targetLanguage, content: translatedContent } as any);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-[200] p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLanguage} className="text-xl text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">Translate Post</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-6">
            <label className="font-semibold text-slate-700 mb-2 block">Translate to:</label>
            <div className="flex gap-2">
              {languages.map(lang => {
                const code = lang.code;
                const isDefault = post?.locale === code;
                return (
                  <button
                    key={code}
                    onClick={() => {
                      if (isDefault || isRegenerating) return;
                      setTargetLanguage(code);
                      const existing = (post?.translations || []).find(t => t.locale === code);
                      if (existing && existing.content) {
                        setTranslatedContent(existing.content);
                      } else {
                        // Trigger auto-translate for this language
                        void translateToLanguage(code);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      post?.locale === code
                        ? 'bg-slate-200 text-slate-500 opacity-60 cursor-not-allowed'
                        : (targetLanguage === code ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
                    }`}
                    disabled={isDefault || isRegenerating}
                    title={isDefault ? 'This is the default locale for the post' : (isRegenerating ? 'Translating...' : '')}
                  >
                    {lang.code === 'vi' ? '🇻🇳 ' + (lang.name || 'Tiếng Việt') : lang.code === 'ja' ? '🇯🇵 ' + (lang.name || '日本語') : '🇬🇧 ' + (lang.name || 'English')}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-slate-800 border-b pb-2">Original ({post?.locale})</h3>
            <div>
              <label className="text-sm font-medium text-slate-600">Content</label>
              <div className="mt-1 p-2 bg-slate-50 rounded-md text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: originalContent }} />
            </div>

            <h3 className="font-semibold text-slate-800 border-b pb-2">Translation ({targetLanguage})</h3>
            <div>
              <label className="text-sm font-medium text-slate-600">Content</label>
              <textarea value={translatedContent} onChange={e => setTranslatedContent(e.target.value)} rows={10} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
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
              onClick={handleSave}
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white bg-blue-600 flex items-center gap-2 hover:bg-blue-700"
            >
              <FontAwesomeIcon icon={faCheck} />
              Accept & Save
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};