import {
  faCircleInfo,
  faEye,
  faMapPin,
  faPhone,
  faPlay,
  faSave,
  faShareNodes,
  faUndo,
  faVrCardboard,
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelContactApi, type ContactData } from '../../services/vrHotelApi';

interface ContactContent {
  description?: string;
}

const VRHotelContact: React.FC = () => {
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [currentLang, setCurrentLang] = useState<string>('vi');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<ContactData>({
    isDisplaying: true,
    phone: '',
    email: '',
    website: '',
    mapCoordinates: '',
    vr360Link: '',
    vrTitle: '',
    address: {},
    socialMedia: {
      facebook: '',
      instagram: '',
      twitter: '',
      youtube: ''
    },
    workingHours: {},
    content: {}
  });

  const [originalData, setOriginalData] = useState<ContactData>(formData);

  const socialMediaPlatforms = [
    { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
    { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
    { key: 'twitter', label: 'Twitter/X', placeholder: 'https://twitter.com/...' },
    { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/...' }
  ];

  useEffect(() => {
    loadLocalesAndContact();
  }, []);

  const loadLocalesAndContact = async () => {
    setIsLoading(true);
    try {
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) {
        toast.error('No property selected');
        return;
      }

      // Load available locales
      const locales = await propertyLocalesApi.getLocales(parseInt(propertyId));
      const activeLocales = locales.filter(l => l.is_active);
      setAvailableLocales(activeLocales);

      const defaultLocale = activeLocales.find(l => l.is_default);
      if (defaultLocale) {
        setCurrentLang(defaultLocale.locale_code);
      } else if (activeLocales.length > 0) {
        setCurrentLang(activeLocales[0].locale_code);
      }

      // Load contact data
      const response = await vrHotelContactApi.getContact();
      
      // Initialize content for all locales
      const content: Record<string, ContactContent> = response.content || {};
      const address: Record<string, string> = response.address || {};
      const workingHours: Record<string, string> = response.workingHours || {};
      
      activeLocales.forEach(locale => {
        if (!content[locale.locale_code]) {
          content[locale.locale_code] = { description: '' };
        }
        if (!address[locale.locale_code]) {
          address[locale.locale_code] = '';
        }
        if (!workingHours[locale.locale_code]) {
          workingHours[locale.locale_code] = '';
        }
      });

      const data: ContactData = {
        isDisplaying: response.isDisplaying ?? true,
        phone: response.phone || '',
        email: response.email || '',
        website: response.website || '',
        mapCoordinates: response.mapCoordinates || '',
        vr360Link: response.vr360Link || '',
        vrTitle: response.vrTitle || '',
        socialMedia: response.socialMedia || {
          facebook: '',
          instagram: '',
          twitter: '',
          youtube: ''
        },
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
    if (!formData.phone && !formData.email && !formData.website) {
      toast.error('Please enter at least one contact method');
      return;
    }

    setIsSaving(true);
    try {
      await vrHotelContactApi.updateContact(formData);

      setOriginalData(formData);
      toast.success('Contact information saved successfully!');
    } catch (error: any) {
      console.error('Error saving contact:', error);
      toast.error(error.response?.data?.detail || 'Failed to save contact information');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(originalData);
    toast.success('Changes discarded');
  };

  const handleInputChange = (field: keyof ContactData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      socialMedia: {
        ...prev.socialMedia,
        [platform]: value
      }
    }));
  };

  const handleAddressChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [currentLang]: value
      }
    }));
  };

  const handleWorkingHoursChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [currentLang]: value
      }
    }));
  };

  const handleContentChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      content: {
        ...prev.content,
        [currentLang]: { description: value }
      }
    }));
  };

  const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading contact information...</div>
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
                  const updatedData = { ...formData, isDisplaying: newDisplayingState };
                  setFormData(updatedData);
                  
                  try {
                    await vrHotelContactApi.updateContact(updatedData);
                    setOriginalData(updatedData);
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
            When display is turned off, the "Contact" section will not appear on the website. You can still edit and save contact information.
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faPhone} />
          Contact Information
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Phone
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => handleInputChange('phone', e.target.value)}
              placeholder="+84 123 456 789"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="info@hotel.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Website
            </label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => handleInputChange('website', e.target.value)}
              placeholder="https://www.hotel.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
              <FontAwesomeIcon icon={faMapPin} className="text-slate-500" />
              Map Coordinates
            </label>
            <input
              type="text"
              value={formData.mapCoordinates}
              onChange={(e) => handleInputChange('mapCoordinates', e.target.value)}
              placeholder="e.g., 10.7769,106.7009"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">Format: latitude,longitude</p>
          </div>
        </div>
      </div>

      {/* Social Media */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
          <FontAwesomeIcon icon={faShareNodes} />
          Social Media
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {socialMediaPlatforms.map(platform => (
            <div key={platform.key}>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                {platform.label}
              </label>
              <input
                type="url"
                value={(formData.socialMedia as any)?.[platform.key] || ''}
                onChange={(e) => handleSocialMediaChange(platform.key, e.target.value)}
                placeholder={platform.placeholder}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          ))}
        </div>
      </div>

      {/* VR360 Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Link VR360 Panorama
            </label>
            <input
              type="url"
              value={formData.vr360Link}
              onChange={(e) => handleInputChange('vr360Link', e.target.value)}
              placeholder="https://example.com/your-panorama.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>
                Enter the URL to a 360° panorama image (recommended: equirectangular JPG, minimum 4096x2048px)
              </span>
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              VR Tour Title
            </label>
            <input
              type="text"
              value={formData.vrTitle}
              onChange={(e) => handleInputChange('vrTitle', e.target.value)}
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {formData.vr360Link && (
            <div className="relative z-0">
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50 pointer-events-none relative z-0">
                <div className="relative w-full" style={{ height: '500px' }}>
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

      {/* Multi-Language Content */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Location Details</h2>

        {/* Language Tabs */}
        <div className="border-b border-slate-200 mb-6 flex gap-2">
          {availableLocales.map(locale => (
            <button
              key={locale.locale_code}
              onClick={() => setCurrentLang(locale.locale_code)}
              className={`px-4 py-2 font-medium transition-colors border-b-2 ${
                currentLang === locale.locale_code
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              {locale.locale_name} ({locale.locale_code.toUpperCase()})
            </button>
          ))}
        </div>

        {/* Content for Current Language */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Address
            </label>
            <textarea
              value={formData.address?.[currentLang] || ''}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Enter address in this language..."
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Working Hours
            </label>
            <textarea
              value={formData.workingHours?.[currentLang] || ''}
              onChange={(e) => handleWorkingHoursChange(e.target.value)}
              placeholder="e.g., Mon-Fri: 9AM - 6PM&#10;Sat-Sun: 10AM - 5PM"
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.content?.[currentLang]?.description || ''}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="Enter location description in this language..."
              rows={4}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="bg-white rounded-lg shadow p-6 flex justify-end gap-3">
        <button
          onClick={handleReset}
          disabled={!hasChanges}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faUndo} />
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faSave} />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export default VRHotelContact;
