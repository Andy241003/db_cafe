import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-hot-toast';
import vrHotelApi from '../../services/vrHotelApi';

interface ContactData {
  isDisplaying: boolean;
  phone?: string;
  email?: string;
  website?: string;
  address?: Record<string, string>;
  socialMedia?: Record<string, string>;
  mapCoordinates?: string;
  workingHours?: Record<string, string>;
  vr360Link?: string;
  vrTitle?: string;
  content?: Record<string, any>;
}

interface Locale {
  id: number;
  locale_code: string;
  is_default: boolean;
  is_active: boolean;
  tenant_id?: number;
  property_id?: number;
}

const VRHotelContact: React.FC = () => {
  const [formData, setFormData] = useState<ContactData>({
    isDisplaying: true,
    phone: '',
    email: '',
    website: '',
    address: {},
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    mapCoordinates: '',
    workingHours: {},
    vr360Link: '',
    vrTitle: '',
    content: {}
  });

  const [originalData, setOriginalData] = useState<ContactData>(formData);
  const [activeLanguage, setActiveLanguage] = useState<string>('vi');
  const [locales, setLocales] = useState<Locale[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const localesResponse = await vrHotelApi.languages.getLanguages();
      const activeLocales = localesResponse.filter((l: Locale) => l.is_active);
      setLocales(activeLocales);

      if (activeLocales.length > 0) {
        const defaultLocale = activeLocales.find((l: Locale) => l.is_default);
        setActiveLanguage(defaultLocale ? defaultLocale.locale_code : activeLocales[0].locale_code);
      }

      const response = await vrHotelApi.contact.getContact();
      
      const address = { ...response.address };
      const workingHours = { ...response.workingHours };
      const content = { ...response.content };
      
      activeLocales.forEach((locale: Locale) => {
        const localeKey = locale.locale_code;
        if (!address[localeKey]) address[localeKey] = '';
        if (!workingHours[localeKey]) workingHours[localeKey] = '';
        if (!content[localeKey]) {
          content[localeKey] = { description: '' };
        }
      });

      const data = {
        ...response,
        address,
        workingHours,
        content
      };

      setFormData(data);
      setOriginalData(data);
    } catch (error) {
      console.error('Error loading contact data:', error);
      toast.error('Failed to load contact data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await vrHotelApi.contact.updateContact(formData);
      setOriginalData(formData);
      toast.success('Contact information saved successfully!');
    } catch (error) {
      console.error('Error saving contact:', error);
      toast.error('Failed to save contact information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    toast.success('Data restored to original state');
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Contact Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${formData.isDisplaying ? 'text-green-600' : 'text-red-600'}`}>
              {formData.isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={formData.isDisplaying}
              onChange={async (e) => {
                const newDisplayingState = e.target.checked;
                setFormData({ ...formData, isDisplaying: newDisplayingState });
                
                try {
                  await vrHotelSettingsApi.updatePageSettings('contact', {
                    is_displaying: newDisplayingState
                  });
                  toast.success(`Display status ${newDisplayingState ? 'enabled' : 'disabled'}!`);
                } catch (error: any) {
                  console.error('Failed to save display status:', error);
                  const errorMsg = error?.response?.data?.detail || 'Failed to save display status';
                  toast.error(errorMsg);
                  setFormData({ ...formData, isDisplaying: !newDisplayingState });
                }
              }}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faCircleInfo} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Contact" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Basic Contact */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="reservations@hotel.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website || ''}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://www.hotel.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* Social Media */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Social Media</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Facebook
                </label>
                <input
                  type="url"
                  value={formData.socialMedia?.facebook || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                  })}
                  placeholder="https://www.facebook.com/yourhotel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Instagram
                </label>
                <input
                  type="url"
                  value={formData.socialMedia?.instagram || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                  })}
                  placeholder="https://www.instagram.com/yourhotel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Twitter/X
                </label>
                <input
                  type="url"
                  value={formData.socialMedia?.twitter || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, twitter: e.target.value }
                  })}
                  placeholder="https://twitter.com/yourhotel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  YouTube
                </label>
                <input
                  type="url"
                  value={formData.socialMedia?.youtube || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    socialMedia: { ...formData.socialMedia, youtube: e.target.value }
                  })}
                  placeholder="https://www.youtube.com/@yourhotel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Multi-language Content */}
          {locales.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex border-b border-gray-200 mb-4">
                {locales.map((locale, index) => (
                  <button
                    key={`address-tab-${locale.locale_code}-${index}`}
                    onClick={() => setActiveLanguage(locale.locale_code)}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeLanguage === locale.locale_code
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {locale.locale_code?.toUpperCase()}
                  </button>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address ({activeLanguage?.toUpperCase() || activeLanguage})
                  </label>
                  <textarea
                    value={formData.address?.[activeLanguage] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      address: { ...formData.address, [activeLanguage]: e.target.value }
                    })}
                    rows={3}
                    placeholder="123 Main Street, New York, NY 10001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                  Working Hours ({activeLanguage?.toUpperCase() || activeLanguage})
                  </label>
                  <textarea
                    value={formData.workingHours?.[activeLanguage] || ''}
                    onChange={(e) => setFormData({
                      ...formData,
                      workingHours: { ...formData.workingHours, [activeLanguage]: e.target.value }
                    })}
                    rows={4}
                    placeholder="Monday - Friday: 08:00 - 22:00&#10;Saturday - Sunday: 09:00 - 23:00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          )}

          {/* VR360 Settings */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="border-b border-gray-200 pb-4 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 576 512">
                <path d="M512 96L64 96C28.7 96 0 124.7 0 160L0 352c0 35.3 28.7 64 64 64l117.5 0c17 0 33.3-6.7 45.3-18.7l33.9-33.9c7.2-7.2 17.1-11.3 27.3-11.3s20.1 4.1 27.3 11.3l33.9 33.9c12 12 28.3 18.7 45.3 18.7L512 416c35.3 0 64-28.7 64-64l0-192c0-35.3-28.7-64-64-64zM80 240a64 64 0 1 1 128 0 64 64 0 1 1 -128 0zm352-64a64 64 0 1 1 0 128 64 64 0 1 1 0-128z"/>
              </svg>
              <h2 className="text-xl font-bold text-gray-800">VR360 Settings</h2>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VR360 Panorama Link
                </label>
                <input
                  type="url"
                  value={formData.vr360Link || ''}
                  onChange={(e) => setFormData({ ...formData, vr360Link: e.target.value })}
                  placeholder="https://example.com/panorama-360.jpg"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-2 text-sm text-gray-500 flex items-start gap-2">
                  <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 512 512">
                    <path d="M256 512a256 256 0 1 0 0-512 256 256 0 1 0 0 512zM224 160a32 32 0 1 1 64 0 32 32 0 1 1 -64 0zm-8 64l48 0c13.3 0 24 10.7 24 24l0 88 8 0c13.3 0 24 10.7 24 24s-10.7 24-24 24l-80 0c-13.3 0-24-10.7-24-24s10.7-24 24-24l24 0 0-64-24 0c-13.3 0-24-10.7-24-24s10.7-24 24-24z"/>
                  </svg>
                  <span>Enter the URL to a 360° panorama image (recommended: equirectangular JPG, minimum 4096x2048px)</span>
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  VR Tour Title
                </label>
                <input
                  type="text"
                  value={formData.vrTitle || ''}
                  onChange={(e) => setFormData({ ...formData, vrTitle: e.target.value })}
                    placeholder="e.g., Grand Lobby, Master Suite, Pool Area"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {formData.vr360Link && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-4 h-4 text-gray-600" fill="currentColor" viewBox="0 0 576 512">
                      <path d="M288 32c-80.8 0-145.5 36.8-192.6 80.6-46.8 43.5-78.1 95.4-93 131.1-3.3 7.9-3.3 16.7 0 24.6 14.9 35.7 46.2 87.7 93 131.1 47.1 43.7 111.8 80.6 192.6 80.6s145.5-36.8 192.6-80.6c46.8-43.5 78.1-95.4 93-131.1 3.3-7.9 3.3-16.7 0-24.6-14.9-35.7-46.2-87.7-93-131.1-47.1-43.7-111.8-80.6-192.6-80.6zM144 256a144 144 0 1 1 288 0 144 144 0 1 1 -288 0zm144-64c0 35.3-28.7 64-64 64-11.5 0-22.3-3-31.7-8.4-1 10.9-.1 22.1 2.9 33.2 13.7 51.2 66.4 81.6 117.6 67.9s81.6-66.4 67.9-117.6c-12.2-45.7-55.5-74.8-101.1-70.8 5.3 9.3 8.4 20.1 8.4 31.7z"/>
                    </svg>
                    <h3 className="text-sm font-medium text-gray-700">VR360 Preview</h3>
                  </div>
                  <div className="border-2 border-gray-300 rounded-lg overflow-hidden bg-gray-50">
                    <div className="relative w-full" style={{ height: '400px' }}>
                      <iframe
                        src={formData.vr360Link}
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
                      onClick={() => window.open(formData.vr360Link, '_blank')}
                      className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors inline-flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 448 512">
                        <path d="M91.2 36.9c-12.4-6.8-27.4-6.5-39.6 .7S32 57.9 32 72l0 368c0 14.1 7.5 27.2 19.6 34.4s27.2 7.5 39.6 .7l336-184c12.8-7 20.8-20.5 20.8-35.1s-8-28.1-20.8-35.1l-336-184z"/>
                      </svg>
                      View Fullscreen
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* VR360 Description - Multi-language */}
          {locales.length > 0 && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">VR360 Description</h2>
              
              <div className="flex border-b border-gray-200 mb-4">
                {locales.map((locale, index) => (
                  <button
                    key={`vr360-desc-tab-${locale.locale_code}-${index}`}
                    onClick={() => setActiveLanguage(locale.locale_code)}
                    className={`px-4 py-2 font-medium text-sm ${
                      activeLanguage === locale.locale_code
                        ? 'border-b-2 border-blue-500 text-blue-600'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {locale.locale_code?.toUpperCase()}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Detailed Description ({activeLanguage?.toUpperCase() || activeLanguage})
                </label>
                <textarea
                  value={formData.content?.[activeLanguage]?.description || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    content: {
                      ...formData.content,
                      [activeLanguage]: {
                        ...formData.content?.[activeLanguage],
                        description: e.target.value
                      }
                    }
                  })}
                  rows={8}
                  placeholder="Enter a detailed description of this VR360 area..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
                <p className="mt-2 text-sm text-gray-500">
                  Detailed description of the area, amenities, and VR360 experience
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3 pt-4 border-t">
        <button
          onClick={handleReset}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Restore
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default VRHotelContact;
