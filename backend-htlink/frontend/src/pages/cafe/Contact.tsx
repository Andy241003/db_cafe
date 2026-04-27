import { faArrowRotateLeft, faCircleInfo, faEye, faFloppyDisk, faPhone, faPlay, faShareNodes, faVrCardboard } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { cafeLanguagesApi, cafeContactApi } from '../../services/restaurantApi';

// CSS Class Constants
const INPUT_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const TEXTAREA_CLASS = 'w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500';
const LABEL_CLASS = 'block text-sm font-medium text-slate-700 mb-2';
const SECTION_CLASS = 'bg-white rounded-lg shadow p-6';

// Language mapping
const LANGUAGE_MAP: { [key: string]: { flag: string; name: string } } = {
  ar: { flag: 'SA', name: 'Arabic' },
  de: { flag: 'DE', name: 'German' },
  en: { flag: 'GB', name: 'English' },
  es: { flag: 'ES', name: 'Spanish' },
  fr: { flag: 'FR', name: 'French' },
  hi: { flag: 'IN', name: 'Hindi' },
  id: { flag: 'ID', name: 'Indonesian' },
  it: { flag: 'IT', name: 'Italian' },
  ja: { flag: 'JP', name: 'Japanese' },
  ko: { flag: 'KR', name: 'Korean' },
  ms: { flag: 'MY', name: 'Malay' },
  pt: { flag: 'PT', name: 'Portuguese' },
  ru: { flag: 'RU', name: 'Russian' },
  ta: { flag: 'IN', name: 'Tamil' },
  th: { flag: 'TH', name: 'Thai' },
  tl: { flag: 'PH', name: 'Filipino' },
  vi: { flag: 'VN', name: 'Vietnamese' },
  yue: { flag: 'HK', name: 'Cantonese' },
  zh: { flag: 'CN', name: 'Chinese (Simplified)' },
  'zh-TW': { flag: 'TW', name: 'Chinese (Traditional)' }
};

interface ContactSettings {
  is_displaying: boolean;
  phone: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  twitter_url: string;
  youtube_url: string;
  vr360_link: string;
  vr_title: string;
  map_coordinates: string;
  settings_json: {
    [locale: string]: {
      address: string;
      working_hours: string;
      description: string;
    };
  };
}

const CafeContact: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);
  const [currentLocale, setCurrentLocale] = useState<string>('vi');
  const [hasChanges, setHasChanges] = useState(false);
  
  const [settings, setSettings] = useState<ContactSettings>({
    is_displaying: true,
    phone: '',
    email: '',
    website: '',
    facebook_url: '',
    instagram_url: '',
    twitter_url: '',
    youtube_url: '',
    vr360_link: '',
    vr_title: '',
    map_coordinates: '',
    settings_json: {
      vi: { address: '', working_hours: '', description: '' },
      en: { address: '', working_hours: '', description: '' }
    }
  });

  const [originalSettings, setOriginalSettings] = useState<ContactSettings>(settings);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);

  useEffect(() => {
    loadLanguagesAndSettings();
  }, []);

  const loadLanguagesAndSettings = async () => {
    try {
      setLoading(true);
      // Load supported languages first
      const languages = await cafeLanguagesApi.getLanguages();
      const langCodes = languages.map(lang => lang.locale);
      setSupportedLanguages(langCodes);
      
      // Set first language as current
      if (langCodes.length > 0) {
        setCurrentLocale(langCodes[0]);
      }
      
      // Then load settings
      await loadSettings(langCodes);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async (langCodes: string[]) => {
    try {
      const data = await cafeContactApi.getContact();
      
      // Get existing address_translations or default to empty object
      const existingTranslations = data.address_translations || {};
      
      // Dynamically create address_translations for all supported languages
      const address_translations: { [locale: string]: { address: string; working_hours: string; description: string } } = {};
      langCodes.forEach(locale => {
        address_translations[locale] = {
          address: existingTranslations[locale]?.address || '',
          working_hours: existingTranslations[locale]?.working_hours || '',
          description: existingTranslations[locale]?.description || ''
        };
      });
      
      const loadedSettings: ContactSettings = {
        is_displaying: data.is_displaying ?? true,
        phone: data.phone || '',
        email: data.email || '',
        website: data.website || '',
        facebook_url: data.facebook_url || '',
        instagram_url: data.instagram_url || '',
        twitter_url: data.twitter_url || '',
        youtube_url: data.youtube_url || '',
        vr360_link: data.vr360_link || '',
        vr_title: data.vr_title || '',
        map_coordinates: data.map_coordinates || '',
        settings_json: address_translations
      };
      
      setSettings(loadedSettings);
      setOriginalSettings(loadedSettings);
      setHasChanges(false);
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to load contact settings');
    }
  };

  const handleInputChange = useCallback((field: keyof ContactSettings, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  const handleDisplayToggle = async (newValue: boolean) => {
    try {
      setSavingDisplayStatus(true);
      
      await cafeContactApi.updateContact({
        is_displaying: newValue
      });
      
      setSettings(prev => ({ ...prev, is_displaying: newValue }));
      setOriginalSettings(prev => ({ ...prev, is_displaying: newValue }));
      toast.success(newValue ? 'Contact section enabled' : 'Contact section disabled');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update display status');
      setSettings(prev => ({ ...prev, is_displaying: !newValue })); // Revert on error
    } finally {
      setSavingDisplayStatus(false);
    }
  };

  const handleLocaleChange = useCallback((locale: string, field: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      settings_json: {
        ...prev.settings_json,
        [locale]: {
          ...prev.settings_json[locale],
          [field]: value
        }
      }
    }));
    setHasChanges(true);
  }, []);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      await cafeContactApi.updateContact({
        is_displaying: settings.is_displaying,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        facebook_url: settings.facebook_url,
        instagram_url: settings.instagram_url,
        twitter_url: settings.twitter_url,
        youtube_url: settings.youtube_url,
        vr360_link: settings.vr360_link,
        vr_title: settings.vr_title,
        map_coordinates: settings.map_coordinates,
        address_translations: settings.settings_json
      });
      
      setOriginalSettings(settings);
      setHasChanges(false);
      toast.success('Contact settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = useCallback(() => {
    setSettings(originalSettings);
    setHasChanges(false);
  }, [originalSettings]);

  // Memoize current locale data to avoid re-renders
  const currentLocaleData = useMemo(
    () => settings.settings_json[currentLocale] || { address: '', working_hours: '', description: '' },
    [settings.settings_json, currentLocale]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading contact settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className={SECTION_CLASS}>
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Contact Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${settings.is_displaying ? 'text-green-600' : 'text-slate-500'}`}>
              {settings.is_displaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.is_displaying}
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
            When display is turned off, the "Contact" section will not appear on the website. You can still edit and save contact information.
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className={SECTION_CLASS}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faPhone} />
          Contact Information
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Phone</label>
            <input
              type="tel"
              placeholder="+84 123 456 789"
              className={INPUT_CLASS}
              value={settings.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>Email</label>
            <input
              type="email"
              placeholder="hello@dbcafe.com"
              className={INPUT_CLASS}
              value={settings.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Website</label>
            <input
              type="url"
              placeholder="https://www.dbcafe.com"
              className={INPUT_CLASS}
              value={settings.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
            />
          </div>
          
          <div className="md:col-span-2">
            <label className={LABEL_CLASS}>Map Coordinates</label>
            <input
              type="text"
              placeholder="e.g., 10.7769,106.7009"
              className={INPUT_CLASS}
              value={settings.map_coordinates}
              onChange={(e) => handleInputChange('map_coordinates', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className={SECTION_CLASS}>
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faShareNodes} />
          Social Media
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={LABEL_CLASS}>Facebook</label>
            <input
              type="url"
              placeholder="https://facebook.com/..."
              className={INPUT_CLASS}
              value={settings.facebook_url}
              onChange={(e) => handleInputChange('facebook_url', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>Instagram</label>
            <input
              type="url"
              placeholder="https://instagram.com/..."
              className={INPUT_CLASS}
              value={settings.instagram_url}
              onChange={(e) => handleInputChange('instagram_url', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>Twitter/X</label>
            <input
              type="url"
              placeholder="https://twitter.com/..."
              className={INPUT_CLASS}
              value={settings.twitter_url}
              onChange={(e) => handleInputChange('twitter_url', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>YouTube</label>
            <input
              type="url"
              placeholder="https://youtube.com/..."
              className={INPUT_CLASS}
              value={settings.youtube_url}
              onChange={(e) => handleInputChange('youtube_url', e.target.value)}
            />
          </div>
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
              placeholder="https://example.com/your-panorama.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.vr360_link}
              onChange={(e) => handleInputChange('vr360_link', e.target.value)}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>
                Enter the URL to a 360° panorama image (recommended: equirectangular JPG, minimum 4096x2048px)
              </span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={settings.vr_title}
              onChange={(e) => handleInputChange('vr_title', e.target.value)}
            />
          </div>
          
          {settings.vr360_link && (
            <div className="relative z-0">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 pointer-events-none relative z-0">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={settings.vr360_link}
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
                  onClick={() => window.open(settings.vr360_link, '_blank')}
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

      {/* Location Details */}
      <div className={SECTION_CLASS}>
        <h2 className="text-xl font-bold text-slate-800 mb-6">Location Details</h2>
        
        {/* Language Tabs */}
        <div className="border-b border-slate-200 mb-6 flex gap-2 flex-wrap">
          {supportedLanguages.map(locale => {
            return (
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
            );
          })}
        </div>
        
        <div className="space-y-4">
          <div>
            <label className={LABEL_CLASS}>Address</label>
            <textarea
              placeholder="Enter address in this language..."
              rows={3}
              className={TEXTAREA_CLASS}
              value={currentLocaleData.address}
              onChange={(e) => handleLocaleChange(currentLocale, 'address', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>Working Hours</label>
            <textarea
              placeholder="Mon-Fri: 9AM - 6PM\nSat-Sun: 10AM - 5PM"
              rows={3}
              className={TEXTAREA_CLASS}
              value={currentLocaleData.working_hours}
              onChange={(e) => handleLocaleChange(currentLocale, 'working_hours', e.target.value)}
            />
          </div>
          
          <div>
            <label className={LABEL_CLASS}>Description</label>
            <textarea
              placeholder="Enter location description in this language..."
              rows={4}
              className={TEXTAREA_CLASS}
              value={currentLocaleData.description}
              onChange={(e) => handleLocaleChange(currentLocale, 'description', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 flex justify-end gap-3">
        <button
          onClick={handleCancel}
          disabled={!hasChanges || saving}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faArrowRotateLeft} />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || saving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faFloppyDisk} className="w-4 h-4" />
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default CafeContact;




