import React, { useState, useEffect } from 'react';

// Interfaces for type safety
interface GeneralSettings {
  propertyName: string;
  propertyCode: string;
  propertySlogan: string;
  propertyDescription: string;
}

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  copyrightText: string;
  termsUrl: string;
  privacyUrl: string;
}

interface LocalizationSettings {
  defaultLanguage: string;
  fallbackLanguage: string;
  supportedLanguages: string[];
  timezone: string;
  dateFormat: string;
}

interface ContactSettings {
  address: string;
  district: string;
  city: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
  googleMapUrl: string;
  phoneNumber: string;
  emailAddress: string;
  websiteUrl: string;
  zaloOaId: string;
  facebookUrl: string;
  instagramUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
}

interface AdvancedSettings {
  introVideoUrl: string;
  vr360Url: string;
  bannerImages: string;
  autoLanguageDetection: boolean;
  analyticsTracking: boolean;
  cacheSystem: boolean;
  propertyActive: boolean;
}

interface AllSettings {
  general: GeneralSettings;
  branding: BrandingSettings;
  localization: LocalizationSettings;
  contact: ContactSettings;
  advanced: AdvancedSettings;
}

interface Language {
  code: string;
  name: string;
  native: string;
  flag: string;
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('general');
  const [successMessage, setSuccessMessage] = useState<string>('');
  const [showSuccessMessage, setShowSuccessMessage] = useState<boolean>(false);
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<NodeJS.Timeout | null>(null);

  // Form states
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    propertyName: 'Tabi Tower Hotel',
    propertyCode: 'tabi-tower',
    propertySlogan: '',
    propertyDescription: ''
  });

  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    primaryColor: '#3b82f6',
    secondaryColor: '#64748b',
    logoUrl: '',
    copyrightText: '',
    termsUrl: '',
    privacyUrl: ''
  });

  const [localizationSettings, setLocalizationSettings] = useState<LocalizationSettings>({
    defaultLanguage: 'en',
    fallbackLanguage: 'en',
    supportedLanguages: ['en', 'vi'],
    timezone: 'Asia/Tokyo',
    dateFormat: 'YYYY-MM-DD'
  });

  const [contactSettings, setContactSettings] = useState<ContactSettings>({
    address: '3-1-6 Mita, Minato, Tokyo 108-0068',
    district: 'Minato',
    city: 'Tokyo',
    country: 'Japan',
    postalCode: '108-0068',
    latitude: '',
    longitude: '',
    googleMapUrl: '',
    phoneNumber: '',
    emailAddress: '',
    websiteUrl: '',
    zaloOaId: '',
    facebookUrl: '',
    instagramUrl: '',
    youtubeUrl: '',
    tiktokUrl: ''
  });

  const [advancedSettings, setAdvancedSettings] = useState<AdvancedSettings>({
    introVideoUrl: '',
    vr360Url: '',
    bannerImages: '',
    autoLanguageDetection: true,
    analyticsTracking: true,
    cacheSystem: true,
    propertyActive: true
  });

  const languages: Language[] = [
    { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
    { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' },
    { code: 'zh', name: 'Chinese (Simplified)', native: '简体中文', flag: '🇨🇳' },
    { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' }
  ];

  const tabs = [
    { id: 'general', icon: 'fas fa-cog', text: 'General' },
    { id: 'branding', icon: 'fas fa-palette', text: 'Branding' },
    { id: 'localization', icon: 'fas fa-globe', text: 'Localization' },
    { id: 'contact', icon: 'fas fa-address-card', text: 'Contact Info' },
    { id: 'advanced', icon: 'fas fa-sliders-h', text: 'Advanced' }
  ];

  const timezoneOptions = [
    { value: 'Asia/Tokyo', label: 'Asia/Tokyo (GMT+9)' },
    { value: 'Asia/Ho_Chi_Minh', label: 'Asia/Ho Chi Minh (GMT+7)' },
    { value: 'Asia/Seoul', label: 'Asia/Seoul (GMT+9)' },
    { value: 'Asia/Shanghai', label: 'Asia/Shanghai (GMT+8)' },
    { value: 'UTC', label: 'UTC (GMT+0)' },
    { value: 'America/New_York', label: 'America/New York (GMT-5)' },
    { value: 'Europe/London', label: 'Europe/London (GMT+0)' }
  ];

  const dateFormatOptions = [
    { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD (2024-03-15)' },
    { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY (15/03/2024)' },
    { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY (03/15/2024)' },
    { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY (15-03-2024)' }
  ];

  // Auto-save functionality
  const handleAutoSave = (field: string, value: any) => {
    if (autoSaveTimeout) {
      clearTimeout(autoSaveTimeout);
    }
    const timeout = setTimeout(() => {
      console.log('Auto-saving...', field, value);
    }, 2000);
    setAutoSaveTimeout(timeout);
  };

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
    setTimeout(() => {
      setShowSuccessMessage(false);
    }, 3000);
  };

  // Handle language selection
  const handleLanguageToggle = (languageCode: string) => {
    const newSupportedLanguages = localizationSettings.supportedLanguages.includes(languageCode)
      ? localizationSettings.supportedLanguages.filter(lang => lang !== languageCode)
      : [...localizationSettings.supportedLanguages, languageCode];
    
    setLocalizationSettings(prev => ({
      ...prev,
      supportedLanguages: newSupportedLanguages
    }));
  };

  // Handle color changes
  const handleColorChange = (colorType: 'primary' | 'secondary', color: string) => {
    setBrandingSettings(prev => ({
      ...prev,
      [colorType === 'primary' ? 'primaryColor' : 'secondaryColor']: color
    }));
  };

  // Handle toggle switches
  const handleToggle = (setting: keyof AdvancedSettings) => {
    setAdvancedSettings(prev => ({
      ...prev,
      [setting]: !prev[setting]
    }));
  };

  // Save all settings
  const saveAllSettings = () => {
    const allSettings: AllSettings = {
      general: generalSettings,
      branding: brandingSettings,
      localization: localizationSettings,
      contact: contactSettings,
      advanced: advancedSettings
    };
    
    console.log('All settings:', allSettings);
    showSuccess('All settings saved successfully!');
    // In real implementation, send data to server
  };

  // Reset settings
  const resetSettings = (section: string) => {
    if (window.confirm('Are you sure you want to reset these settings?')) {
      switch (section) {
        case 'general':
          setGeneralSettings({
            propertyName: 'Tabi Tower Hotel',
            propertyCode: 'tabi-tower',
            propertySlogan: '',
            propertyDescription: ''
          });
          break;
        case 'branding':
          setBrandingSettings({
            primaryColor: '#3b82f6',
            secondaryColor: '#64748b',
            logoUrl: '',
            copyrightText: '',
            termsUrl: '',
            privacyUrl: ''
          });
          break;
        case 'localization':
          setLocalizationSettings({
            defaultLanguage: 'en',
            fallbackLanguage: 'en',
            supportedLanguages: ['en', 'vi'],
            timezone: 'Asia/Tokyo',
            dateFormat: 'YYYY-MM-DD'
          });
          break;
        case 'contact':
          setContactSettings({
            address: '3-1-6 Mita, Minato, Tokyo 108-0068',
            district: 'Minato',
            city: 'Tokyo',
            country: 'Japan',
            postalCode: '108-0068',
            latitude: '',
            longitude: '',
            googleMapUrl: '',
            phoneNumber: '',
            emailAddress: '',
            websiteUrl: '',
            zaloOaId: '',
            facebookUrl: '',
            instagramUrl: '',
            youtubeUrl: '',
            tiktokUrl: ''
          });
          break;
        case 'advanced':
          setAdvancedSettings({
            introVideoUrl: '',
            vr360Url: '',
            bannerImages: '',
            autoLanguageDetection: true,
            analyticsTracking: true,
            cacheSystem: true,
            propertyActive: true
          });
          break;
      }
      showSuccess('Settings reset to default values.');
    }
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  return (
    <div className="text-slate-800 bg-slate-50 min-h-screen">
      {/* Success Message */}
      {showSuccessMessage && (
        <div className="fixed top-5 right-5 z-[1000] flex items-center gap-2 rounded-lg border border-green-200 bg-green-100 p-3 text-green-800">
          <i className="fas fa-check-circle"></i>
          {successMessage}
        </div>
      )}

      {/* Main Content */}
      <main className="p-6">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Property Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Configure your hotel property settings and preferences</p>
          </div>
          <div className="flex gap-3">
            <button 
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 flex items-center gap-2"
              onClick={saveAllSettings}
            >
              <i className="fas fa-save"></i>
              Save All
            </button>
          </div>
        </div>
        
        {/* Settings Tabs */}
        <div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              className={`flex-shrink-0 rounded-lg px-5 py-3 text-sm font-medium transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={`${tab.icon} mr-2`}></i>
              {tab.text}
            </button>
          ))}
        </div>

        {/* General Settings */}
        {activeTab === 'general' && (
          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white">
                    <i className="fas fa-hotel"></i>
                  </div>
                  Basic Information
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure basic property information and display settings.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Property Name</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  value={generalSettings.propertyName}
                  onChange={(e) => {
                    setGeneralSettings(prev => ({ ...prev, propertyName: e.target.value }));
                    handleAutoSave('propertyName', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Property Code</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  value={generalSettings.propertyCode}
                  onChange={(e) => {
                    setGeneralSettings(prev => ({ ...prev, propertyCode: e.target.value }));
                    handleAutoSave('propertyCode', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Slogan</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="Your hotel's tagline"
                  value={generalSettings.propertySlogan}
                  onChange={(e) => {
                    setGeneralSettings(prev => ({ ...prev, propertySlogan: e.target.value }));
                    handleAutoSave('propertySlogan', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Description</label>
                <textarea 
                  className="w-full min-h-[100px] resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="Brief description of your property"
                  value={generalSettings.propertyDescription}
                  onChange={(e) => {
                    setGeneralSettings(prev => ({ ...prev, propertyDescription: e.target.value }));
                    handleAutoSave('propertyDescription', e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('general')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('General settings saved!')}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Branding Settings */}
        {activeTab === 'branding' && (
          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 text-white">
                    <i className="fas fa-palette"></i>
                  </div>
                  Brand Colors
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Customize your brand colors that will be used throughout your property pages.
              </p>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Primary Color</label>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input 
                      type="color" 
                      className="h-6 w-6 cursor-pointer rounded border-none"
                      value={brandingSettings.primaryColor}
                      onChange={(e) => handleColorChange('primary', e.target.value)}
                    />
                    <div className="flex-1 font-mono text-xs text-slate-500">{brandingSettings.primaryColor}</div>
                  </div>
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Secondary Color</label>
                  <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-white px-3 py-2">
                    <input 
                      type="color" 
                      className="h-6 w-6 cursor-pointer rounded border-none"
                      value={brandingSettings.secondaryColor}
                      onChange={(e) => handleColorChange('secondary', e.target.value)}
                    />
                    <div className="flex-1 font-mono text-xs text-slate-500">{brandingSettings.secondaryColor}</div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Logo URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://example.com/logo.png"
                  value={brandingSettings.logoUrl}
                  onChange={(e) => {
                    setBrandingSettings(prev => ({ ...prev, logoUrl: e.target.value }));
                    handleAutoSave('logoUrl', e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('branding')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Brand settings saved!')}>Save</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <i className="fas fa-copyright"></i>
                  </div>
                  Legal & Footer
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure copyright text and legal links for your property pages.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Copyright Text</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="© 2024 Your Hotel Name"
                  value={brandingSettings.copyrightText}
                  onChange={(e) => {
                    setBrandingSettings(prev => ({ ...prev, copyrightText: e.target.value }));
                    handleAutoSave('copyrightText', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Terms & Conditions URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://example.com/terms"
                  value={brandingSettings.termsUrl}
                  onChange={(e) => {
                    setBrandingSettings(prev => ({ ...prev, termsUrl: e.target.value }));
                    handleAutoSave('termsUrl', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Privacy Policy URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://example.com/privacy"
                  value={brandingSettings.privacyUrl}
                  onChange={(e) => {
                    setBrandingSettings(prev => ({ ...prev, privacyUrl: e.target.value }));
                    handleAutoSave('privacyUrl', e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('branding')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Legal settings saved!')}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Localization Settings */}
        {activeTab === 'localization' && (
          <div className="grid gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <i className="fas fa-globe"></i>
                  </div>
                  Language Settings
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure supported languages for your property. Select languages you want to provide content in.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Default Language</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={localizationSettings.defaultLanguage}
                  onChange={(e) => {
                    setLocalizationSettings(prev => ({ ...prev, defaultLanguage: e.target.value }));
                    handleAutoSave('defaultLanguage', e.target.value);
                  }}
                >
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Fallback Language</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={localizationSettings.fallbackLanguage}
                  onChange={(e) => {
                    setLocalizationSettings(prev => ({ ...prev, fallbackLanguage: e.target.value }));
                    handleAutoSave('fallbackLanguage', e.target.value);
                  }}
                >
                  <option value="en">English</option>
                  <option value="vi">Tiếng Việt</option>
                  <option value="ja">日本語</option>
                  <option value="ko">한국어</option>
                </select>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Supported Languages</label>
                <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                  {languages.map((language) => (
                    <div 
                      key={language.code}
                      className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${localizationSettings.supportedLanguages.includes(language.code) ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}
                      onClick={() => handleLanguageToggle(language.code)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-5 w-6 items-center justify-center rounded-sm bg-slate-200 text-xs">{language.flag}</div>
                        <div>
                          <h4 className="text-sm font-medium text-slate-900">{language.name}</h4>
                          <div className="text-xs text-slate-500">{language.native}</div>
                        </div>
                      </div>
                      <div className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 transition-all ${localizationSettings.supportedLanguages.includes(language.code) ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-transparent'}`}>
                        <i className="fas fa-check text-xs"></i>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('localization')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Language settings saved!')}>Save</button>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-red-500 to-red-600 text-white">
                    <i className="fas fa-clock"></i>
                  </div>
                  Regional Settings
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure timezone and regional display preferences for your property.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Timezone</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={localizationSettings.timezone}
                  onChange={(e) => {
                    setLocalizationSettings(prev => ({ ...prev, timezone: e.target.value }));
                    handleAutoSave('timezone', e.target.value);
                  }}
                >
                  {timezoneOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Date Format</label>
                <select 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm"
                  value={localizationSettings.dateFormat}
                  onChange={(e) => {
                    setLocalizationSettings(prev => ({ ...prev, dateFormat: e.target.value }));
                    handleAutoSave('dateFormat', e.target.value);
                  }}
                >
                  {dateFormatOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('localization')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Regional settings saved!')}>Save</button>
              </div>
            </div>
          </div>
        )}

        {/* Contact Info Settings */}
        {activeTab === 'contact' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-cyan-500 to-cyan-600 text-white">
                    <i className="fas fa-map-marker-alt"></i>
                  </div>
                  Address & Location
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure your property's physical address and location information.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Street Address</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={contactSettings.address}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, address: e.target.value }));
                    handleAutoSave('address', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">District</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={contactSettings.district}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, district: e.target.value }));
                    handleAutoSave('district', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">City</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={contactSettings.city}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, city: e.target.value }));
                    handleAutoSave('city', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Country</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={contactSettings.country}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, country: e.target.value }));
                    handleAutoSave('country', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Postal Code</label>
                <input 
                  type="text" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  value={contactSettings.postalCode}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, postalCode: e.target.value }));
                    handleAutoSave('postalCode', e.target.value);
                  }}
                />
              </div>

              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Latitude</label>
                  <input 
                    type="number" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="35.6532" 
                    step="0.0001"
                    value={contactSettings.latitude}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, latitude: e.target.value }));
                      handleAutoSave('latitude', e.target.value);
                    }}
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Longitude</label>
                  <input 
                    type="number" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="139.7390" 
                    step="0.0001"
                    value={contactSettings.longitude}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, longitude: e.target.value }));
                      handleAutoSave('longitude', e.target.value);
                    }}
                  />
                </div>
              </div>

              <div className="mt-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Google Maps URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://maps.google.com/..."
                  value={contactSettings.googleMapUrl}
                  onChange={(e) => {
                    setContactSettings(prev => ({ ...prev, googleMapUrl: e.target.value }));
                    handleAutoSave('googleMapUrl', e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('contact')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Location settings saved!')}>Save</button>
              </div>
            </div>

            <div className="flex flex-col gap-6">
              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-lime-500 to-lime-600 text-white">
                      <i className="fas fa-phone"></i>
                    </div>
                    Contact Details
                  </div>
                </div>
                <p className="mb-5 text-sm text-slate-500">
                  Configure contact information and communication channels.
                </p>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Phone Number</label>
                  <input 
                    type="tel" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="+81-3-1234-5678"
                    value={contactSettings.phoneNumber}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, phoneNumber: e.target.value }));
                      handleAutoSave('phoneNumber', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Email Address</label>
                  <input 
                    type="email" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="info@tabitower.com"
                    value={contactSettings.emailAddress}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, emailAddress: e.target.value }));
                      handleAutoSave('emailAddress', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Official Website</label>
                  <input 
                    type="url" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="https://tabitower.com"
                    value={contactSettings.websiteUrl}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, websiteUrl: e.target.value }));
                      handleAutoSave('websiteUrl', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Zalo OA ID</label>
                  <input 
                    type="text" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="zalo_oa_id"
                    value={contactSettings.zaloOaId}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, zaloOaId: e.target.value }));
                      handleAutoSave('zaloOaId', e.target.value);
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                  <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('contact')}>Reset</button>
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Contact settings saved!')}>Save</button>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-pink-500 to-pink-600 text-white">
                      <i className="fas fa-share-alt"></i>
                    </div>
                    Social Media
                  </div>
                </div>
                <p className="mb-5 text-sm text-slate-500">
                  Configure your social media presence and links.
                </p>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Facebook URL</label>
                  <input 
                    type="url" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="https://facebook.com/tabitower"
                    value={contactSettings.facebookUrl}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, facebookUrl: e.target.value }));
                      handleAutoSave('facebookUrl', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Instagram URL</label>
                  <input 
                    type="url" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="https://instagram.com/tabitower"
                    value={contactSettings.instagramUrl}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, instagramUrl: e.target.value }));
                      handleAutoSave('instagramUrl', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">YouTube URL</label>
                  <input 
                    type="url" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="https://youtube.com/c/tabitower"
                    value={contactSettings.youtubeUrl}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, youtubeUrl: e.target.value }));
                      handleAutoSave('youtubeUrl', e.target.value);
                    }}
                  />
                </div>

                <div className="mb-5">
                  <label className="mb-2 block text-sm font-medium text-slate-700">TikTok URL</label>
                  <input 
                    type="url" 
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                    placeholder="https://tiktok.com/@tabitower"
                    value={contactSettings.tiktokUrl}
                    onChange={(e) => {
                      setContactSettings(prev => ({ ...prev, tiktokUrl: e.target.value }));
                      handleAutoSave('tiktokUrl', e.target.value);
                    }}
                  />
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                  <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('contact')}>Reset</button>
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('Social media settings saved!')}>Save</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Advanced Settings */}
        {activeTab === 'advanced' && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white">
                    <i className="fas fa-code"></i>
                  </div>
                  Advanced Features
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure advanced features and integrations for your property.
              </p>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Intro Video URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://youtube.com/watch?v=..."
                  value={advancedSettings.introVideoUrl}
                  onChange={(e) => {
                    setAdvancedSettings(prev => ({ ...prev, introVideoUrl: e.target.value }));
                    handleAutoSave('introVideoUrl', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">360° Virtual Tour URL</label>
                <input 
                  type="url" 
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder="https://example.com/360tour"
                  value={advancedSettings.vr360Url}
                  onChange={(e) => {
                    setAdvancedSettings(prev => ({ ...prev, vr360Url: e.target.value }));
                    handleAutoSave('vr360Url', e.target.value);
                  }}
                />
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">Banner Images (JSON)</label>
                <textarea 
                  className="w-full min-h-[100px] resize-y rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20" 
                  placeholder='["image1.jpg", "image2.jpg"]'
                  value={advancedSettings.bannerImages}
                  onChange={(e) => {
                    setAdvancedSettings(prev => ({ ...prev, bannerImages: e.target.value }));
                    handleAutoSave('bannerImages', e.target.value);
                  }}
                />
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button 
                  className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" 
                  onClick={() => resetSettings('advanced')}
                >
                  Reset
                </button>
                <button 
                  className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" 
                  onClick={() => showSuccess('Advanced settings saved!')}
                >
                  Save
                </button>
              </div>
            </div>

            {/* Feature Toggles */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-lg font-semibold text-slate-900">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-gray-500 to-gray-600 text-white">
                    <i className="fas fa-database"></i>
                  </div>
                  System Settings
                </div>
              </div>
              <p className="mb-5 text-sm text-slate-500">
                Configure system-level settings and preferences.
              </p>

              <div className="space-y-4">
                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900 mb-1 leading-snug">Auto Language Detection</h4>
                    <p className="text-xs text-slate-500 leading-snug">Automatically detect visitor's preferred language</p>
                  </div>
                  <div 
                    className={`relative inline-block w-12 h-7 rounded-full cursor-pointer transition-colors ${advancedSettings.autoLanguageDetection ? 'bg-blue-600' : 'bg-slate-200'}`}
                    onClick={() => handleToggle('autoLanguageDetection')}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${advancedSettings.autoLanguageDetection ? 'transform translate-x-5' : ''}`}></span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900 mb-1 leading-snug">Analytics Tracking</h4>
                    <p className="text-xs text-slate-500 leading-snug">Enable visitor analytics and tracking</p>
                  </div>
                  <div 
                    className={`relative inline-block w-12 h-7 rounded-full cursor-pointer transition-colors ${advancedSettings.analyticsTracking ? 'bg-blue-600' : 'bg-slate-200'}`}
                    onClick={() => handleToggle('analyticsTracking')}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${advancedSettings.analyticsTracking ? 'transform translate-x-5' : ''}`}></span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900 mb-1 leading-snug">Cache System</h4>
                    <p className="text-xs text-slate-500 leading-snug">Enable content caching for better performance</p>
                  </div>
                  <div 
                    className={`relative inline-block w-12 h-7 rounded-full cursor-pointer transition-colors ${advancedSettings.cacheSystem ? 'bg-blue-600' : 'bg-slate-200'}`}
                    onClick={() => handleToggle('cacheSystem')}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${advancedSettings.cacheSystem ? 'transform translate-x-5' : ''}`}></span>
                  </div>
                </div>

                <div className="flex items-start justify-between gap-4 py-1">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-slate-900 mb-1 leading-snug">Property Active</h4>
                    <p className="text-xs text-slate-500 leading-snug">Enable/disable this property entirely</p>
                  </div>
                  <div 
                    className={`relative inline-block w-12 h-7 rounded-full cursor-pointer transition-colors ${advancedSettings.propertyActive ? 'bg-blue-600' : 'bg-slate-200'}`}
                    onClick={() => handleToggle('propertyActive')}
                  >
                    <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full transition-transform shadow-sm ${advancedSettings.propertyActive ? 'transform translate-x-5' : ''}`}></span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('advanced')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={() => showSuccess('System settings saved!')}>Save</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;

