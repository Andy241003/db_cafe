import { faArrowRotateLeft, faCircleInfo, faEye, faFloppyDisk, faPlay, faPlus, faTrash, faVrCardboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cafeLanguagesApi, cafeSpacesApi, cafeSettingsApi } from '../../services/cafeApi';
import type { Space, SpaceTranslation } from '../../services/cafeApi';

// CSS Class Constants
const INPUT_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const TEXTAREA_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-2';
const SECTION_CLASS = 'bg-white rounded-lg shadow p-6';

interface SpaceFormData {
  id?: number;
  code: string;
  capacity?: number;
  area_size?: string;
  is_active: boolean;
  translations: {
    [locale: string]: {
      name: string;
      description: string;
    };
  };
}

const CafeSpace: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);
  const [currentLocale, setCurrentLocale] = useState<string>('vi');
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [editingSpace, setEditingSpace] = useState<SpaceFormData | null>(null);
  const [originalSpace, setOriginalSpace] = useState<SpaceFormData | null>(null);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);

  useEffect(() => {
    loadLanguagesAndSpaces();
  }, []);

  const loadLanguagesAndSpaces = async () => {
    try {
      setLoading(true);
      const languages = await cafeLanguagesApi.getLanguages();
      const langCodes = languages.map(lang => lang.locale);
      setSupportedLanguages(langCodes);
      
      if (langCodes.length > 0) {
        setCurrentLocale(langCodes[0]);
      }
      
      // Load display status from settings
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.spaces_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.spaces_vr360_link || '');
      setVrTitle(settings.settings_json?.spaces_vr_title || '');
      
      await loadSpaces(langCodes);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadSpaces = async (langCodes: string[]) => {
    try {
      const data = await cafeSpacesApi.getSpaces();
      setSpaces(data);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load spaces');
    }
  };

  const handleAddNew = () => {
    const newSpace: SpaceFormData = {
      code: `space_${Date.now()}`,
      capacity: 0,
      area_size: '',
      is_active: true,
      translations: {}
    };
    
    supportedLanguages.forEach(locale => {
      newSpace.translations[locale] = {
        name: '',
        description: ''
      };
    });
    
    setEditingSpace(newSpace);
    setOriginalSpace(newSpace);
  };

  const handleEdit = (space: Space) => {
    const formData: SpaceFormData = {
      id: space.id,
      code: space.code,
      capacity: space.capacity,
      area_size: space.area_size,
      is_active: space.is_active,
      translations: {}
    };
    
    supportedLanguages.forEach(locale => {
      const trans = space.translations?.find(t => t.locale === locale);
      formData.translations[locale] = {
        name: trans?.name || '',
        description: trans?.description || ''
      };
    });
    
    setEditingSpace(formData);
    setOriginalSpace(formData);
  };

  const handleFieldChange = useCallback((field: keyof SpaceFormData, value: any) => {
    if (!editingSpace) return;
    setEditingSpace(prev => prev ? { ...prev, [field]: value } : null);
  }, [editingSpace]);

  const handleTranslationChange = useCallback((locale: string, field: string, value: string) => {
    if (!editingSpace) return;
    setEditingSpace(prev => prev ? {
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value
        }
      }
    } : null);
  }, [editingSpace]);

  const handleSave = async () => {
    if (!editingSpace) return;
    
    try {
      setSaving(true);
      
      const translations: SpaceTranslation[] = supportedLanguages.map(locale => ({
        locale,
        name: editingSpace.translations[locale]?.name || '',
        description: editingSpace.translations[locale]?.description || ''
      }));
      
      if (editingSpace.id) {
        await cafeSpacesApi.updateSpace(editingSpace.id, {
          code: editingSpace.code,
          capacity: editingSpace.capacity,
          area_size: editingSpace.area_size,
          is_active: editingSpace.is_active,
          translations
        });
        toast.success('Space updated successfully!');
      } else {
        await cafeSpacesApi.createSpace({
          code: editingSpace.code,
          capacity: editingSpace.capacity,
          area_size: editingSpace.area_size,
          is_active: editingSpace.is_active,
          translations
        });
        toast.success('Space created successfully!');
      }
      
      setEditingSpace(null);
      setOriginalSpace(null);
      await loadSpaces(supportedLanguages);
    } catch (error: any) {
      console.error('Failed to save space:', error);
      toast.error(error.response?.data?.detail || 'Failed to save space');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this space?')) return;
    
    try {
      await cafeSpacesApi.deleteSpace(id);
      toast.success('Space deleted successfully!');
      await loadSpaces(supportedLanguages);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to delete space');
    }
  };

  const handleCancel = useCallback(() => {
    setEditingSpace(null);
    setOriginalSpace(null);
  }, []);

  const handleDisplayToggle = async (newValue: boolean) => {
    try {
      setSavingDisplayStatus(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const existingJson = currentSettings.settings_json || {};
      
      await cafeSettingsApi.updateSettings({
        settings_json: {
          ...existingJson,
          spaces_is_displaying: newValue
        }
      });
      
      setIsDisplaying(newValue);
      toast.success(newValue ? 'Spaces section enabled' : 'Spaces section disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update display status');
      setIsDisplaying(!newValue);
    } finally {
      setSavingDisplayStatus(false);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const handleVR360Change = async (field: 'link' | 'title', value: string) => {
    try {
      setSavingVR(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const updates = { ...currentSettings.settings_json };
      
      if (field === 'link') {
        const embedUrl = convertToEmbedUrl(value);
        updates.spaces_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.spaces_vr_title = value;
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
    () => editingSpace?.translations[currentLocale] || { name: '', description: '' },
    [editingSpace, currentLocale]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading spaces...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className={SECTION_CLASS}>
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Spaces Section</h2>
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
            When display is turned off, the "Spaces" section will not appear on the website. You can still edit and manage spaces.
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
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vr360Link}
              onChange={(e) => handleVR360Change('link', e.target.value)}
              disabled={savingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>
                Enter the URL to a 360° panorama image (equirectangular JPG, min 4096x2048px) or YouTube video URL
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Space Management</h1>
          <p className="text-slate-600 mt-1">Manage cafe spaces and areas with multilingual support</p>
        </div>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add New Space
        </button>
      </div>

      {/* Spaces List */}
      {!editingSpace && (
        <div className={SECTION_CLASS}>
          <h2 className="text-xl font-bold text-slate-800 mb-6">All Spaces</h2>
          
          {spaces.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FontAwesomeIcon icon={faCircleInfo} className="text-4xl mb-4" />
              <p>No spaces found. Click "Add New Space" to create one.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {spaces.map((space) => {
                const viTrans = space.translations?.find(t => t.locale === 'vi');
                const enTrans = space.translations?.find(t => t.locale === 'en');
                return (
                  <div key={space.id} className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">
                          {viTrans?.name || enTrans?.name || 'Untitled'}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1">
                          {viTrans?.description || enTrans?.description || 'No description'}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          {space.capacity && <span>Capacity: {space.capacity}</span>}
                          {space.area_size && <span>Area: {space.area_size}</span>}
                          <span className={`px-2 py-1 rounded text-xs ${space.is_active ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                            {space.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(space)}
                          className="px-3 py-1 text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(space.id)}
                          className="px-3 py-1 text-red-600 border border-red-600 rounded-md hover:bg-red-50 transition-colors"
                        >
                          <FontAwesomeIcon icon={faTrash} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit/Create Form */}
      {editingSpace && (
        <>
          {/* Basic Information */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">
              {editingSpace.id ? 'Edit Space' : 'Add New Space'}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={LABEL_CLASS}>Code (unique identifier)</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editingSpace.code}
                  onChange={(e) => handleFieldChange('code', e.target.value)}
                  placeholder="e.g., indoor_area"
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Capacity (people)</label>
                <input
                  type="number"
                  className={INPUT_CLASS}
                  value={editingSpace.capacity || ''}
                  onChange={(e) => handleFieldChange('capacity', parseInt(e.target.value) || undefined)}
                  placeholder="e.g., 50"
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Area Size</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={editingSpace.area_size || ''}
                  onChange={(e) => handleFieldChange('area_size', e.target.value)}
                  placeholder="e.g., 100 m²"
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Status</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={editingSpace.is_active}
                    onChange={(e) => handleFieldChange('is_active', e.target.checked)}
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  <span className="ml-3 text-sm font-medium text-slate-700">
                    {editingSpace.is_active ? 'Active' : 'Inactive'}
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Multilingual Content */}
          <div className={SECTION_CLASS}>
            <h2 className="text-xl font-bold text-slate-800 mb-6">Space Details (Multilingual)</h2>
            
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
                <label className={LABEL_CLASS}>Space Name</label>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={currentTranslation.name}
                  onChange={(e) => handleTranslationChange(currentLocale, 'name', e.target.value)}
                  placeholder="Enter space name in this language..."
                />
              </div>
              
              <div>
                <label className={LABEL_CLASS}>Description</label>
                <textarea
                  rows={4}
                  className={TEXTAREA_CLASS}
                  value={currentTranslation.description}
                  onChange={(e) => handleTranslationChange(currentLocale, 'description', e.target.value)}
                  placeholder="Enter description in this language..."
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

export default CafeSpace;
