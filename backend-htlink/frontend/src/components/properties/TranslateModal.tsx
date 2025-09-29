// src/components/properties/TranslateModal.tsx
import React, { useState, useEffect } from 'react';
import type { HotelPost, TranslationData } from '../../types/properties';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes, faLanguage, faSync, faCheck } from '@fortawesome/free-solid-svg-icons';

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
  const [targetLanguage, setTargetLanguage] = useState<'en' | 'vi' | 'ja'>('vi');
  const [translationData, setTranslationData] = useState<TranslationData>({
    originalAddress: '',
    originalPhone: '',
    originalContent: '',
    translatedAddress: '',
    translatedPhone: '',
    translatedContent: '',
    targetLanguage: 'vi'
  });
  const [isRegenerating, setIsRegenerating] = useState(false);

  useEffect(() => {
    if (post) {
      const mockData: TranslationData = {
        originalAddress: post.address || '123 Nguyen Hue Street, District 1, Ho Chi Minh City',
        originalPhone: post.phone || '+84 28 3825 1234',
        originalContent: post.content,
        translatedAddress: getTranslatedAddress(targetLanguage, post.address || '123 Nguyen Hue Street, District 1, Ho Chi Minh City'),
        translatedPhone: post.phone || '+84 28 3825 1234',
        translatedContent: getTranslatedContent(targetLanguage, post.content),
        targetLanguage
      };
      setTranslationData(mockData);
    }
  }, [post, targetLanguage]);

  const getTranslatedAddress = (lang: string, original: string) => {
    if (lang === 'vi') return '123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh';
    if (lang === 'ja') return '123ホーチミン市1区グエンフエ通り';
    return original;
  };

  const getTranslatedContent = (lang: string, original: string) => {
    if (lang === 'vi') return '<strong>Chào mừng đến với Khách sạn Tabi Tower</strong><br>Trải nghiệm sự sang trọng và thoải mái...';
    if (lang === 'ja') return '<strong>タビタワーホテルへようこそ</strong><br>ホーチミン市の中心部で贅沢と快適さを体験してください...';
    return original;
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setTranslationData(prev => ({
      ...prev,
      translatedContent: getTranslatedContent(targetLanguage, prev.originalContent) + ' (regenerated)',
    }));
    setIsRegenerating(false);
  };

  const handleSave = () => {
    onSave(translationData);
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
              {['vi', 'ja', 'en'].map(lang => (
                <button 
                  key={lang}
                  onClick={() => setTargetLanguage(lang as 'vi' | 'ja' | 'en')}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    targetLanguage === lang 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {lang === 'vi' ? '🇻🇳 Tiếng Việt' : lang === 'ja' ? '🇯🇵 日本語' : '🇬🇧 English'}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Original Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Original ({post?.locale})</h3>
              <div>
                <label className="text-sm font-medium text-slate-600">Address</label>
                <p className="mt-1 p-2 bg-slate-50 rounded-md text-sm">{translationData.originalAddress}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Phone</label>
                <p className="mt-1 p-2 bg-slate-50 rounded-md text-sm">{translationData.originalPhone}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Content</label>
                <div className="mt-1 p-2 bg-slate-50 rounded-md text-sm prose max-w-none" dangerouslySetInnerHTML={{ __html: translationData.originalContent }} />
              </div>
            </div>

            {/* Translated Content */}
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-800 border-b pb-2">Translation ({targetLanguage})</h3>
              <div>
                <label className="text-sm font-medium text-slate-600">Address</label>
                <input type="text" value={translationData.translatedAddress} onChange={e => setTranslationData({...translationData, translatedAddress: e.target.value})} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Phone</label>
                <input type="text" value={translationData.translatedPhone} onChange={e => setTranslationData({...translationData, translatedPhone: e.target.value})} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-600">Content</label>
                <textarea value={translationData.translatedContent} onChange={e => setTranslationData({...translationData, translatedContent: e.target.value})} rows={8} className="w-full mt-1 p-2 border border-slate-300 rounded-md text-sm" />
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