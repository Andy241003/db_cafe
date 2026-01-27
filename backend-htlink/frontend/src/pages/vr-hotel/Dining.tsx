import {
    faEdit,
    faEye,
    faFlag,
    faImages,
    faInfoCircle,
    faLink,
    faPlay,
    faPlus,
    faSave,
    faTimes,
    faTrash,
    faUtensils,
    faVrCardboard
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi } from '../../services/mediaApi';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelDiningApi, vrHotelSettingsApi } from '../../services/vrHotelApi';

// Helper function to convert YouTube URL to embed format
const getEmbedUrl = (url: string): string => {
  if (!url) return url;
  
  // Check if it's a YouTube URL
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = url.match(youtubeRegex);
  
  if (match && match[1]) {
    // Convert to embed format
    return `https://www.youtube.com/embed/${match[1]}`;
  }
  
  // Return original URL if not YouTube (VR360 panorama or other)
  return url;
};

// TODO: Import when API is ready
// import { vrHotelDiningApi, type Dining, type DiningCreate, type DiningTranslation, type DiningUpdate } from '../../services/vrHotelApi';

// Temporary types until API is ready
interface DiningTranslation {
  locale: string;
  name: string;
  description?: string;
}

interface Dining {
  id: number;
  tenant_id: number;
  property_id: number;
  code: string;
  dining_type?: string;
  vr_link?: string;
  status: string;
  display_order: number;
  translations: Record<string, { name: string; description: string }>;
  media?: Array<{ media_id: number; is_primary: boolean }>;
  created_at: string;
  updated_at?: string;
}

interface DiningCreate {
  code: string;
  dining_type: string;
  vr_link?: string;
  translations: DiningTranslation[];
  media: Array<{ media_id: number; is_primary: boolean; sort_order: number }>;
}

interface DiningUpdate extends DiningCreate {}

const VRHotelDining: React.FC = () => {
  const [dinings, setDinings] = useState<Dining[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('vi');
  const [editingDining, setEditingDining] = useState<Dining | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [diningVR360Link, setDiningVR360Link] = useState('');
  const [diningVRTitle, setDiningVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);
  const [diningTypeFilter, setDiningTypeFilter] = useState<string>('all');
  
  const [formData, setFormData] = useState<{
    code: string;
    dining_type: string;
    vr_link: string;
    booking_url: string;
    translations: Record<string, { name: string; description: string }>;
    images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }>;
  }>({
    code: '',
    dining_type: 'restaurant',
    vr_link: '',
    booking_url: '',
    translations: {},
    images: []
  });

  const diningTypes = [
    { value: 'restaurant', label: 'Restaurant' },
    { value: 'bar', label: 'Bar' },
    { value: 'cafe', label: 'Café' },
    { value: 'lounge', label: 'Lounge' }
  ];

  // Load dinings and locales on mount
  useEffect(() => {
    loadLocalesAndDinings();
  }, []);

  const loadLocalesAndDinings = async () => {
    setIsLoading(true);
    try {
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) {
        toast.error('No property selected');
        return;
      }

      // Load available locales for this property
      const locales = await propertyLocalesApi.getLocales(parseInt(propertyId));
      const activeLocales = locales.filter(l => l.is_active);
      setAvailableLocales(activeLocales);
      
      // Set default active language
      const defaultLocale = activeLocales.find(l => l.is_default);
      if (defaultLocale) {
        setCurrentLang(defaultLocale.locale_code);
      } else if (activeLocales.length > 0) {
        setCurrentLang(activeLocales[0].locale_code);
      }

      // Load dinings from API
      await loadDinings();
      
      // Load VR page settings from database
      const vrSettings = await vrHotelSettingsApi.getPageSettings('dining');
      if (vrSettings) {
        setDiningVR360Link(vrSettings.vr360_link || '');
        setDiningVRTitle(vrSettings.vr_title || '');
        setIsDisplaying(vrSettings.is_displaying !== false);
      }
    } catch (error) {
      console.error('Error loading locales and dinings:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDinings = async () => {
    try {
      const data = await vrHotelDiningApi.getDinings();
      setDinings(data);
    } catch (error) {
      console.error('Failed to load dinings:', error);
      toast.error('Failed to load dining venues');
    }
  };

  const saveVRSettings = async () => {
    const loadingToast = toast.loading('Saving VR360 settings...');
    setIsSavingVR(true);
    try {
      await vrHotelSettingsApi.updatePageSettings('dining', {
        vr360_link: diningVR360Link,
        vr_title: diningVRTitle,
        is_displaying: isDisplaying
      });
      toast.success('VR360 settings saved successfully!', { id: loadingToast, duration: 2000 });
    } catch (error: any) {
      console.error('Failed to save VR settings:', error);
      const errorMsg = error?.response?.data?.detail || 'Failed to save VR360 settings';
      toast.error(errorMsg, { id: loadingToast, duration: 3000 });
    } finally {
      setIsSavingVR(false);
    }
  };

  const toggleSection = async () => {
    const newDisplayingState = !isDisplaying;
    setIsDisplaying(newDisplayingState);
    
    try {
      await vrHotelSettingsApi.updatePageSettings('dining', {
        vr360_link: diningVR360Link,
        vr_title: diningVRTitle,
        is_displaying: newDisplayingState
      });
      toast.success(`Display status ${newDisplayingState ? 'enabled' : 'disabled'}!`);
    } catch (error: any) {
      console.error('Failed to save display status:', error);
      const errorMsg = error?.response?.data?.detail || 'Failed to save display status';
      toast.error(errorMsg);
      setIsDisplaying(!newDisplayingState);
    }
  };

  const addDining = () => {
    setEditingDining(null);
    const initialTranslations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = { name: '', description: '' };
    });
    setFormData({
      code: '',
      dining_type: 'restaurant',
      vr_link: '',
      booking_url: '',
      translations: initialTranslations,
      images: []
    });
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const editDining = async (dining: Dining) => {
    setEditingDining(dining);
    
    // Convert dining translations to form format, merge with available locales
    const translations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      const existingTrans = dining.translations[locale.locale_code];
      translations[locale.locale_code] = {
        name: existingTrans?.name || '',
        description: existingTrans?.description || ''
      };
    });
    
    // Load images from media_ids
    const images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }> = [];
    
    if (dining.media && dining.media.length > 0) {
      // Load media details and fetch actual images with auth
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const tenantCode = localStorage.getItem('tenant_code');
        
        const imagePromises = dining.media.map(async (m) => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/v1/media/${m.media_id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Code': tenantCode || ''
              }
            });
            
            if (!response.ok) {
              console.error(`Failed to load image ${m.media_id}:`, response.status);
              return null;
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            return {
              url,
              isPrimary: m.is_primary || false,
              media_id: m.media_id
            };
          } catch (err) {
            console.error(`Error loading image ${m.media_id}:`, err);
            return null;
          }
        });
        
        const loadedImages = await Promise.all(imagePromises);
        images.push(...loadedImages.filter(img => img !== null));
        
      } catch (error) {
        console.error('Failed to load dining images:', error);
        toast.error('Failed to load dining images');
      }
    }
    
    setFormData({
      code: dining.code,
      dining_type: dining.dining_type || 'restaurant',
      vr_link: dining.vr_link || '',
      booking_url: dining.booking_url || '',
      translations,
      images
    });
    setShowModal(true);
  };

  const deleteDining = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this dining venue?')) {
      try {
        await vrHotelDiningApi.deleteDining(id);
        toast.success('Dining venue deleted successfully!');
        loadDinings();
      } catch (error) {
        console.error('Failed to delete dining:', error);
        toast.error('Failed to delete dining venue');
      }
    }
  };

  const closeModal = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      setShowModal(false);
      setEditingDining(null);
    }
  };

  const saveDining = async () => {
    // Validate all locales have names
    const missingNames = availableLocales.filter(
      locale => !formData.translations[locale.locale_code]?.name?.trim()
    );
    
    if (missingNames.length > 0) {
      toast.error(`Please enter dining name for: ${missingNames.map(l => l.locale_name || l.locale_code).join(', ')}`);
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Please enter dining code');
      return;
    }

    try {
      setIsSaving(true);
      
      // Find which image is primary in formData
      const primaryIndex = (formData.images || []).findIndex(img => img.isPrimary);
      
      // Upload new images first
      const uploadedMediaIds: number[] = [];
      const newImagesToUpload = (formData.images || []).filter(img => img.file);
      
      if (newImagesToUpload.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
        try {
          const uploadResults = await mediaApi.uploadFiles(
            newImagesToUpload.map(img => img.file!),
            'image',
            'vr_hotel',
            'dining',
            editingDining?.id,
            'dining'
          );
          uploadedMediaIds.push(...uploadResults.map(r => r.id));
          toast.success(`Uploaded ${uploadResults.length} images`, { id: 'upload' });
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          toast.error('Failed to upload images', { id: 'upload' });
          setIsSaving(false);
          return;
        }
      }
      
      // Build media array in the same order as formData.images
      const media = (formData.images || []).map((img, index) => {
        let media_id: number;
        if (img.file) {
          // New uploaded image - get from uploadedMediaIds in order
          const uploadIndex = (formData.images || []).slice(0, index).filter(i => i.file).length;
          media_id = uploadedMediaIds[uploadIndex];
        } else {
          // Existing image
          media_id = img.media_id!;
        }
        
        return {
          media_id,
          is_primary: index === primaryIndex,
          sort_order: index * 10
        };
      });
      
      // Convert translations to API format
      const translations: DiningTranslation[] = Object.entries(formData.translations).map(
        ([locale, trans]) => ({
          locale,
          name: trans.name,
          description: trans.description || undefined
        })
      );

      if (editingDining) {
        // Update existing dining
        const updateData: DiningUpdate = {
          code: formData.code,
          dining_type: formData.dining_type,
          vr_link: formData.vr_link || undefined,
          booking_url: formData.booking_url?.trim() || '',
          translations,
          media
        };
        await vrHotelDiningApi.updateDining(editingDining.id, updateData);
        toast.success('Dining venue updated successfully!');
      } else {
        // Create new dining
        const createData: DiningCreate = {
          code: formData.code,
          dining_type: formData.dining_type,
          vr_link: formData.vr_link || undefined,
          booking_url: formData.booking_url?.trim() || '',
          translations,
          media
        };
        await vrHotelDiningApi.createDining(createData);
        toast.success('New dining venue added successfully!');
      }
      
      setShowModal(false);
      setEditingDining(null);
      await loadDinings();
    } catch (error: any) {
      console.error('Failed to save dining:', error);
      const message = error?.response?.data?.detail || 'Failed to save dining venue';
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleTranslationChange = (locale: string, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [locale]: {
          ...prev.translations[locale],
          [field]: value
        }
      }
    }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newImages = Array.from(files).map(file => ({
      file,
      url: URL.createObjectURL(file),
      isPrimary: (formData.images || []).length === 0
    }));

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages]
    }));
  };

  const removeImage = (index: number) => {
    setFormData(prev => {
      const newImages = (prev.images || []).filter((_, i) => i !== index);
      if (newImages.length > 0 && !newImages.some(img => img.isPrimary)) {
        newImages[0].isPrimary = true;
      }
      return { ...prev, images: newImages };
    });
  };

  const setPrimaryImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: (prev.images || []).map((img, i) => ({
        ...img,
        isPrimary: i === index
      }))
    }));
  };

  // Get dining name in current locale
  const getDiningName = (dining: Dining, locale: string = 'vi') => {
    return dining.translations[locale]?.name || dining.code;
  };

  const handleFullscreenVR = () => {
    if (diningVR360Link) {
      window.open(diningVR360Link, '_blank', 'fullscreen=yes');
    } else {
      toast.error('Please enter VR360 link first.');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status Card */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Dining Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-400'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isDisplaying}
                onChange={toggleSection}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Dining" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for Dining Page */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link VR360 Panorama / YouTube Video</label>
            <input
              type="url"
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={diningVR360Link}
              onChange={(e) => setDiningVR360Link(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
              <span>Enter the URL to a 360° panorama image (equirectangular JPG, min 4096x2048px) or YouTube video URL</span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={diningVRTitle}
              onChange={(e) => setDiningVRTitle(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={saveVRSettings}
              disabled={!isDisplaying || isSavingVR}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <FontAwesomeIcon icon={faSave} />
              {isSavingVR ? 'Saving...' : 'Save'}
            </button>
          </div>

          {diningVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={getEmbedUrl(diningVR360Link)}
                    className="absolute top-0 left-0 w-full h-full"
                    allowFullScreen
                    title="VR360 Preview"
                    allow="xr-spatial-tracking; gyroscope; accelerometer"
                  />
                </div>
              </div>
              <div className="mt-4 text-center">
                <button
                  onClick={handleFullscreenVR}
                  disabled={!isDisplaying}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center gap-2 mx-auto"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Dining List */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Dining Venues</h2>
          <button 
            onClick={addDining} 
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Dining
          </button>
        </div>

        {/* Filter by Dining Type */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Filter by Type:</label>
          <select
            value={diningTypeFilter}
            onChange={(e) => setDiningTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Dining Types</option>
            {diningTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {diningTypeFilter !== 'all' && (
            <button
              onClick={() => setDiningTypeFilter('all')}
              className="text-sm text-slate-600 hover:text-slate-900 underline"
            >
              Clear Filter
            </button>
          )}
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <p>Loading...</p>
            </div>
          ) : dinings.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <FontAwesomeIcon icon={faUtensils} className="text-6xl mb-4 text-slate-300" />
              <p>No dining venues yet. Click "Add New Dining" to add your first venue.</p>
            </div>
          ) : (
            dinings
              .filter(dining => diningTypeFilter === 'all' || dining.dining_type === diningTypeFilter)
              .map(dining => (
              <div key={dining.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {getDiningName(dining, 'vi')} {dining.translations.en && `/ ${getDiningName(dining, 'en')}`}
                    </h3>
                    {dining.vr_link && (
                      <FontAwesomeIcon icon={faVrCardboard} className="text-blue-600" title="Has VR360 Tour" />
                    )}
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <FontAwesomeIcon icon={faUtensils} className="text-slate-400" />
                      {dining.dining_type}
                    </span>
                  </div>
                  {dining.booking_url && (
                    <div className="mt-2 text-sm">
                      <a 
                        href={dining.booking_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5"
                        title={dining.booking_url}
                      >
                        <FontAwesomeIcon icon={faLink} className="text-xs" />
                        <span className="truncate max-w-xs">{dining.booking_url}</span>
                      </a>
                    </div>
                  )}
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => editDining(dining)}
                    disabled={!isDisplaying}
                    className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteDining(dining.id)}
                    disabled={!isDisplaying}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Dining Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingDining ? 'Edit Dining Venue' : 'Add New Dining Venue'}</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 text-2xl">
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="p-6">
              {/* Language Tabs */}
              <div className="flex gap-2 mb-6 border-b border-slate-200">
                {availableLocales.map(locale => (
                  <button
                    key={locale.locale_code}
                    onClick={() => setCurrentLang(locale.locale_code)}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentLang === locale.locale_code
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFlag} />
                    {locale.locale_name || locale.locale_code.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Translation Content */}
              {availableLocales.map(locale => (
                currentLang === locale.locale_code && (
                  <div key={locale.locale_code} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Dining Name ({locale.locale_name || locale.locale_code}) *
                      </label>
                      <input
                        type="text"
                        value={formData.translations[locale.locale_code]?.name || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'name', e.target.value)}
                        disabled={!isDisplaying}
                        placeholder="e.g., Ocean View Restaurant"
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Description ({locale.locale_name || locale.locale_code})
                      </label>
                      <textarea
                        value={formData.translations[locale.locale_code]?.description || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'description', e.target.value)}
                        disabled={!isDisplaying}
                        rows={3}
                        placeholder="Enter a brief description..."
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )
              ))}

              {/* Dining Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dining Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="e.g., REST-01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Dining Type</label>
                  <select
                    value={formData.dining_type}
                    onChange={(e) => handleInputChange('dining_type', e.target.value)}
                    disabled={!isDisplaying}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {diningTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* VR Link */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faVrCardboard} />
                    VR360 Tour Link
                  </label>
                  <input
                    type="url"
                    value={formData.vr_link}
                    onChange={(e) => handleInputChange('vr_link', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="https://example.com/vr360-tour"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  {formData.vr_link && (
                    <button
                      type="button"
                      onClick={() => window.open(formData.vr_link, '_blank')}
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Xem trước VR360
                    </button>
                  )}
                </div>

                {/* Booking URL */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faLink} />
                    Booking URL
                  </label>
                  <input
                    type="url"
                    value={formData.booking_url}
                    onChange={(e) => handleInputChange('booking_url', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="https://booking.example.com/dining-reservation"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                    <span>Enter the direct booking/reservation URL for this dining venue</span>
                  </p>
                </div>

                {/* Dining Images */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faImages} />
                    Dining Images
                  </label>
                  <div 
                    onClick={() => !isSaving && isDisplaying && document.getElementById('diningImagesInput')?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faImages} className="text-5xl text-slate-400 mb-3" />
                    <p className="text-slate-600 mb-1">Click to select or drag and drop images here</p>
                    <p className="text-slate-400 text-sm">PNG, JPG, WEBP (max 5MB per image)</p>
                    <input
                      id="diningImagesInput"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={!isDisplaying || isSaving}
                      className="hidden"
                    />
                  </div>
                  
                  {formData.images && formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img.url} 
                            alt={`Dining ${index + 1}`}
                            className="w-full h-24 object-cover rounded-md border-2 border-slate-200"
                          />
                          {img.isPrimary && (
                            <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                              Primary
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                            {!img.isPrimary && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setPrimaryImage(index); }}
                                disabled={!isDisplaying}
                                className="px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); removeImage(index); }}
                              disabled={!isDisplaying}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="border-t border-slate-200 p-6 bg-slate-50 flex justify-end gap-4 sticky bottom-0">
              <button 
                onClick={closeModal}
                disabled={isSaving}
                className="px-6 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Cancel
              </button>
              <button 
                onClick={saveDining}
                disabled={isSaving || !isDisplaying}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} />
                {isSaving ? 'Saving...' : (editingDining ? 'Update' : 'Add Dining')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VRHotelDining;
