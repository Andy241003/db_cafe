import {
    faEdit,
    faEye,
    faFlag,
    faImages,
    faInfoCircle,
    faPlay,
    faPlus,
    faSave,
    faTimes,
    faTrash,
    faVrCardboard
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi } from '../../services/mediaApi';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelServiceApi, vrHotelSettingsApi, type Service, type ServiceCreate, type ServiceUpdate } from '../../services/vrHotelApi';

interface ServiceTranslation {
  locale: string;
  name: string;
  description?: string;
}

const VRHotelServices: React.FC = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('vi');
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [servicesVR360Link, setservicesVR360Link] = useState('');
  const [servicesVRTitle, setservicesVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);
  
  const [formData, setFormData] = useState<{
    code: string;
    service_type: string;
    availability: string;
    price_info: string;
    vr_link: string;
    translations: Record<string, { name: string; description: string }>;
    images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }>;
  }>({
    code: '',
    service_type: 'room_service',
    availability: '',
    price_info: '',
    vr_link: '',
    translations: {},
    images: []
  });

  const serviceTypes = [
    { value: 'room_service', label: 'Room Service' },
    { value: 'laundry', label: 'Laundry' },
    { value: 'concierge', label: 'Concierge' },
    { value: 'airport_transfer', label: 'Airport Transfer' },
    { value: 'spa_service', label: 'Spa Service' },
    { value: 'tour_booking', label: 'Tour Booking' },
    { value: 'car_rental', label: 'Car Rental' },
    { value: 'babysitting', label: 'Babysitting' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadLocalesAndServices();
  }, []);

  const loadLocalesAndServices = async () => {
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

      // Load services
      await loadServices();
      
      // Load VR settings
      const vrSettings = await vrHotelSettingsApi.getPageSettings('services');
      if (vrSettings) {
        setservicesVR360Link(vrSettings.vr360_link || '');
        setservicesVRTitle(vrSettings.vr_title || '');
        setIsDisplaying(vrSettings.is_displaying !== false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const propertyId = localStorage.getItem('current_property_id');
      if (!propertyId) return;
      const data = await vrHotelServiceApi.getServices(parseInt(propertyId));
      setServices(data);
    } catch (error) {
      console.error('Failed to load services:', error);
      toast.error('Failed to load services');
    }
  };

  const addService = () => {
    setEditingService(null);
    const initialTranslations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = { name: '', description: '' };
    });
    setFormData({
      code: '',
      service_type: 'room_service',
      availability: '',
      price_info: '',
      vr_link: '',
      translations: initialTranslations,
      images: []
    });
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const editService = async (service: Service) => {
    setEditingService(service);
    
    const translations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      const existingTrans = service.translations[locale.locale_code];
      translations[locale.locale_code] = {
        name: existingTrans?.name || '',
        description: existingTrans?.description || ''
      };
    });
    
    const images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }> = [];
    
    if (service.media && service.media.length > 0) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const tenantCode = localStorage.getItem('tenant_code');
        
        const imagePromises = service.media.map(async (m) => {
          try {
            const response = await fetch(`${API_BASE_URL}/api/v1/media/${m.media_id}/download`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Tenant-Code': tenantCode || ''
              }
            });
            
            if (!response.ok) return null;
            
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
        console.error('Failed to load facility images:', error);
        toast.error('Failed to load facility images');
      }
    }
    
    setFormData({
      code: service.code,
      service_type: service.service_type || 'room_service',
      availability: service.availability || '',
      price_info: service.price_info || '',
      vr_link: service.vr_link || '',
      translations,
      images
    });
    setShowModal(true);
  };

  const deleteService = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this service?')) {
      try {
        const propertyId = localStorage.getItem('current_property_id');
        if (!propertyId) return;
        await vrHotelServiceApi.deleteService(parseInt(propertyId), id);
        toast.success('Service deleted successfully!');
        loadServices();
      } catch (error) {
        console.error('Failed to delete service:', error);
        toast.error('Failed to delete facility');
      }
    }
  };

  const closeModal = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      setShowModal(false);
      setEditingService(null);
    }
  };

  const saveService = async () => {
    const missingNames = availableLocales.filter(
      locale => !formData.translations[locale.locale_code]?.name?.trim()
    );
    
    if (missingNames.length > 0) {
      toast.error(`Please enter facility name for: ${missingNames.map(l => l.locale_name || l.locale_code).join(', ')}`);
      return;
    }

    if (!formData.code.trim()) {
      toast.error('Please enter facility code');
      return;
    }

    try {
      setIsSaving(true);
      
      // Find which image is primary in formData
      const primaryIndex = (formData.images || []).findIndex(img => img.isPrimary);
      
      // Upload new images
      const uploadedMediaIds: number[] = [];
      const newImagesToUpload = (formData.images || []).filter(img => img.file);
      
      if (newImagesToUpload.length > 0) {
        toast.loading('Uploading images...', { id: 'upload' });
        try {
          const uploadResults = await mediaApi.uploadFiles(
            newImagesToUpload.map(img => img.file!),
            'image',
            'vr_hotel',
            'service',
            editingService?.id,
            'services'
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
      
      // Build mediaIds array in the same order as formData.images
      const mediaIds = (formData.images || []).map((img, index) => {
        if (img.file) {
          // New uploaded image - get from uploadedMediaIds in order
          const uploadIndex = (formData.images || []).slice(0, index).filter(i => i.file).length;
          return uploadedMediaIds[uploadIndex];
        } else {
          // Existing image
          return img.media_id!;
        }
      });
      
      const primary_media_id = primaryIndex >= 0 && mediaIds[primaryIndex] ? mediaIds[primaryIndex] : undefined;
      
      const translations: ServiceTranslation[] = Object.entries(formData.translations).map(
        ([locale, trans]) => ({
          locale,
          name: trans.name,
          description: trans.description || undefined
        })
      );

      if (editingService) {
        const propertyId = localStorage.getItem('current_property_id');
        if (!propertyId) return;
        const updateData: ServiceUpdate = {
          code: formData.code,
          service_type: formData.service_type,
          availability: formData.availability || undefined,
          price_info: formData.price_info || undefined,
          vr_link: formData.vr_link || undefined,
          translations,
          media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          primary_media_id
        };
        await vrHotelServiceApi.updateService(parseInt(propertyId), editingService.id, updateData);
        toast.success('Service updated successfully!');
      } else {
        const propertyId = localStorage.getItem('current_property_id');
        if (!propertyId) return;
        const createData: ServiceCreate = {
          code: formData.code,
          service_type: formData.service_type,
          availability: formData.availability || undefined,
          price_info: formData.price_info || undefined,
          vr_link: formData.vr_link || undefined,
          translations,
          media_ids: mediaIds.length > 0 ? mediaIds : undefined,
          primary_media_id
        };
        await vrHotelServiceApi.createService(parseInt(propertyId), createData);
        toast.success('New service added successfully!');
      }
      
      setShowModal(false);
      setEditingService(null);
      await loadServices();
    } catch (error: any) {
      console.error('Failed to save service:', error);
      const message = error?.response?.data?.detail || 'Failed to save facility';
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

  const getServiceName = (service: Service, locale: string = 'vi') => {
    return service.translations[locale]?.name || service.code;
  };

  const toggleSection = async () => {
    const newDisplayingState = !isDisplaying;
    setIsDisplaying(newDisplayingState);
    
    try {
      await vrHotelSettingsApi.updatePageSettings('services', {
        vr360_link: servicesVR360Link,
        vr_title: servicesVRTitle,
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

  const saveVRSettings = async () => {
    const loadingToast = toast.loading('Saving VR360 settings...');
    setIsSavingVR(true);
    try {
      await vrHotelSettingsApi.updatePageSettings('services', {
        vr360_link: servicesVR360Link,
        vr_title: servicesVRTitle,
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

  const handleFullscreenVR = () => {
    if (servicesVR360Link) {
      window.open(servicesVR360Link, '_blank', 'fullscreen=yes');
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - services Section</h2>
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
            When display is turned off, the "services" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for services Page */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center gap-3">
          <FontAwesomeIcon icon={faVrCardboard} className="text-purple-600 text-xl" />
          <h2 className="text-xl font-bold text-slate-800">VR360 Settings</h2>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Link VR360 Panorama</label>
            <input
              type="url"
              placeholder="https://example.com/your-panorama.jpg"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={servicesVR360Link}
              onChange={(e) => setservicesVR360Link(e.target.value)}
              disabled={!isDisplaying || isSavingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
              <span>Enter the path to the 360° panorama image for the services list page (recommended: equirectangular JPG, minimum 4096x2048px)</span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={servicesVRTitle}
              onChange={(e) => setservicesVRTitle(e.target.value)}
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

          {servicesVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={servicesVR360Link}
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

      {/* services Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">services Management</h2>
          <button 
            onClick={addService}
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Service
          </button>
        </div>
        
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-12 text-slate-500">
              <p>Loading...</p>
            </div>
          ) : services.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No services yet. Click "Add New Service" to add your first service.</p>
            </div>
          ) : (
            services.map(service => (
              <div key={service.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-lg font-semibold text-slate-800">
                      {getServiceName(service, 'vi')} {service.translations.en && `/ ${getServiceName(service, 'en')}`}
                    </h3>
                    {service.vr_link && (
                      <FontAwesomeIcon icon={faVrCardboard} className="text-blue-600" title="Has VR360 Tour" />
                    )}
                  </div>
                  <div className="flex gap-6 text-sm text-slate-600">
                    {service.service_type && (
                      <span>Type: {service.service_type}</span>
                    )}
                    {service.availability && (
                      <span>Hours: {service.availability}</span>
                    )}
                  </div>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => editService(service)}
                    disabled={!isDisplaying}
                    className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faEdit} />
                    Edit
                  </button>
                  <button 
                    onClick={() => deleteService(service.id)}
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

      {/* Service Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingService ? 'Edit Service' : 'Add New Service'}</h3>
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
                        Service Name ({locale.locale_name || locale.locale_code}) *
                      </label>
                      <input
                        type="text"
                        value={formData.translations[locale.locale_code]?.name || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'name', e.target.value)}
                        disabled={!isDisplaying}
                        placeholder="e.g., Swimming Pool"
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

              {/* Service Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service Code *</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="e.g., POOL-01"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Service Type</label>
                  <select
                    value={formData.service_type}
                    onChange={(e) => handleInputChange('service_type', e.target.value)}
                    disabled={!isDisplaying}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {serviceTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Availability</label>
                  <input
                    type="text"
                    value={formData.availability}
                    onChange={(e) => handleInputChange('availability', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="e.g., 24/7, 6:00 AM - 10:00 PM"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                {/* Price Info */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Price Information</label>
                  <input
                    type="text"
                    value={formData.price_info}
                    onChange={(e) => handleInputChange('price_info', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="e.g., Starting from $50, Free, Upon request"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
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
                      Preview VR360
                    </button>
                  )}
                </div>

                {/* Images */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faImages} />
                    Service Images
                  </label>
                  <div 
                    onClick={() => !isSaving && isDisplaying && document.getElementById('facilityImagesInput')?.click()}
                    className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <FontAwesomeIcon icon={faImages} className="text-5xl text-slate-400 mb-3" />
                    <p className="text-slate-600 mb-1">Click to select or drag and drop images here</p>
                    <p className="text-slate-400 text-sm">PNG, JPG, WEBP (max 5MB per image)</p>
                    <input
                      id="facilityImagesInput"
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
                            alt={`Service ${index + 1}`}
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
                onClick={saveService}
                disabled={isSaving || !isDisplaying}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} />
                {isSaving ? 'Saving...' : (editingService ? 'Update' : 'Add Service')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VRHotelServices;

