import { faArrowRotateLeft, faCircleInfo, faEye, faFloppyDisk, faPlay, faPlus, faTrash, faVrCardboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cafeLanguagesApi, cafeContentSectionsApi, cafeSettingsApi } from '../../services/cafeApi';
import type { ContentSection, ContentSectionTranslation } from '../../services/cafeApi';

// CSS Class Constants
const INPUT_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const TEXTAREA_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-2';
const SECTION_CLASS = 'bg-white rounded-lg shadow p-6';

interface ContentFormData {
  id?: number;
  section_type: 'feature' | 'value';
  page_code: 'home' | 'about';
  icon?: string;
  is_active: boolean;
  translations: {
    [locale: string]: {
      title: string;
      description: string;
      content?: string;
    };
  };
}

const CafeHomeAbout: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);
  const [currentLocale, setCurrentLocale] = useState<string>('vi');
  const [features, setFeatures] = useState<ContentSection[]>([]);
  const [values, setValues] = useState<ContentSection[]>([]);
  const [editingContent, setEditingContent] = useState<ContentFormData | null>(null);
  const [editingType, setEditingType] = useState<'feature' | 'value' | null>(null);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadLanguagesAndContent();
  }, []);

  const loadLanguagesAndContent = async () => {
    try {
      setLoading(true);
      const languages = await cafeLanguagesApi.getLanguages();
      const langCodes = languages.map(lang => lang.locale);
      setSupportedLanguages(langCodes);
      
      if (langCodes.length > 0) {
        setCurrentLocale(langCodes[0]);
      }
      
      // Load display status and VR360 from settings
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.home_about_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.home_about_vr360_link || '');
      setVrTitle(settings.settings_json?.home_about_vr_title || '');
      
      await loadContent();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadContent = async () => {
    try {
      const allSections = await cafeContentSectionsApi.getContentSections('home');
      setFeatures(allSections.filter(s => s.section_type === 'feature'));
      setValues(allSections.filter(s => s.section_type === 'value'));
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load content sections');
    }
  };

  const handleAddNew = (type: 'feature' | 'value') => {
    const newContent: ContentFormData = {
      section_type: type,
      page_code: 'home',
      icon: type === 'feature' ? '⭐' : '💎',
      is_active: true,
      translations: {}
    };
    
    supportedLanguages.forEach(locale => {
      newContent.translations[locale] = {
        title: '',
        description: '',
        content: ''
      };
    });
    
    setEditingContent(newContent);
    setEditingType(type);
  };

  const handleEdit = (section: ContentSection) => {
    const formData: ContentFormData = {
      id: section.id,
      section_type: section.section_type as 'feature' | 'value',
      page_code: section.page_code as 'home' | 'about',
      icon: section.icon,
      is_active: section.is_active,
      translations: {}
    };
    
    supportedLanguages.forEach(locale => {
      const trans = section.translations?.find(t => t.locale === locale);
      formData.translations[locale] = {
        title: trans?.title || '',
        description: trans?.description || '',
        content: trans?.content || ''
      };
    });
    
    setEditingContent(formData);
    setEditingType(section.section_type as 'feature' | 'value');
  };

  const handleFieldChange = useCallback((field: keyof ContentFormData, value: any) => {
    if (!editingContent) return;
    setEditingContent(prev => prev ? { ...prev, [field]: value } : null);
  }, [editingContent]);

  const handleTranslationChange = useCallback((locale: string, field: string, value: string) => {
    if (!editingContent) return;
    setEditingContent(prev => prev ? {
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value
        }
      }
    } : null);
  }, [editingContent]);

  const handleSave = async () => {
    if (!editingContent) return;
    
    try {
      setSaving(true);
      
      const translations: ContentSectionTranslation[] = supportedLanguages.map(locale => ({
        locale,
        title: editingContent.translations[locale]?.title || '',
        description: editingContent.translations[locale]?.description || '',
        content: editingContent.translations[locale]?.content || ''
      }));
      
      if (editingContent.id) {
        await cafeContentSectionsApi.updateContentSection(editingContent.id, {
          section_type: editingContent.section_type,
          page_code: editingContent.page_code,
          icon: editingContent.icon,
          is_active: editingContent.is_active,
          translations
        });
        toast.success('Content section updated successfully!');
      } else {
        await cafeContentSectionsApi.createContentSection({
          section_type: editingContent.section_type,
          page_code: editingContent.page_code,
          icon: editingContent.icon,
          is_active: editingContent.is_active,
          translations
        });
        toast.success('Content section created successfully!');
      }
      
      setEditingContent(null);
      setEditingType(null);
      await loadContent();
    } catch (error: any) {
      console.error('Failed to save content section:', error);
      toast.error(error.response?.data?.detail || 'Failed to save content section');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      await cafeContentSectionsApi.deleteContentSection(id);
      toast.success('Content section deleted successfully!');
      await loadContent();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete content section');
    }
  };

  const handleCancel = useCallback(() => {
    setEditingContent(null);
    setEditingType(null);
  }, []);

  const handleDisplayToggle = async (newValue: boolean) => {
    try {
      setSavingDisplayStatus(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const existingJson = currentSettings.settings_json || {};
      
      await cafeSettingsApi.updateSettings({
        settings_json: {
          ...existingJson,
          home_about_is_displaying: newValue
        }
      });
      
      setIsDisplaying(newValue);
      toast.success(newValue ? 'Home & About section enabled' : 'Home & About section disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update display status');
      setIsDisplaying(!newValue);
    } finally {
      setSavingDisplayStatus(false);
    }
  };

  const handleVR360Change = async (field: 'link' | 'title', value: string) => {
    try {
      setSavingVR(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const existingJson = currentSettings.settings_json || {};
      
      const updates: any = { ...existingJson };
      if (field === 'link') {
        updates.home_about_vr360_link = value;
        setVr360Link(value);
      } else {
        updates.home_about_vr_title = value;
        setVrTitle(value);
      }
      
      await cafeSettingsApi.updateSettings({ settings_json: updates });
      toast.success('VR360 settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save VR360 settings');
    } finally {
      setSavingVR(false);
    }
  };

  const currentTranslation = useMemo(
    () => editingContent?.translations[currentLocale] || { title: '', description: '', content: '' },
    [editingContent, currentLocale]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading content...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className={SECTION_CLASS}>
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Home & About Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-500'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isDisplaying}
                onChange={(e) => handleDisplayToggle(e.target.checked)}
                disabled={savingDisplayStatus}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faCircleInfo} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Home & About" section will not appear on the website. You can still edit and manage content.
          </span>
        </div>
      </div>

      {/* VR360 Settings */}
      <div className={SECTION_CLASS}>
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link VR360 Panorama / YouTube Video
            </label>
            <input
              type="url"
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=VIDEO_ID"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vr360Link}
              onChange={(e) => handleVR360Change('link', e.target.value)}
              onBlur={(e) => handleVR360Change('link', e.target.value)}
              disabled={savingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>
                Hỗ trợ: Hình ảnh 360° (JPG, min 4096x2048px) hoặc video YouTube (tự động chuyển đổi sang embed)
              </span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vrTitle}
              onChange={(e) => handleVR360Change('title', e.target.value)}
              disabled={savingVR}
            />
          </div>
          
          {vr360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={vr360Link}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => window.open(vr360Link, '_blank')}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors flex items-center gap-2 mx-auto"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Home & About</h1>
        <p className="text-slate-600 mt-1">Manage home page features and core values with multilingual support</p>
      </div>

      {!editingContent && (
        <>
          {/* Features Section */}
          <div className={SECTION_CLASS}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Features / Highlights</h2>
              <button
                onClick={() => handleAddNew('feature')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Feature
              </button>
            </div>
            
            {features.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FontAwesomeIcon icon={faCircleInfo} className="text-3xl mb-3" />
                <p>No features found. Click "Add Feature" to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {features.map((feature) => {
                  const viTrans = feature.translations?.find(t => t.locale === 'vi');
                  const enTrans = feature.translations?.find(t => t.locale === 'en');
                  return (
                    <div key={feature.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{feature.icon || '⭐'}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(feature)}
                            className="text-sm px-2 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(feature.id)}
                            className="text-sm px-2 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {viTrans?.title || enTrans?.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {viTrans?.description || enTrans?.description || 'No description'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Values Section */}
          <div className={SECTION_CLASS}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-800">Core Values</h2>
              <button
                onClick={() => handleAddNew('value')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faPlus} />
                Add Value
              </button>
            </div>
            
            {values.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FontAwesomeIcon icon={faCircleInfo} className="text-3xl mb-3" />
                <p>No values found. Click "Add Value" to create one.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {values.map((value) => {
                  const viTrans = value.translations?.find(t => t.locale === 'vi');
                  const enTrans = value.translations?.find(t => t.locale === 'en');
                  return (
                    <div key={value.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div className="text-3xl">{value.icon || '💎'}</div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(value)}
                            className="text-sm px-2 py-1 text-blue-600 border border-blue-600 rounded hover:bg-blue-50"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(value.id)}
                            className="text-sm px-2 py-1 text-red-600 border border-red-600 rounded hover:bg-red-50"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </div>
                      </div>
                      <h3 className="font-semibold text-slate-900 mb-2">
                        {viTrans?.title || enTrans?.title || 'Untitled'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {viTrans?.description || enTrans?.description || 'No description'}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Edit/Create Form */}
      {editingContent && (
        <>
          {/* Basic Information */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingContent.id ? `Edit ${editingType === 'feature' ? 'Feature' : 'Value'}` : `Add New ${editingType === 'feature' ? 'Feature' : 'Value'}`}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Icon (emoji or symbol)</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editingContent.icon || ''}
                  onChange={(e) => handleFieldChange('icon', e.target.value)}
                  placeholder="e.g., ☕ 💎 ⭐"
                  maxLength={2}
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={editingContent.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    {editingContent.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Multilingual Content */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Content Details (Multilingual)</h2>
            
            {/* Language Tabs */}
            <div className="border-b border-slate-200 mb-6 flex gap-2 flex-wrap">
              {supportedLanguages.map(locale => (
                <button
                  key={locale}
                  onClick={() => setCurrentLocale(locale)}
                  className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                    currentLocale === locale
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {locale.toUpperCase()}
                </button>
              ))}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={LABEL_CLASS}>Title</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={currentTranslation.title}
                  onChange={(e) => handleTranslationChange(currentLocale, 'title', e.target.value)}
                  placeholder="Enter title in this language..."
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  rows={3}
                  className={TEXTAREA_CLASS}
                  value={currentTranslation.description}
                  onChange={(e) => handleTranslationChange(currentLocale, 'description', e.target.value)}
                  placeholder="Enter description in this language..."
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Additional Content (optional)</label>
                <textarea
                  rows={4}
                  className={TEXTAREA_CLASS}
                  value={currentTranslation.content || ''}
                  onChange={(e) => handleTranslationChange(currentLocale, 'content', e.target.value)}
                  placeholder="Enter additional content in this language..."
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-lg shadow p-6 flex justify-end gap-3">
            <button
              onClick={handleCancel}
              disabled={saving}
              className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faArrowRotateLeft} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CafeHomeAbout;
