import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync, faCheck } from '@fortawesome/free-solid-svg-icons';
import { translationsApi } from '../../services/translationsApi';

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

const TranslateModal: React.FC<TranslateModalProps> = ({ isOpen, onClose, post, onTranslate }) => {
  const [targetLanguage, setTargetLanguage] = useState('vi');
  const [translatedTitle, setTranslatedTitle] = useState('');
  const [translatedContent, setTranslatedContent] = useState('');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [originalContent, setOriginalContent] = useState('');

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
            setTranslatedContent(contentResult[0] || '');
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
      setTranslatedContent(contentResult[0] || '');
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
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        <header className="p-5 border-b border-slate-200 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <FontAwesomeIcon icon={faLanguage} className="text-xl text-slate-600" />
            <h2 className="text-lg font-bold text-slate-800">AI Translation</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-100">
            <FontAwesomeIcon icon={faTimes} className="text-slate-600" />
          </button>
        </header>

        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-6">
            <label className="font-semibold text-slate-700 mb-2 block">Translate to:</label>
            <div className="flex gap-2">
              {[
                { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
                { code: 'ja', name: '日本語', flag: '🇯🇵' },
                { code: 'en', name: 'English', flag: '🇬🇧' },
                { code: 'ko', name: '한국어', flag: '🇰🇷' }
              ].map(lang => {
                const isDefault = post?.locale === lang.code;
                const hasTranslation = post?.translations?.some((t: any) => t.locale === lang.code);
                const isDisabled = isDefault || hasTranslation || isRegenerating;

                return (
                  <button
                    key={lang.code}
                    onClick={() => {
                      if (isDisabled) return;
                      setTargetLanguage(lang.code);
                    }}
                    disabled={isDisabled}
                    className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                      isDefault || hasTranslation
                        ? 'bg-slate-200 text-slate-500 opacity-60 cursor-not-allowed'
                        : targetLanguage === lang.code
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    title={
                      isDefault
                        ? 'This is the default locale for the post'
                        : hasTranslation
                          ? 'Translation already exists for this language'
                          : isRegenerating
                            ? 'Translating...'
                            : ''
                    }
                  >
                    {`${lang.flag} ${lang.name}`}
                    {hasTranslation && !isDefault && <FontAwesomeIcon icon={faCheck} className="ml-2 text-green-600" />}
                  </button>
                );
              })}
            </div>
          </div>

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
                <textarea value={translatedContent} onChange={e => setTranslatedContent(e.target.value)} rows={10} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
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