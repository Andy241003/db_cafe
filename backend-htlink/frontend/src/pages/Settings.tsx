import React, { useState, useEffect } from 'react';
import { tenantApi } from '../services/tenantApi';
import { propertiesApi } from '../services/propertiesApi';
import { mediaApi } from '../services/mediaApi';
import { localesApi } from '../services/localesApi';
// import type { TenantSettings } from '../services/tenantApi'; // Will be used later
import type { ApiProperty } from '../types/properties-api';

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
  bannerImages: string[];
  autoLanguageDetection: boolean;
  analyticsTracking: boolean;
  cacheSystem: boolean;
  propertyActive: boolean;
}

// Remove unused AllSettings interface - will be implemented when needed
// interface AllSettings {
//   general: GeneralSettings;
//   branding: BrandingSettings;
//   localization: LocalizationSettings;
//   contact: ContactSettings;
//   advanced: AdvancedSettings;
// }

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
  const [autoSaveTimeout, setAutoSaveTimeout] = useState<number | null>(null);
  
  // Tenant data - will be used for tenant-level settings in future
  // const [tenantData, setTenantData] = useState<TenantSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Properties data
  const [properties, setProperties] = useState<ApiProperty[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [selectedProperty, setSelectedProperty] = useState<ApiProperty | null>(null);
  const [propertiesLoading, setPropertiesLoading] = useState<boolean>(false);

  // Locales data
  const [existingLocales, setExistingLocales] = useState<string[]>([]);

  // File upload states
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);
  const [dragOver, setDragOver] = useState<boolean>(false);

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
    bannerImages: [],
    autoLanguageDetection: true,
    analyticsTracking: true,
    cacheSystem: true,
    propertyActive: true
  });

  // Load languages from database
  const [languages, setLanguages] = useState<Language[]>([]);
  const [isLoadingLanguages, setIsLoadingLanguages] = useState(true);

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
    setAutoSaveTimeout(timeout as any);
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
  const handleLanguageToggle = async (languageCode: string) => {
    const isCurrentlySelected = localizationSettings.supportedLanguages.includes(languageCode);

    if (isCurrentlySelected) {
      // Remove language from supported list
      const newSupportedLanguages = localizationSettings.supportedLanguages.filter(lang => lang !== languageCode);
      setLocalizationSettings(prev => ({
        ...prev,
        supportedLanguages: newSupportedLanguages
      }));
    } else {
      // Add language to supported list
      // First, check if locale exists in database, if not create it
      try {
        const language = languages.find(lang => lang.code === languageCode);
        if (!language) {
          console.error('Language not found:', languageCode);
          return;
        }

        // Try to get the locale from database
        try {
          await localesApi.getLocale(languageCode);
          console.log(`✅ Locale ${languageCode} already exists`);
        } catch (error: any) {
          // If locale doesn't exist (404), create it
          if (error.response?.status === 404) {
            console.log(`📝 Creating new locale: ${languageCode}`);
            await localesApi.createLocale({
              code: languageCode,
              name: language.name,
              native_name: language.native
            });
            console.log(`✅ Locale ${languageCode} created successfully`);
            showSuccess(`Language ${language.name} added to system`);

            // Reload existing locales to update UI
            await loadExistingLocales();
          } else {
            throw error;
          }
        }

        // Add to supported languages
        const newSupportedLanguages = [...localizationSettings.supportedLanguages, languageCode];
        setLocalizationSettings(prev => ({
          ...prev,
          supportedLanguages: newSupportedLanguages
        }));

      } catch (error) {
        console.error('Error adding language:', error);
        showSuccess('Failed to add language. Please try again.');
      }
    }
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

  // Save individual sections
  const saveGeneralSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        property_name: generalSettings.propertyName,
        code: generalSettings.propertyCode,
        slogan: generalSettings.propertySlogan,
        description: generalSettings.propertyDescription,
      };
      
      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('General settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving general settings:', error);
      showSuccess('Failed to save general settings. Please try again.');
    }
  };

  const saveBrandingSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        primary_color: brandingSettings.primaryColor,
        secondary_color: brandingSettings.secondaryColor,
        logo_url: brandingSettings.logoUrl,
        settings_json: {
          ...selectedProperty.settings_json,
          branding: brandingSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Branding settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving branding settings:', error);
      showSuccess('Failed to save branding settings. Please try again.');
    }
  };

  const saveContactSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        address: contactSettings.address,
        phone_number: contactSettings.phoneNumber,
        email: contactSettings.emailAddress,
        website_url: contactSettings.websiteUrl,
        district: contactSettings.district,
        city: contactSettings.city,
        country: contactSettings.country,
        postal_code: contactSettings.postalCode,
        latitude: contactSettings.latitude ? parseFloat(contactSettings.latitude) : undefined,
        longitude: contactSettings.longitude ? parseFloat(contactSettings.longitude) : undefined,
        google_map_url: contactSettings.googleMapUrl,
        zalo_oa_id: contactSettings.zaloOaId,
        settings_json: {
          ...selectedProperty.settings_json,
          contact: contactSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Contact settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving contact settings:', error);
      showSuccess('Failed to save contact settings. Please try again.');
    }
  };

  const saveLocalizationSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        default_locale: localizationSettings.defaultLanguage,
        settings_json: {
          ...selectedProperty.settings_json,
          localization: localizationSettings
        }
      };
      
      console.log('💾 [Settings] Saving localization settings:', localizationSettings);
      console.log('💾 [Settings] Supported languages:', localizationSettings.supportedLanguages);
      
      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Localization settings saved successfully!');
      await loadProperties();
      
      // Save to localStorage for CategoryModal to use
      const settingsToSave = {
        defaultLanguage: localizationSettings.defaultLanguage,
        fallbackLanguage: localizationSettings.fallbackLanguage,
        supportedLanguages: localizationSettings.supportedLanguages,
        timezone: localizationSettings.timezone,
        dateFormat: localizationSettings.dateFormat
      };
      localStorage.setItem('property_settings', JSON.stringify(settingsToSave));
      console.log('💾 [Settings] Updated localStorage after save:', settingsToSave);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new CustomEvent('property-settings-updated', {
        detail: settingsToSave
      }));
      console.log('✅ [Settings] Property changed event dispatched');
    } catch (error) {
      console.error('Error saving localization settings:', error);
      showSuccess('Failed to save localization settings. Please try again.');
    }
  };

  const saveAdvancedSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        is_active: advancedSettings.propertyActive,
        intro_video_url: advancedSettings.introVideoUrl,
        vr360_url: advancedSettings.vr360Url,
        banner_images: advancedSettings.bannerImages,
        settings_json: {
          ...selectedProperty.settings_json,
          advanced: {
            autoLanguageDetection: advancedSettings.autoLanguageDetection,
            analyticsTracking: advancedSettings.analyticsTracking,
            cacheSystem: advancedSettings.cacheSystem
          }
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Advanced settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving advanced settings:', error);
      showSuccess('Failed to save advanced settings. Please try again.');
    }
  };

  // Save Legal & Footer settings
  const saveLegalSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        copyright_text: brandingSettings.copyrightText,
        terms_url: brandingSettings.termsUrl,
        privacy_url: brandingSettings.privacyUrl,
        settings_json: {
          ...selectedProperty.settings_json,
          branding: brandingSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Legal settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving legal settings:', error);
      showSuccess('Failed to save legal settings. Please try again.');
    }
  };

  // Save Regional settings
  const saveRegionalSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        settings_json: {
          ...selectedProperty.settings_json,
          localization: localizationSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Regional settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving regional settings:', error);
      showSuccess('Failed to save regional settings. Please try again.');
    }
  };

  // Save Location settings
  const saveLocationSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        district: contactSettings.district,
        city: contactSettings.city,
        country: contactSettings.country,
        postal_code: contactSettings.postalCode,
        latitude: contactSettings.latitude ? parseFloat(contactSettings.latitude) : undefined,
        longitude: contactSettings.longitude ? parseFloat(contactSettings.longitude) : undefined,
        google_map_url: contactSettings.googleMapUrl,
        settings_json: {
          ...selectedProperty.settings_json,
          contact: contactSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Location settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving location settings:', error);
      showSuccess('Failed to save location settings. Please try again.');
    }
  };

  // Save Social Media settings
  const saveSocialSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        facebook_url: contactSettings.facebookUrl,
        instagram_url: contactSettings.instagramUrl,
        youtube_url: contactSettings.youtubeUrl,
        tiktok_url: contactSettings.tiktokUrl,
        zalo_oa_id: contactSettings.zaloOaId,
        settings_json: {
          ...selectedProperty.settings_json,
          contact: contactSettings
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('Social media settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving social media settings:', error);
      showSuccess('Failed to save social media settings. Please try again.');
    }
  };

  // Save System settings
  const saveSystemSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      const propertyUpdateData = {
        is_active: advancedSettings.propertyActive,
        settings_json: {
          ...selectedProperty.settings_json,
          advanced: {
            autoLanguageDetection: advancedSettings.autoLanguageDetection,
            analyticsTracking: advancedSettings.analyticsTracking,
            cacheSystem: advancedSettings.cacheSystem
          }
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('System settings saved successfully!');
      await loadProperties();
    } catch (error) {
      console.error('Error saving system settings:', error);
      showSuccess('Failed to save system settings. Please try again.');
    }
  };

  // Save all settings
  const saveAllSettings = async () => {
    if (!selectedProperty || !selectedPropertyId) {
      showSuccess('Please select a property first.');
      return;
    }

    try {
      // Update property data with current form values - save to property fields
      const propertyUpdateData = {
        // General settings
        property_name: generalSettings.propertyName,
        code: generalSettings.propertyCode,
        slogan: generalSettings.propertySlogan,
        description: generalSettings.propertyDescription,

        // Contact settings - save to property fields
        address: contactSettings.address,
        phone_number: contactSettings.phoneNumber,
        email: contactSettings.emailAddress,
        website_url: contactSettings.websiteUrl,
        district: contactSettings.district,
        city: contactSettings.city,
        country: contactSettings.country,
        postal_code: contactSettings.postalCode,
        latitude: contactSettings.latitude ? parseFloat(contactSettings.latitude) : undefined,
        longitude: contactSettings.longitude ? parseFloat(contactSettings.longitude) : undefined,
        google_map_url: contactSettings.googleMapUrl,
        zalo_oa_id: contactSettings.zaloOaId,
        facebook_url: contactSettings.facebookUrl,
        instagram_url: contactSettings.instagramUrl,
        youtube_url: contactSettings.youtubeUrl,
        tiktok_url: contactSettings.tiktokUrl,

        // Localization settings
        default_locale: localizationSettings.defaultLanguage,

        // Advanced settings - save to property fields
        is_active: advancedSettings.propertyActive,
        intro_video_url: advancedSettings.introVideoUrl,
        vr360_url: advancedSettings.vr360Url,
        banner_images: advancedSettings.bannerImages,

        // Legal & Footer - save to property fields
        copyright_text: brandingSettings.copyrightText,
        terms_url: brandingSettings.termsUrl,
        privacy_url: brandingSettings.privacyUrl,

        // Branding colors - save to property fields
        primary_color: brandingSettings.primaryColor,
        secondary_color: brandingSettings.secondaryColor,
        logo_url: brandingSettings.logoUrl,

        // Store remaining settings in settings_json
        settings_json: {
          ...selectedProperty.settings_json,
          branding: {
            primaryColor: brandingSettings.primaryColor,
            secondaryColor: brandingSettings.secondaryColor,
            logoUrl: brandingSettings.logoUrl
          },
          localization: {
            defaultLanguage: localizationSettings.defaultLanguage,
            fallbackLanguage: localizationSettings.fallbackLanguage,
            supportedLanguages: localizationSettings.supportedLanguages,
            dateFormat: localizationSettings.dateFormat,
            timezone: localizationSettings.timezone
          },
          advanced: {
            autoLanguageDetection: advancedSettings.autoLanguageDetection,
            analyticsTracking: advancedSettings.analyticsTracking,
            cacheSystem: advancedSettings.cacheSystem
          }
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      showSuccess('All settings saved successfully!');

      // Reload properties to get updated info
      await loadProperties();

    } catch (error) {
      console.error('Error saving property settings:', error);
      showSuccess('Failed to save property settings. Please try again.');
    }
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
            bannerImages: [],
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

  // Load existing locales from database
  const loadExistingLocales = async () => {
    try {
      const locales = await localesApi.getLocales();
      const localeCodes = locales.map(locale => locale.code);
      setExistingLocales(localeCodes);
      console.log('📋 Existing locales:', localeCodes);
    } catch (error) {
      console.error('Error loading locales:', error);
    }
  };

  // Load properties for tenant
  const loadProperties = async () => {
    try {
      setPropertiesLoading(true);
      const propertiesData = await propertiesApi.getProperties();
      setProperties(propertiesData);

      // Auto-select first property if available (or load from localStorage)
      const savedPropertyId = localStorage.getItem('selected_property_id');
      
      if (savedPropertyId) {
        // Load saved property
        const propertyId = parseInt(savedPropertyId);
        const property = propertiesData.find(p => p.id === propertyId);
        if (property) {
          setSelectedPropertyId(propertyId);
          setSelectedProperty(property);
          updateFormWithPropertyData(property);
          console.log('✅ [Settings] Loaded saved property from localStorage:', propertyId);
        }
      } else if (propertiesData.length > 0) {
        // Auto-select first property and save to localStorage
        const firstProperty = propertiesData[0];
        setSelectedPropertyId(firstProperty.id);
        setSelectedProperty(firstProperty);
        localStorage.setItem('selected_property_id', firstProperty.id.toString());
        updateFormWithPropertyData(firstProperty);
        console.log('✅ [Settings] Auto-selected first property and saved:', firstProperty.id);
      }
    } catch (error) {
      console.error('Error loading properties:', error);
    } finally {
      setPropertiesLoading(false);
    }
  };

  // Update form data based on selected property
  const updateFormWithPropertyData = (property: ApiProperty) => {
    console.log('🔄 Updating all form data with property:', property);
    console.log('📋 Property settings_json:', (property as any).settings_json);
    
    // Update General Settings
    setGeneralSettings(prev => ({
      ...prev,
      propertyName: property.property_name,
      propertyCode: property.code,
      propertySlogan: property.slogan || '',
      propertyDescription: property.description || ''
    }));
    
    // Update Branding Settings - Read from property fields directly
    setBrandingSettings(prev => ({
      ...prev,
      primaryColor: property.primary_color || '#3b82f6',
      secondaryColor: property.secondary_color || '#64748b',
      logoUrl: property.logo_url || '',
      copyrightText: property.copyright_text || '',
      termsUrl: property.terms_url || '',
      privacyUrl: property.privacy_url || ''
    }));
    
    // Update Contact Settings - Read from property fields directly
    setContactSettings(prev => ({
      ...prev,
      address: property.address || '',
      district: property.district || '',
      city: property.city || '',
      country: property.country || '',
      postalCode: property.postal_code || '',
      latitude: property.latitude?.toString() || '',
      longitude: property.longitude?.toString() || '',
      googleMapUrl: property.google_map_url || '',
      phoneNumber: property.phone_number || '',
      emailAddress: property.email || '',
      websiteUrl: property.website_url || '',
      zaloOaId: property.zalo_oa_id || '',
      facebookUrl: property.facebook_url || '',
      instagramUrl: property.instagram_url || '',
      youtubeUrl: property.youtube_url || '',
      tiktokUrl: property.tiktok_url || ''
    }));
    
    // Update Localization Settings
    const localizationData = (property as any).settings_json?.localization || {};
    const finalLocalizationSettings = {
      defaultLanguage: property.default_locale || 'en',
      fallbackLanguage: localizationData.fallbackLanguage || 'en',
      supportedLanguages: localizationData.supportedLanguages || ['en', 'vi'],
      timezone: localizationData.timezone || 'Asia/Ho_Chi_Minh',
      dateFormat: localizationData.dateFormat || 'DD/MM/YYYY'
    };
    
    setLocalizationSettings(prev => ({
      ...prev,
      ...finalLocalizationSettings
    }));
    
    // Save to localStorage for CategoryModal to use
    localStorage.setItem('property_settings', JSON.stringify(finalLocalizationSettings));
    console.log('💾 [Settings] Saved settings to localStorage:', finalLocalizationSettings);
    
    // Update Advanced Settings - Read from property fields directly
    const advancedData = (property as any).settings_json?.advanced || {};
    const bannerImagesFromProperty = property.banner_images || [];
    
    console.log('🖼️ [Settings] Loading banner images:', {
      from_property_field: bannerImagesFromProperty,
      from_settings_json: advancedData.bannerImages,
      count: bannerImagesFromProperty.length
    });
    
    setAdvancedSettings(prev => ({
      ...prev,
      propertyActive: property.is_active,
      introVideoUrl: property.intro_video_url || '',
      vr360Url: property.vr360_url || '',
      bannerImages: bannerImagesFromProperty,
      autoLanguageDetection: advancedData.autoLanguageDetection ?? true,
      analyticsTracking: advancedData.analyticsTracking ?? true,
      cacheSystem: advancedData.cacheSystem ?? true
    }));
    
    console.log('✅ All settings updated with property data');
  };

  // Handle property selection change
  const handlePropertyChange = async (propertyId: number) => {
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedPropertyId(propertyId);
      setSelectedProperty(property);
      
      // Save to localStorage for other components to use
      localStorage.setItem('selected_property_id', propertyId.toString());
      console.log('✅ [Settings] Property selected and saved to localStorage:', propertyId);
      
      updateFormWithPropertyData(property);
      
      // Dispatch event to notify other components
      window.dispatchEvent(new Event('propertyChanged'));
    }
  };

  // Helper function to save banner images immediately
  const saveAdvancedSettingsWithBanners = async (bannerImages: string[]) => {
    if (!selectedProperty || !selectedPropertyId) {
      console.error('❌ No property selected');
      return;
    }

    try {
      console.log('💾 Auto-saving banner images:', bannerImages);
      const propertyUpdateData = {
        banner_images: bannerImages,
        settings_json: {
          ...selectedProperty.settings_json,
          advanced: {
            ...selectedProperty.settings_json?.advanced,
            bannerImages: bannerImages
          }
        }
      };

      await propertiesApi.updateProperty(selectedPropertyId, propertyUpdateData);
      console.log('✅ Banner images saved to database');
      
      // Update selected property to reflect changes
      await loadProperties();
    } catch (error) {
      console.error('❌ Error auto-saving banner images:', error);
    }
  };

  // File upload functions
  const handleFileUpload = async (files: FileList) => {
    setUploadingBanner(true);
    const validFiles: File[] = [];

    // Validate files first
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showSuccess(`${file.name} is not an image file`);
        continue;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showSuccess(`${file.name} is too large (max 5MB)`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) {
      setUploadingBanner(false);
      return;
    }

    try {
      console.log('🔄 Uploading files:', validFiles.map(f => f.name));
      
      // Check user permissions
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('👤 Current user:', currentUser);
      console.log('👤 Current user role:', currentUser.role);
      console.log('👤 Role type:', typeof currentUser.role);
      console.log('🔑 Access token:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
      console.log('🏢 Tenant info:', {
        tenant_code: localStorage.getItem('tenant_code'),
        tenant_id: localStorage.getItem('tenant_id')
      });
      
      if (!currentUser.role || !['OWNER', 'ADMIN', 'EDITOR'].includes(currentUser.role.toUpperCase())) {
        throw new Error('You need Editor, Admin, or Owner permissions to upload files.');
      }
      
      // Upload files using real API
      const uploadResults = await mediaApi.uploadFiles(validFiles, 'image');
      console.log('✅ Upload results:', uploadResults);
      
      // Extract URLs from upload results
      const newUrls = uploadResults.map(result => {
        // Use the correct endpoint path for serving files
        const url = result.url || `http://localhost:8000/api/v1/media/${result.file_key}`;
        console.log('📄 Generated URL:', url, 'from file_key:', result.file_key);
        return url;
      });
      
      // Update banner images array
      setAdvancedSettings(prev => ({
        ...prev,
        bannerImages: [...prev.bannerImages, ...newUrls]
      }));

      showSuccess(`${newUrls.length} image(s) uploaded successfully!`);
      console.log('✅ Updated banner images:', [...advancedSettings.bannerImages, ...newUrls]);
      
      // Auto-save banner images to database immediately
      const updatedBannerImages = [...advancedSettings.bannerImages, ...newUrls];
      await saveAdvancedSettingsWithBanners(updatedBannerImages);
      
    } catch (error: any) {
      const token = localStorage.getItem('access_token');
      const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
      console.log('🔍 Debug info:', {
        userRole: currentUser?.role,
        token: token?.substring(0, 30) + '...',
        fullToken: token,
        tenantCode: localStorage.getItem('tenantCode'),
        tenant_code: localStorage.getItem('tenant_code'),
        tenant_domain: localStorage.getItem('tenant_domain'),
        allLocalStorage: Object.keys(localStorage).reduce((acc, key) => {
          acc[key] = localStorage.getItem(key)?.substring(0, 50);
          return acc;
        }, {} as Record<string, string | undefined>)
      });
      console.error('❌ Upload error:', error);
      console.error('❌ Error response:', error.response?.data);
      console.error('❌ Error status:', error.response?.status);
      console.error('❌ Error details:', JSON.stringify(error.response?.data, null, 2));
      
      let errorMessage = 'Failed to upload images. ';
      if (error.response?.status === 403) {
        errorMessage += 'You need Editor, Admin, or Owner permissions.';
      } else if (error.response?.status === 422) {
        errorMessage += 'Invalid file format or data.';
      } else if (error.response?.data?.detail) {
        errorMessage += error.response.data.detail;
      } else if (error.message) {
        errorMessage += error.message;
      } else {
        errorMessage += 'Please try again.';
      }
      
      showSuccess(errorMessage);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const removeBannerImage = async (index: number) => {
    const updatedBannerImages = advancedSettings.bannerImages.filter((_, i) => i !== index);
    
    setAdvancedSettings(prev => ({
      ...prev,
      bannerImages: updatedBannerImages
    }));
    
    // Auto-save after removing banner
    await saveAdvancedSettingsWithBanners(updatedBannerImages);
    showSuccess('Banner image removed successfully!');
  };

  // Load languages from database
  useEffect(() => {
    const loadLanguages = async () => {
      try {
        setIsLoadingLanguages(true);
        const locales = await localesApi.getLocales();

        // Map locales to Language format with flags
        const languageMap: { [key: string]: string } = {
          'en': '🇬🇧', 'en-US': '🇺🇸', 'en-AU': '🇦🇺', 'en-CA': '🇨🇦',
          'vi': '🇻🇳',
          'ja': '🇯🇵',
          'ko': '🇰🇷',
          'zh': '🇨🇳', 'zh-CN': '🇨🇳', 'zh-TW': '🇹🇼',
          'th': '🇹🇭',
          'ms': '🇲🇾',
          'id': '🇮🇩',
          'tl': '🇵🇭',
          'yue': '🇭🇰',
          'fr': '🇫🇷', 'fr-CA': '🇨🇦',
          'de': '🇩🇪',
          'ru': '🇷🇺',
          'es': '🇪🇸',
          'it': '🇮🇹',
          'pt-BR': '🇧🇷',
          'hi': '🇮🇳',
          'ar': '🇸🇦',
          'ta': '🇮🇳'
        };

        const mappedLanguages: Language[] = locales.map(locale => ({
          code: locale.code,
          name: locale.name,
          native: locale.native_name || locale.name,
          flag: languageMap[locale.code] || '🌐'
        }));

        setLanguages(mappedLanguages);
        console.log('✅ Loaded', mappedLanguages.length, 'languages from database');
      } catch (error) {
        console.error('Failed to load languages:', error);
        // Fallback to basic languages
        setLanguages([
          { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
          { code: 'vi', name: 'Vietnamese', native: 'Tiếng Việt', flag: '🇻🇳' },
          { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
          { code: 'ko', name: 'Korean', native: '한국어', flag: '🇰🇷' }
        ]);
      } finally {
        setIsLoadingLanguages(false);
      }
    };

    loadLanguages();
  }, []);

  // Load tenant data on component mount
  useEffect(() => {
    const loadTenantData = async () => {
      try {
        setLoading(true);
        const response = await tenantApi.getCurrentTenant();
        const tenant = response.data;
        // setTenantData(tenant); // Will store tenant data when needed
        console.log('Tenant loaded:', tenant.name);

        // Load existing locales
        await loadExistingLocales();

        // Load properties after tenant data is loaded
        await loadProperties();

      } catch (error) {
        console.error('Error loading tenant data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTenantData();
  }, []);

  // Listen for auth state changes to reload data when tenant switches
  useEffect(() => {
    const loadTenantData = async () => {
      try {
        setLoading(true);
        
        // Check if user is authenticated and has tenant info
        const token = localStorage.getItem('access_token');
        const isAuth = localStorage.getItem('isAuthenticated') === 'true';
        const tenantCode = localStorage.getItem('tenant_code');
        
        if (!token || !isAuth || !tenantCode) {
          console.log('User not authenticated or no tenant info');
          return;
        }

        const response = await tenantApi.getCurrentTenant();
        const tenant = response.data;
        console.log('Tenant reloaded:', tenant.name);
        
        // Update localStorage with fresh tenant data
        if (tenant.code !== tenantCode) {
          localStorage.setItem('tenant_code', tenant.code);
          localStorage.setItem('tenant_name', tenant.name || tenant.code);
        }
        
        // Reload properties for the new tenant
        await loadProperties();
        
      } catch (error) {
        console.error('Error reloading tenant data:', error);
      } finally {
        setLoading(false);
      }
    };

    const handleAuthChange = () => {
      console.log('Auth state changed in Settings, reloading data...');
      loadTenantData();
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tenant_code' || e.key === 'tenant_id') {
        console.log('Tenant changed in localStorage, reloading data...');
        loadTenantData();
      }
    };

    // Periodic check to sync banner images from server
    const bannerSyncInterval = setInterval(() => {
      if (selectedPropertyId && properties.length > 0) {
        const currentProperty = properties.find(p => p.id === selectedPropertyId);
        if (currentProperty && currentProperty.banner_images) {
          const serverBanners = currentProperty.banner_images || [];
          const localBanners = advancedSettings.bannerImages || [];
          
          // Check if banners are out of sync
          if (JSON.stringify(serverBanners) !== JSON.stringify(localBanners)) {
            console.log('🔄 [Settings] Banner sync detected difference:', {
              server: serverBanners,
              local: localBanners,
              syncing: true
            });
            setAdvancedSettings(prev => ({
              ...prev,
              bannerImages: serverBanners
            }));
          }
        }
      }
    }, 30000); // Check every 30 seconds

    window.addEventListener('authStateChanged', handleAuthChange);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('authStateChanged', handleAuthChange);
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(bannerSyncInterval);
    };
  }, [selectedPropertyId, properties, advancedSettings.bannerImages]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
      }
    };
  }, [autoSaveTimeout]);

  // Show loading state
  if (loading) {
    return (
      <div className="text-slate-800 bg-slate-50 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

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
              onClick={() => window.location.reload()}
              disabled={loading}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <i className="fas fa-sync-alt"></i>
              )}
              Refresh
            </button>
            <a
              href="/tenant-settings"
              className="rounded-lg bg-slate-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-slate-700 flex items-center gap-2"
            >
              <i className="fas fa-cog"></i>
              Tenant Settings
            </a>
            <button 
              className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700 flex items-center gap-2"
              onClick={saveAllSettings}
            >
              <i className="fas fa-save"></i>
              Save All
            </button>
          </div>
        </div>

        {/* Property Selector */}
        <div className="mb-6 bg-white rounded-lg border border-slate-200 p-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <i className="fas fa-building text-blue-600"></i>
              <label htmlFor="property-select" className="text-sm font-medium text-slate-700">
                Select Property:
              </label>
            </div>
            <div className="flex-1 max-w-md">
              {propertiesLoading ? (
                <div className="flex items-center gap-2 text-slate-500">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading properties...
                </div>
              ) : (
                <select
                  id="property-select"
                  value={selectedPropertyId || ''}
                  onChange={(e) => handlePropertyChange(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select a property to configure</option>
                  {properties.map(property => (
                    <option key={property.id} value={property.id}>
                      {property.property_name} ({property.code})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {selectedProperty && (
              <div className="text-sm text-slate-600">
                <span className="font-medium">Status:</span>
                <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                  selectedProperty.is_active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {selectedProperty.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Show settings only when a property is selected */}
        {selectedProperty ? (
          <>
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveGeneralSettings}>Save</button>
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveBrandingSettings}>Save</button>
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveLegalSettings}>Save</button>
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
                  disabled={isLoadingLanguages}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.native} ({lang.name})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Primary language for your property content
                </p>
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
                  disabled={isLoadingLanguages}
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.native} ({lang.name})
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-xs text-slate-500">
                  Language to use when content is not available in the requested language
                </p>
              </div>

              <div className="mb-5">
                <label className="mb-2 block text-sm font-medium text-slate-700">
                  Supported Languages
                  {!isLoadingLanguages && (
                    <span className="ml-2 text-xs font-normal text-slate-500">
                      ({languages.length} available)
                    </span>
                  )}
                </label>
                <p className="mb-3 text-xs text-slate-500">
                  Select languages to support. Only selected languages will appear in translation modals.
                </p>

                {isLoadingLanguages ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
                      <p className="mt-3 text-sm text-slate-500">Loading languages...</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
                    {languages.map((language) => {
                    const isSelected = localizationSettings.supportedLanguages.includes(language.code);
                    const isInDatabase = existingLocales.includes(language.code);
                    const isNew = !isInDatabase;

                    return (
                      <div
                        key={language.code}
                        className={`flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-all ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}
                        onClick={() => handleLanguageToggle(language.code)}
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <div className="flex h-5 w-6 items-center justify-center rounded-sm bg-slate-200 text-xs">{language.flag}</div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="text-sm font-medium text-slate-900">{language.name}</h4>
                              {isNew && !isSelected && (
                                <span className="px-1.5 py-0.5 text-[10px] font-medium bg-green-100 text-green-700 rounded">
                                  NEW
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-slate-500">{language.native}</div>
                          </div>
                        </div>
                        <div className={`flex h-4 w-4 items-center justify-center rounded-sm border-2 transition-all ${isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300 text-transparent'}`}>
                          <i className="fas fa-check text-xs"></i>
                        </div>
                      </div>
                    );
                  })}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 border-t border-slate-200 pt-5 mt-6">
                <button className="rounded-lg border border-slate-200 bg-slate-50 px-5 py-2.5 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100" onClick={() => resetSettings('localization')}>Reset</button>
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveLocalizationSettings}>Save</button>
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveRegionalSettings}>Save</button>
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveLocationSettings}>Save</button>
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
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveContactSettings}>Save</button>
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
                  <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveSocialSettings}>Save</button>
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
                <label className="mb-2 block text-sm font-medium text-slate-700">Banner Images</label>
                
                {/* File Upload Area */}
                <div
                  className={`relative rounded-lg border-2 border-dashed p-6 text-center transition-colors ${
                    dragOver
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-300 bg-slate-50 hover:border-slate-400'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                >
                  <div className="flex flex-col items-center gap-2">
                    <div className={`rounded-full p-3 ${dragOver ? 'bg-blue-100' : 'bg-slate-100'}`}>
                      {uploadingBanner ? (
                        <i className="fas fa-spinner fa-spin text-2xl text-blue-600"></i>
                      ) : (
                        <i className={`fas fa-cloud-upload-alt text-2xl ${dragOver ? 'text-blue-600' : 'text-slate-400'}`}></i>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-700">
                        {uploadingBanner ? 'Uploading images...' : 'Drop images here or click to browse'}
                      </p>
                      <p className="text-xs text-slate-500">
                        Supports: JPG, PNG, GIF (max 5MB each)
                      </p>
                    </div>
                  </div>
                  
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleFileUpload(e.target.files);
                      }
                    }}
                    disabled={uploadingBanner}
                  />
                </div>

                {/* Image Preview Grid */}
                {advancedSettings.bannerImages.length > 0 && (
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-slate-700">
                        Banner Images ({advancedSettings.bannerImages.length})
                      </p>
                      <button
                        onClick={() => {
                          if (window.confirm('Are you sure you want to remove all banner images?')) {
                            setAdvancedSettings(prev => ({ ...prev, bannerImages: [] }));
                          }
                        }}
                        className="text-xs text-red-600 hover:text-red-800 px-2 py-1 rounded border border-red-200 hover:bg-red-50"
                      >
                        <i className="fas fa-trash mr-1"></i>
                        Clear All
                      </button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {advancedSettings.bannerImages.map((imageUrl, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-video rounded-lg overflow-hidden bg-slate-100 border border-slate-200 hover:border-slate-300 transition-colors">
                            <img
                              src={imageUrl}
                              alt={`Banner ${index + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                              onError={(e) => {
                                // Show placeholder if image fails to load
                                e.currentTarget.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjEyMCIgdmlld0JveD0iMCAwIDIwMCAxMjAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTIwIiBmaWxsPSIjRjFGNUY5Ii8+CjxwYXRoIGQ9Ik04MCA2MEw5MCA0NUwxMTAgNjVMMTMwIDQwTDE0MCA1NUwxNjAgNDBWODBIMDBWNjBIODBaIiBmaWxsPSIjQ0JEOEU4Ii8+CjxjaXJjbGUgY3g9IjcwIiBjeT0iNDAiIHI9IjEwIiBmaWxsPSIjOTA5OUE2Ii8+Cjx0ZXh0IHg9IjEwMCIgeT0iNzAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9IiM2QjczODAiIGZvbnQtc2l6ZT0iMTIiPkltYWdlPC90ZXh0Pgo8L3N2Zz4K';
                              }}
                            />
                          </div>
                          <button
                            onClick={() => removeBannerImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs hover:bg-red-600"
                          >
                            <i className="fas fa-times"></i>
                          </button>
                          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            {imageUrl.split('/').pop()?.substring(0, 20)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
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
                  onClick={saveAdvancedSettings}
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
                <button className="rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700" onClick={saveSystemSettings}>Save</button>
              </div>
            </div>
          </div>
        )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
                <i className="fas fa-building text-2xl text-slate-400"></i>
              </div>
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-2">No Property Selected</h3>
                <p className="text-slate-500 max-w-md">
                  Please select a property from the dropdown above to configure its settings.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Settings;

