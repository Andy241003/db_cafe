import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
    faEdit,
    faEye,
    faFlag,
    faGripVertical,
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
import MediaPickerModal from '../../components/MediaPickerModal';
import { mediaApi } from '../../services/mediaApi';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelFacilityApi, vrHotelSettingsApi } from '../../services/vrHotelApi';

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

interface FacilityTranslation {
  locale: string;
  name: string;
  description?: string;
}

interface Facility {
  id: number;
  tenant_id: number;
  property_id: number;
  code: string;
  facility_type?: string;
  operating_hours?: string;
  vr_link?: string;
  status: string;
  display_order: number;
  translations: Record<string, { name: string; description: string }>;
  media?: Array<{ media_id: number; is_vr360: boolean; is_primary: boolean; sort_order: number }>;
  created_at: string;
  updated_at?: string;
}

interface FacilityCreate {
  code: string;
  facility_type?: string;
  operating_hours?: string;
  vr_link?: string;
  display_order?: number;
  translations: FacilityTranslation[];
  media: Array<{ media_id: number; is_vr360: boolean; is_primary: boolean; sort_order: number }>;
}

interface FacilityUpdate extends FacilityCreate {}

// Sortable Facility Item Component
interface SortableFacilityItemProps {
  facility: Facility;
  isDisplaying: boolean;
  onEdit: (facility: Facility) => void;
  onDelete: (id: number) => void;
  getFacilityName: (facility: Facility, lang: string) => string;
}

const SortableFacilityItem: React.FC<SortableFacilityItemProps> = ({ facility, isDisplaying, onEdit, onDelete, getFacilityName }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: facility.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const hasVR = facility.vr_link;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center gap-3"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 p-2"
      >
        <FontAwesomeIcon icon={faGripVertical} size="lg" />
      </div>
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <h3 className="text-lg font-semibold text-slate-800">
            {getFacilityName(facility, 'vi')} {facility.translations.en && `/ ${getFacilityName(facility, 'en')}`}
          </h3>
          {hasVR && (
            <FontAwesomeIcon icon={faVrCardboard} className="text-blue-600" title="Has VR360 Tour" />
          )}
        </div>
        <div className="flex gap-6 text-sm text-slate-600">
          <span className="font-medium text-blue-600">Order: {facility.display_order}</span>
          {facility.facility_type && (
            <span>Type: {facility.facility_type}</span>
          )}
          {facility.operating_hours && (
            <span>Hours: {facility.operating_hours}</span>
          )}
        </div>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={() => onEdit(facility)}
          disabled={!isDisplaying}
          className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faEdit} />
          Edit
        </button>
        <button 
          onClick={() => onDelete(facility.id)}
          disabled={!isDisplaying}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete
        </button>
      </div>
    </div>
  );
};

const VRHotelFacilities: React.FC = () => {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('vi');
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [facilitiesVR360Link, setFacilitiesVR360Link] = useState('');
  const [facilitiesVRTitle, setFacilitiesVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);
  const [facilityTypeFilter, setFacilityTypeFilter] = useState<string>('all');
  
  // Media picker modal state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    code: string;
    facility_type: string;
    operating_hours: string;
    vr_link: string;
    display_order: number;
    translations: Record<string, { name: string; description: string }>;
    images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }>;
  }>({
    code: '',
    facility_type: 'pool',
    operating_hours: '',
    vr_link: '',
    display_order: 0,
    translations: {},
    images: []
  });

  const facilityTypes = [
    { value: 'pool', label: 'Swimming Pool' },
    { value: 'gym', label: 'Gym / Fitness Center' },
    { value: 'spa', label: 'Spa' },
    { value: 'meeting_room', label: 'Meeting Room' },
    { value: 'business_center', label: 'Business Center' },
    { value: 'parking', label: 'Parking' },
    { value: 'other', label: 'Other' }
  ];

  useEffect(() => {
    loadLocalesAndFacilities();
  }, []);

  const loadLocalesAndFacilities = async () => {
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

      // Load facilities
      await loadFacilities();
      
      // Load VR settings
      const vrSettings = await vrHotelSettingsApi.getPageSettings('facilities');
      if (vrSettings) {
        setFacilitiesVR360Link(vrSettings.vr360_link || '');
        setFacilitiesVRTitle(vrSettings.vr_title || '');
        setIsDisplaying(vrSettings.is_displaying !== false);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadFacilities = async () => {
    try {
      const data = await vrHotelFacilityApi.getFacilities();
      setFacilities(data);
    } catch (error) {
      console.error('Failed to load facilities:', error);
      toast.error('Failed to load facilities');
    }
  };

  const addFacility = () => {
    setEditingFacility(null);
    const initialTranslations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = { name: '', description: '' };
    });
    setFormData({
      code: '',
      facility_type: 'pool',
      operating_hours: '',
      vr_link: '',
      display_order: 0,
      translations: initialTranslations,
      images: []
    });
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const editFacility = async (facility: Facility) => {
    setEditingFacility(facility);
    
    const translations: Record<string, { name: string; description: string }> = {};
    availableLocales.forEach(locale => {
      const existingTrans = facility.translations[locale.locale_code];
      translations[locale.locale_code] = {
        name: existingTrans?.name || '',
        description: existingTrans?.description || ''
      };
    });
    
    const images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }> = [];
    
    if (facility.media && facility.media.length > 0) {
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const tenantCode = localStorage.getItem('tenant_code');
        
        const imagePromises = facility.media.map(async (m) => {
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
      code: facility.code,
      facility_type: facility.facility_type || 'pool',
      operating_hours: facility.operating_hours || '',
      vr_link: facility.vr_link || '',
      display_order: facility.display_order || 0,
      translations,
      images
    });
    setShowModal(true);
  };

  const deleteFacility = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this facility?')) {
      try {
        console.log('Deleting facility with ID:', id);
        await vrHotelFacilityApi.deleteFacility(id);
        toast.success('Facility deleted successfully!');
        loadFacilities();
      } catch (error: any) {
        console.error('Failed to delete facility:', error);
        console.error('Error details:', error.response?.data);
        const errorMessage = error.response?.data?.detail || 'Failed to delete facility';
        toast.error(errorMessage);
      }
    }
  };

  const closeModal = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      setShowModal(false);
      setEditingFacility(null);
    }
  };

  const saveFacility = async () => {
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
            'facility',
            editingFacility?.id,
            'facilities'
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
          is_vr360: false,
          is_primary: index === primaryIndex,
          sort_order: index * 10
        };
      });
      
      const translations: FacilityTranslation[] = Object.entries(formData.translations).map(
        ([locale, trans]) => ({
          locale,
          name: trans.name,
          description: trans.description || undefined
        })
      );

      if (editingFacility) {
        const updateData: FacilityUpdate = {
          code: formData.code,
          facility_type: formData.facility_type,
          operating_hours: formData.operating_hours || undefined,
          vr_link: formData.vr_link?.trim() || '',
          display_order: formData.display_order,
          translations,
          media
        };
        await vrHotelFacilityApi.updateFacility(editingFacility.id, updateData);
        toast.success('Facility updated successfully!');
      } else {
        const createData: FacilityCreate = {
          code: formData.code,
          facility_type: formData.facility_type,
          operating_hours: formData.operating_hours || undefined,
          vr_link: formData.vr_link?.trim() || '',
          display_order: formData.display_order,
          translations,
          media
        };
        await vrHotelFacilityApi.createFacility(createData);
        toast.success('New facility added successfully!');
      }
      
      setShowModal(false);
      setEditingFacility(null);
      await loadFacilities();
    } catch (error: any) {
      console.error('Failed to save facility:', error);
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

  const openMediaPicker = () => {
    setMediaPickerOpen(true);
  };

  const handleMediaSelectMultiple = (mediaIds: number[], mediaUrls: string[]) => {
    // Add all selected media from library to images
    const newImages = mediaIds.map((mediaId, index) => ({
      media_id: mediaId,
      url: mediaUrls[index],
      isPrimary: (formData.images || []).length === 0 && index === 0
    }));

    setFormData(prev => ({
      ...prev,
      images: [...(prev.images || []), ...newImages]
    }));

    setMediaPickerOpen(false);
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

  const getFacilityName = (facility: Facility, locale: string = 'vi') => {
    return facility.translations[locale]?.name || facility.code;
  };

  const toggleSection = async () => {
    const newDisplayingState = !isDisplaying;
    setIsDisplaying(newDisplayingState);
    
    try {
      await vrHotelSettingsApi.updatePageSettings('facilities', {
        vr360_link: facilitiesVR360Link,
        vr_title: facilitiesVRTitle,
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
      await vrHotelSettingsApi.updatePageSettings('facilities', {
        vr360_link: facilitiesVR360Link,
        vr_title: facilitiesVRTitle,
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
    if (facilitiesVR360Link) {
      window.open(facilitiesVR360Link, '_blank', 'fullscreen=yes');
    } else {
      toast.error('Please enter VR360 link first.');
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = facilities.findIndex(f => f.id === active.id);
    const newIndex = facilities.findIndex(f => f.id === over.id);
    
    // Reorder the array
    const newFacilities = [...facilities];
    const [movedItem] = newFacilities.splice(oldIndex, 1);
    newFacilities.splice(newIndex, 0, movedItem);
    
    // Update display_order for all affected items
    const updatedFacilities = newFacilities.map((facility, index) => ({
      ...facility,
      display_order: index
    }));
    
    setFacilities(updatedFacilities);
    
    // Save to backend - only update items with changed display_order
    try {
      const changedFacilities = updatedFacilities.filter((facility, index) => {
        const originalFacility = facilities.find(f => f.id === facility.id);
        return originalFacility && originalFacility.display_order !== index;
      });
      
      if (changedFacilities.length === 0) return;
      
      const updatePromises = changedFacilities.map(facility => 
        vrHotelFacilityApi.updateFacility(facility.id, { display_order: facility.display_order })
      );
      await Promise.all(updatePromises);
      toast.success(`Updated ${changedFacilities.length} facility/facilities order`);
    } catch (error) {
      console.error('Failed to update facility order:', error);
      toast.error('Failed to save facility order');
      // Reload to restore original order
      loadFacilities();
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - Facilities Section</h2>
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
            When display is turned off, the "Facilities" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for Facilities Page */}
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
              value={facilitiesVR360Link}
              onChange={(e) => setFacilitiesVR360Link(e.target.value)}
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
              value={facilitiesVRTitle}
              onChange={(e) => setFacilitiesVRTitle(e.target.value)}
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

          {facilitiesVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={getEmbedUrl(facilitiesVR360Link)}
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

      {/* Facilities Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Facilities Management</h2>
          <button 
            onClick={addFacility}
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Facility
          </button>
        </div>
        
        {/* Filter by Facility Type */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Filter by Type:</label>
          <select
            value={facilityTypeFilter}
            onChange={(e) => setFacilityTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Facility Types</option>
            {facilityTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {facilityTypeFilter !== 'all' && (
            <button
              onClick={() => setFacilityTypeFilter('all')}
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
          ) : facilities.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No facilities yet. Click "Add New Facility" to add your first facility.</p>
            </div>
          ) : (
            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext 
                items={facilities
                  .filter(facility => facilityTypeFilter === 'all' || facility.facility_type === facilityTypeFilter)
                  .map(facility => facility.id)} 
                strategy={verticalListSortingStrategy}
              >
                {facilities
                  .filter(facility => facilityTypeFilter === 'all' || facility.facility_type === facilityTypeFilter)
                  .map(facility => (
                    <SortableFacilityItem
                      key={facility.id}
                      facility={facility}
                      isDisplaying={isDisplaying}
                      onEdit={editFacility}
                      onDelete={deleteFacility}
                      getFacilityName={getFacilityName}
                    />
                  ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Facility Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingFacility ? 'Edit Facility' : 'Add New Facility'}</h3>
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
                        Facility Name ({locale.locale_name || locale.locale_code}) *
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

              {/* Facility Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Facility Code *</label>
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
                  <label className="block text-sm font-medium text-slate-700 mb-2">Facility Type</label>
                  <select
                    value={formData.facility_type}
                    onChange={(e) => handleInputChange('facility_type', e.target.value)}
                    disabled={!isDisplaying}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {facilityTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Operating Hours</label>
                  <input
                    type="text"
                    value={formData.operating_hours}
                    onChange={(e) => handleInputChange('operating_hours', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="e.g., 6:00 AM - 10:00 PM"
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
                    Facility Images
                  </label>
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={openMediaPicker}
                      disabled={!isDisplaying || isSaving}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                    >
                      <FontAwesomeIcon icon={faImages} />
                      Select Images
                    </button>
                  </div>
                  
                  {formData.images && formData.images.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-3">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={img.url} 
                            alt={`Facility ${index + 1}`}
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
                onClick={saveFacility}
                disabled={isSaving || !isDisplaying}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} />
                {isSaving ? 'Saving...' : (editingFacility ? 'Update' : 'Add Facility')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelectMultiple={handleMediaSelectMultiple}
        title="Select Facility Images"
        kind="image"
        source="vr_hotel"
        folder="facilities"
        maxFileSize={5 * 1024 * 1024}
        allowMultiple={true}
      />
    </div>
  );
};

export default VRHotelFacilities;
