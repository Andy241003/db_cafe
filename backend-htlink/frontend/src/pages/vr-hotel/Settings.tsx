import { faImage, faSpinner, faStar, faTrash, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi } from '../../services/mediaApi';
import { vrHotelPropertiesApi, vrHotelSettingsApi, type VRHotelSettings } from '../../services/vrHotelApi';
import { getApiBaseUrl } from '../../utils/api';

const VRHotelSettings: React.FC = () => {
  const [settings, setSettings] = useState({
    primaryColor: '#3b82f6',
    metaTitleVi: '',
    metaDescriptionVi: '',
    keywordsVi: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [propertyInitialized, setPropertyInitialized] = useState(false);
  const [logoMediaId, setLogoMediaId] = useState<number | null>(null);
  const [faviconMediaId, setFaviconMediaId] = useState<number | null>(null);
  const [logoUrl, setLogoUrl] = useState<string>('');
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingFavicon, setUploadingFavicon] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  // Set default property_id if not exists in localStorage
  useEffect(() => {
    const initPropertyId = async () => {
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) {
        try {
          // Fetch properties and select first VR Hotel enabled property
          const property = await vrHotelPropertiesApi.getVRHotelProperty();
          
          if (property) {
            localStorage.setItem('current_property_id', property.id.toString());
            console.log(`🏨 Auto-selected property: ${property.property_name} (ID: ${property.id})`);
          } else {
            toast.error('No properties found. Please contact administrator.');
          }
        } catch (error) {
          console.error('Failed to fetch properties:', error);
          toast.error('Failed to load properties');
        }
      }
      setPropertyInitialized(true);
    };
    
    initPropertyId();
  }, []);
  
  // Load settings after property is initialized
  useEffect(() => {
    if (propertyInitialized) {
      loadSettings();
    }
  }, [propertyInitialized]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const data = await vrHotelSettingsApi.getSettings();
      
      // Map API response to local state
      setSettings({
        primaryColor: data.primary_color || '#3b82f6',
        metaTitleVi: data.seo?.vi?.meta_title || '',
        metaDescriptionVi: data.seo?.vi?.meta_description || '',
        keywordsVi: data.seo?.vi?.meta_keywords || '',
      });
      
      // Set logo and favicon
      if (data.logo_media_id) {
        setLogoMediaId(data.logo_media_id);
        const API_BASE_URL = getApiBaseUrl();
        setLogoUrl(`${API_BASE_URL}/media/${data.logo_media_id}/view`);
      }
      if (data.favicon_media_id) {
        setFaviconMediaId(data.favicon_media_id);
        const API_BASE_URL = getApiBaseUrl();
        setFaviconUrl(`${API_BASE_URL}/media/${data.favicon_media_id}/view`);
      }
    } catch (error: any) {
      console.error('Failed to load settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to load settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    try {
      setUploadingLogo(true);
      
      // Upload to media API
      const uploadedFile = await mediaApi.uploadFile(file, 'image');
      
      setLogoMediaId(uploadedFile.id);
      const API_BASE_URL = getApiBaseUrl();
      setLogoUrl(`${API_BASE_URL}/media/${uploadedFile.id}/view`);
      
      toast.success('Logo uploaded successfully');
      
      // Auto-save logo_media_id
      await vrHotelSettingsApi.updateSettings({ logo_media_id: uploadedFile.id });
    } catch (error: any) {
      console.error('Failed to upload logo:', error);
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  const handleFaviconUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.type.startsWith('image/') && !file.name.endsWith('.ico')) {
      toast.error('Please select an image file or .ico file');
      return;
    }
    
    // Validate file size (max 1MB for favicon)
    if (file.size > 1 * 1024 * 1024) {
      toast.error('Favicon size must be less than 1MB');
      return;
    }
    
    try {
      setUploadingFavicon(true);
      
      // Upload to media API
      const uploadedFile = await mediaApi.uploadFile(file, 'image');
      
      setFaviconMediaId(uploadedFile.id);
      const API_BASE_URL = getApiBaseUrl();
      setFaviconUrl(`${API_BASE_URL}/media/${uploadedFile.id}/view`);
      
      toast.success('Favicon uploaded successfully');
      
      // Auto-save favicon_media_id
      await vrHotelSettingsApi.updateSettings({ favicon_media_id: uploadedFile.id });
    } catch (error: any) {
      console.error('Failed to upload favicon:', error);
      toast.error('Failed to upload favicon');
    } finally {
      setUploadingFavicon(false);
      if (faviconInputRef.current) faviconInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    if (!logoMediaId) return;
    
    try {
      // Update settings to remove logo
      await vrHotelSettingsApi.updateSettings({ logo_media_id: null });
      
      setLogoMediaId(null);
      setLogoUrl('');
      
      toast.success('Logo removed successfully');
    } catch (error: any) {
      console.error('Failed to remove logo:', error);
      toast.error('Failed to remove logo');
    }
  };

  const handleRemoveFavicon = async () => {
    if (!faviconMediaId) return;
    
    try {
      // Update settings to remove favicon
      await vrHotelSettingsApi.updateSettings({ favicon_media_id: null });
      
      setFaviconMediaId(null);
      setFaviconUrl('');
      
      toast.success('Favicon removed successfully');
    } catch (error: any) {
      console.error('Failed to remove favicon:', error);
      toast.error('Failed to remove favicon');
    }
  };

  const handleSaveSettings = async () => {
    try {
      setIsSaving(true);
      
      // Map local state to API format (only VR-specific fields)
      const updateData: Partial<VRHotelSettings> = {
        primary_color: settings.primaryColor,
        logo_media_id: logoMediaId,
        favicon_media_id: faviconMediaId,
        seo: {
          vi: {
            meta_title: settings.metaTitleVi,
            meta_description: settings.metaDescriptionVi,
            meta_keywords: settings.keywordsVi
          }
        }
      };
      
      await vrHotelSettingsApi.updateSettings(updateData);
      toast.success('Settings saved successfully!');
    } catch (error: any) {
      console.error('Failed to save settings:', error);
      toast.error(error.response?.data?.detail || 'Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (confirm('Are you sure you want to restore default settings?')) {
      try {
        setIsSaving(true);
        await vrHotelSettingsApi.restoreDefaults();
        toast.success('Settings restored to defaults');
        await loadSettings(); // Reload to show defaults
      } catch (error: any) {
        console.error('Failed to restore defaults:', error);
        toast.error(error.response?.data?.detail || 'Failed to restore defaults');
      } finally {
        setIsSaving(false);
      }
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo & Branding */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Logo & Branding</h2>
        
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Hotel Logo
            </label>
            <div className="flex items-center gap-4">
              {/* Logo Preview Box */}
              <div className="w-[120px] h-[120px] border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-2" />
                ) : (
                  <FontAwesomeIcon icon={faImage} className="text-4xl text-slate-400" />
                )}
              </div>
              
              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleLogoUpload(e.target.files)}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => logoInputRef.current?.click()}
                    disabled={uploadingLogo}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingLogo ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} />
                        Upload Logo
                      </>
                    )}
                  </button>
                  {logoUrl && (
                    <button
                      onClick={() => handleRemoveLogo()}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Recommended: PNG with transparent background, size 400x400px
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Favicon
            </label>
            <div className="flex items-center gap-4">
              {/* Favicon Preview Box */}
              <div className="w-16 h-16 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center bg-slate-50">
                {faviconUrl ? (
                  <img src={faviconUrl} alt="Favicon" className="w-full h-full object-contain p-1" />
                ) : (
                  <FontAwesomeIcon icon={faStar} className="text-2xl text-slate-400" />
                )}
              </div>
              
              {/* Upload Controls */}
              <div className="flex-1">
                <input
                  ref={faviconInputRef}
                  type="file"
                  accept="image/*,.ico"
                  onChange={(e) => handleFaviconUpload(e.target.files)}
                  className="hidden"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => faviconInputRef.current?.click()}
                    disabled={uploadingFavicon}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {uploadingFavicon ? (
                      <>
                        <FontAwesomeIcon icon={faSpinner} spin />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <FontAwesomeIcon icon={faUpload} />
                        Upload Favicon
                      </>
                    )}
                  </button>
                  {faviconUrl && (
                    <button
                      onClick={() => handleRemoveFavicon()}
                      className="px-4 py-2 border border-red-600 text-red-600 rounded-md hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Remove
                    </button>
                  )}
                </div>
                <p className="text-sm text-slate-500 mt-2">
                  Recommended: ICO or PNG, size 32x32px
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-3">
              Primary Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.primaryColor}
                onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                className="w-[60px] h-10 border border-slate-300 rounded-lg cursor-pointer"
              />
              <input
                type="text"
                value={settings.primaryColor}
                readOnly
                className="w-[120px] px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-700 font-mono text-sm"
              />
              <span className="text-sm text-slate-500">
                This color will be used for buttons, links, highlights
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SEO Settings */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold text-slate-800 mb-6">SEO Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Title
            </label>
            <input
              type="text"
              value={settings.metaTitleVi}
              onChange={(e) => handleInputChange('metaTitleVi', e.target.value)}
              maxLength={60}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {settings.metaTitleVi.length}/60 characters - Displayed on Google search results
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Meta Description
            </label>
            <textarea
              value={settings.metaDescriptionVi}
              onChange={(e) => handleInputChange('metaDescriptionVi', e.target.value)}
              maxLength={160}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-slate-500 mt-1">
              {settings.metaDescriptionVi.length}/160 characters - Short Description about the hotel
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Keywords
            </label>
            <input
              type="text"
              value={settings.keywordsVi}
              onChange={(e) => handleInputChange('keywordsVi', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="keyword1, keyword2,..."
            />
            <p className="text-xs text-slate-500 mt-1">
              Keywords separated by commas
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow p-6">
        <button
          onClick={handleRestoreDefaults}
          disabled={isSaving}
          className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Processing...' : 'Restore Defaults'}
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save All Settings'}
        </button>
      </div>

      {/* Add Language Modal */}
    </div>
  );
};

export default VRHotelSettings;
