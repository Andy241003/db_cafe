// src/components/categories/CategoryModal.tsx

import React, { useState, useEffect } from 'react';
import { RequestIconModal } from './RequestIconModal';
import type { Category, CategoryFormData, Language } from '../../types/categories';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CategoryFormData) => Promise<void>;
  category?: Category;
}

const availableIcons: string[] = [
  'info-circle', 'concierge-bell', 'building', 'hiking',
  'car', 'spa', 'utensils', 'shopping-bag', 'share-alt',
  'file-contract', 'star', 'heart'
];

const iconMap: Record<string, string> = {
  'info-circle': 'fa-info-circle',
  'concierge-bell': 'fa-concierge-bell',
  'building': 'fa-building',
  'hiking': 'fa-hiking',
  'car': 'fa-car',
  'spa': 'fa-spa',
  'utensils': 'fa-utensils',
  'shopping-bag': 'fa-shopping-bag',
  'share-alt': 'fa-share-alt',
  'file-contract': 'fa-file-contract',
  'star': 'fa-star',
  'heart': 'fa-heart'
};

const languageLabels: Partial<Record<Language, string>> = {
  en: 'English',
  vi: 'Tiếng Việt',
  ja: '日本語'
};

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  category
}) => {
  const [activeTab, setActiveTab] = useState<Language>('en');
  const [isRequestIconModalOpen, setIsRequestIconModalOpen] = useState(false);
  const [formData, setFormData] = useState<CategoryFormData>({
    slug: '',
    icon: '',
    translations: {
      en: { title: '', description: '' },
      vi: { title: '', description: '' },
      ja: { title: '', description: '' }
    } 
  });

  useEffect(() => {
    if (category) {
      setFormData({
        slug: category.slug,
        icon: category.icon,
        translations: {
          en: category.translations.en || { title: '', description: '' },
          vi: category.translations.vi || { title: '', description: '' },
          ja: category.translations.ja || { title: '', description: '' }
        }
      });
    } else {
      setFormData({
        slug: '',
        icon: '',
        translations: {
          en: { title: '', description: '' },
          vi: { title: '', description: '' },
          ja: { title: '', description: '' }
        }
      });
    }
  }, [category, isOpen]);

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

    if (activeTab === 'en') {
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
        <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
            {/* Language Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {(['en', 'vi', 'ja'] as Language[]).map((lang: Language) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => handleTabChange(lang)}
                  className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === lang
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {languageLabels[lang]}
                </button>
              ))}
            </div>

            {/* Slug Field */}
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
              <div className="flex items-center justify-between mb-2">
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
              <div className="grid grid-cols-6 gap-2">
                {availableIcons.map((icon: string) => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => handleIconSelect(icon)}
                    className={`w-10 h-10 border-2 rounded-lg flex items-center justify-center text-lg transition-colors ${
                      formData.icon === icon
                        ? 'border-blue-500 bg-blue-500 text-white'
                        : 'border-gray-300 bg-gray-50 hover:border-blue-400'
                    }`}
                  >
                    <i className={`fas ${iconMap[icon] || 'fa-box'}`}></i>
                  </button>
                ))}   
              </div>
            </div>

            {/* Language Content */}
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title ({languageLabels[activeTab]})
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
                  Description ({languageLabels[activeTab]})
                </label>
                <textarea
                  value={formData.translations[activeTab as keyof typeof formData.translations]?.description || ''}
                  onChange={handleDescriptionChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[80px]"
                  placeholder="Brief description of this category"
                />
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

      {/* Request Icon Modal */}
      <RequestIconModal
        isOpen={isRequestIconModalOpen}
        onClose={handleCloseRequestIconModal}
      />
    </>
  );
};