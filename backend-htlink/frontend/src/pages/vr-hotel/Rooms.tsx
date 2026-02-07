import {
    faCheckCircle,
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
    faVrCardboard
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/MediaPickerModal';
import { mediaApi } from '../../services/mediaApi';
import { propertyLocalesApi, type PropertyLocale } from '../../services/propertyLocalesApi';
import { vrHotelRoomsApi, vrHotelSettingsApi, type Room, type RoomCreate, type RoomTranslation, type RoomUpdate } from '../../services/vrHotelApi';

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

const VRHotelRooms: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [currentLang, setCurrentLang] = useState<string>('vi');
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableLocales, setAvailableLocales] = useState<PropertyLocale[]>([]);
  const [newAmenity, setNewAmenity] = useState('');
  const [roomsVR360Link, setRoomsVR360Link] = useState('');
  const [roomsVRTitle, setRoomsVRTitle] = useState('');
  const [isSavingVR, setIsSavingVR] = useState(false);
  const [roomTypeFilter, setRoomTypeFilter] = useState<string>('all');
  
  // Media picker modal state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  
  const [formData, setFormData] = useState<{
    room_code: string;
    room_type: string;
    capacity: number;
    size_sqm: number;
    price_per_night: number;
    vr_link: string;
    booking_url: string;
    translations: Record<string, { name: string; description: string; amenities: string[] }>;
    images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }>;
  }>({
    room_code: '',
    room_type: 'standard',
    capacity: 2,
    size_sqm: 0,
    price_per_night: 0,
    vr_link: '',
    booking_url: '',
    translations: {},
    images: []
  });

  const roomTypes = [
    { value: 'standard', label: 'Standard' },
    { value: 'superior', label: 'Superior' },
    { value: 'deluxe', label: 'Deluxe' },
    { value: 'suite', label: 'Suite' },
    { value: 'penthouse', label: 'Penthouse' },
    { value: 'other', label: 'Other' }
  ];

  // Load rooms and locales on mount
  useEffect(() => {
    loadLocalesAndRooms();
  }, []);

  const loadLocalesAndRooms = async () => {
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

      // Load rooms from API
      await loadRooms();
      
      // Load VR page settings from database
      const vrSettings = await vrHotelSettingsApi.getPageSettings('rooms');
      if (vrSettings) {
        setRoomsVR360Link(vrSettings.vr360_link || '');
        setRoomsVRTitle(vrSettings.vr_title || '');
        setIsDisplaying(vrSettings.is_displaying !== false);
      }
    } catch (error) {
      console.error('Error loading locales and rooms:', error);
      toast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const loadRooms = async () => {
    try {
      const data = await vrHotelRoomsApi.getRooms();
      setRooms(data);
    } catch (error) {
      console.error('Failed to load rooms:', error);
      toast.error('Failed to load room list');
    }
  };

  const saveVRSettings = async () => {
    const loadingToast = toast.loading('Saving VR360 settings...');
    setIsSavingVR(true);
    try {
      await vrHotelSettingsApi.updatePageSettings('rooms', {
        vr360_link: roomsVR360Link,
        vr_title: roomsVRTitle,
        is_displaying: isDisplaying
      });
      toast.success('VR360 settings saved', { id: loadingToast, duration: 2000 });
    } catch (error: any) {
      console.error('Failed to save VR settings:', error);
      const errorMsg = error?.response?.data?.detail || 'Error saving VR360 settings';
      toast.error(errorMsg, { id: loadingToast, duration: 3000 });
    } finally {
      setIsSavingVR(false);
    }
  };

  const toggleSection = async () => {
    const newDisplayingState = !isDisplaying;
    setIsDisplaying(newDisplayingState);
    
    try {
      await vrHotelSettingsApi.updatePageSettings('rooms', {
        vr360_link: roomsVR360Link,
        vr_title: roomsVRTitle,
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

  const addRoom = () => {
    setEditingRoom(null);
    const initialTranslations: Record<string, { name: string; description: string; amenities: string[] }> = {};
    availableLocales.forEach(locale => {
      initialTranslations[locale.locale_code] = { name: '', description: '', amenities: [] };
    });
    setFormData({
      room_code: '',
      room_type: 'standard',
      capacity: 2,
      size_sqm: 0,
      price_per_night: 0,
      vr_link: '',
      booking_url: '',
      translations: initialTranslations,
      images: []
    });
    setCurrentLang(availableLocales[0]?.locale_code || 'vi');
    setShowModal(true);
  };

  const editRoom = async (room: Room) => {
    setEditingRoom(room);
    
    // Convert room translations to form format, merge with available locales
    const translations: Record<string, { name: string; description: string; amenities: string[] }> = {};
    availableLocales.forEach(locale => {
      const existingTrans = room.translations[locale.locale_code];
      // Parse amenities_text if it exists (comma-separated string)
      const amenitiesList = existingTrans?.amenities_text 
        ? existingTrans.amenities_text.split(',').map(a => a.trim()).filter(a => a)
        : room.amenities_json || [];
      
      translations[locale.locale_code] = {
        name: existingTrans?.name || '',
        description: existingTrans?.description || '',
        amenities: amenitiesList
      };
    });
    
    // Load images from media_ids
    const images: Array<{ file?: File; url: string; isPrimary: boolean; media_id?: number }> = [];
    
    if (room.media && room.media.length > 0) {
      // Load media details and fetch actual images with auth
      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
        const token = localStorage.getItem('access_token');
        const tenantCode = localStorage.getItem('tenant_code');
        
        const imagePromises = room.media.map(async (m) => {
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
        console.error('Failed to load room images:', error);
        toast.error('Không thể tải ảnh phòng');
      }
    }
    
    setFormData({
      room_code: room.room_code,
      room_type: room.room_type || 'standard',
      capacity: room.capacity || 2,
      size_sqm: room.size_sqm || 0,
      price_per_night: room.price_per_night || 0,
      vr_link: room.vr_link || '',
      booking_url: room.booking_url || '',
      translations,
      images
    });
    setShowModal(true);
  };

  const deleteRoom = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await vrHotelRoomsApi.deleteRoom(id);
        toast.success('Room deleted successfully!');
        loadRooms();
      } catch (error) {
        console.error('Failed to delete room:', error);
        toast.error('Failed to delete room');
      }
    }
  };

  const closeModal = () => {
    if (window.confirm('Are you sure you want to close? Unsaved changes will be lost.')) {
      setShowModal(false);
      setEditingRoom(null);
    }
  };

  const saveRoom = async () => {
    // Validate all locales have names
    const missingNames = availableLocales.filter(
      locale => !formData.translations[locale.locale_code]?.name?.trim()
    );
    
    if (missingNames.length > 0) {
      toast.error(`Please enter room name for: ${missingNames.map(l => l.locale_name || l.locale_code).join(', ')}`);
      return;
    }

    if (!formData.room_code.trim()) {
      toast.error('Please enter room code');
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
            'room',
            editingRoom?.id,
            'rooms'
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
      
      // Convert translations to API format with amenities
      const translations: RoomTranslation[] = Object.entries(formData.translations).map(
        ([locale, trans]) => ({
          locale,
          name: trans.name,
          description: trans.description || undefined,
          amenities_text: trans.amenities && trans.amenities.length > 0 
            ? trans.amenities.join(', ') 
            : undefined
        })
      );

      if (editingRoom) {
        // Update existing room
        const updateData: RoomUpdate = {
          room_code: formData.room_code,
          room_type: formData.room_type,
          capacity: formData.capacity,
          size_sqm: formData.size_sqm,
          price_per_night: formData.price_per_night,
          vr_link: formData.vr_link?.trim() || '',
          booking_url: formData.booking_url?.trim() || '',
          translations,
          media
        };
        await vrHotelRoomsApi.updateRoom(editingRoom.id, updateData);
        toast.success('Room updated successfully!');
      } else {
        // Create new room
        const createData: RoomCreate = {
          room_code: formData.room_code,
          room_type: formData.room_type,
          capacity: formData.capacity,
          size_sqm: formData.size_sqm,
          price_per_night: formData.price_per_night,
          vr_link: formData.vr_link?.trim() || '',
          booking_url: formData.booking_url?.trim() || '',
          translations,
          media
        };
        await vrHotelRoomsApi.createRoom(createData);
        toast.success('Room added successfully!');
      }
      
      setShowModal(false);
      setEditingRoom(null);
      await loadRooms();
    } catch (error: any) {
      console.error('Failed to save room:', error);
      const message = error?.response?.data?.detail || 'Failed to save room';
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

  const addAmenity = () => {
    if (!newAmenity.trim()) {
      toast.error('Please enter amenity name');
      return;
    }
    
    const currentAmenities = formData.translations[currentLang]?.amenities || [];
    
    // Split by comma to allow multiple amenities at once
    const newAmenities = newAmenity
      .split(',')
      .map(a => a.trim())
      .filter(a => a); // Remove empty strings
    
    if (newAmenities.length === 0) {
      toast.error('Please enter amenity name');
      return;
    }
    
    // Filter out duplicates
    const duplicates: string[] = [];
    const toAdd: string[] = [];
    
    newAmenities.forEach(amenity => {
      if (currentAmenities.includes(amenity)) {
        duplicates.push(amenity);
      } else {
        toAdd.push(amenity);
      }
    });
    
    if (toAdd.length === 0) {
      toast.error('All amenities already exist');
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [currentLang]: {
          ...prev.translations[currentLang],
          amenities: [...currentAmenities, ...toAdd]
        }
      }
    }));
    
    if (duplicates.length > 0) {
      toast.success(`Added ${toAdd.length} amenity(ies). Skipped ${duplicates.length} duplicate(s).`);
    } else {
      toast.success(`Added ${toAdd.length} amenity(ies)`);
    }
    
    setNewAmenity('');
  };

  const removeAmenity = (amenity: string) => {
    const currentAmenities = formData.translations[currentLang]?.amenities || [];
    setFormData(prev => ({
      ...prev,
      translations: {
        ...prev.translations,
        [currentLang]: {
          ...prev.translations[currentLang],
          amenities: currentAmenities.filter(a => a !== amenity)
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price);
  };

  // Get room name in current locale
  const getRoomName = (room: Room, locale: string = 'vi') => {
    return room.translations[locale]?.name || room.room_code;
  };
  const handlePreviewVR = () => {
    if (formData.vr_link) {
      window.open(formData.vr_link, '_blank', 'width=1200,height=800');
    } else {
      toast.error('Please enter VR360 link before preview.');
    }
  };

  const handleFullscreenVR = () => {
    if (roomsVR360Link) {
      window.open(roomsVR360Link, '_blank', 'fullscreen=yes');
    } else {
      toast.error('Please enter VR360 link.');
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
          <h2 className="text-xl font-bold text-slate-800">Display Status - Section Rooms</h2>
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
            When display is turned off, the "Rooms" section will not appear on the website and all input fields will be disabled.
          </span>
        </div>
      </div>

      {/* VR360 Settings for Rooms Page */}
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
              value={roomsVR360Link}
              onChange={(e) => setRoomsVR360Link(e.target.value)}
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
              value={roomsVRTitle}
              onChange={(e) => setRoomsVRTitle(e.target.value)}
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

          {roomsVR360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={getEmbedUrl(roomsVR360Link)}
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

      {/* Rooms Management */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Rooms Management</h2>
          <button 
            onClick={addRoom} 
            disabled={!isDisplaying}
            className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <FontAwesomeIcon icon={faPlus} />
            Add New Room
          </button>
        </div>

        {/* Filter by Room Type */}
        <div className="mb-6 flex items-center gap-3">
          <label className="text-sm font-medium text-slate-700">Filter by Type:</label>
          <select
            value={roomTypeFilter}
            onChange={(e) => setRoomTypeFilter(e.target.value)}
            className="px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Room Types</option>
            {roomTypes.map(type => (
              <option key={type.value} value={type.value}>{type.label}</option>
            ))}
          </select>
          {roomTypeFilter !== 'all' && (
            <button
              onClick={() => setRoomTypeFilter('all')}
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
          ) : rooms.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p>No rooms yet. Click "Add New Room" to add a room.</p>
            </div>
          ) : (
            rooms
              .filter(room => roomTypeFilter === 'all' || room.room_type === roomTypeFilter)
              .map(room => {
              const hasVR = room.vr_link;
              return (
                <div key={room.id} className="border border-slate-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-md transition-all flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-semibold text-slate-800">
                        {getRoomName(room, 'vi')} {room.translations.en && `/ ${getRoomName(room, 'en')}`}
                      </h3>
                      {hasVR && (
                        <FontAwesomeIcon icon={faVrCardboard} className="text-blue-600" title="Has VR360 Tour" />
                      )}
                    </div>
                    <div className="flex gap-6 text-sm text-slate-600">
                      {room.room_type && (
                        <span>Type: {room.room_type}</span>
                      )}
                      {room.capacity && (
                        <span>Capacity: {room.capacity} guests</span>
                      )}
                      {room.size_sqm && (
                        <span>Size: {room.size_sqm}m²</span>
                      )}
                    </div>
                    {room.booking_url && (
                      <div className="mt-2 text-sm">
                        <a 
                          href={room.booking_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1.5"
                          title={room.booking_url}
                        >
                          <FontAwesomeIcon icon={faLink} className="text-xs" />
                          <span className="truncate max-w-xs">{room.booking_url}</span>
                        </a>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => editRoom(room)}
                      disabled={!isDisplaying}
                      className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faEdit} />
                      Edit
                    </button>
                    <button 
                      onClick={() => deleteRoom(room.id)}
                      disabled={!isDisplaying}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:bg-red-300 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FontAwesomeIcon icon={faTrash} />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Room Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">{editingRoom ? 'Edit Room' : 'Add New Room'}</h3>
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
                        Room Name ({locale.locale_name || locale.locale_code}) *
                      </label>
                      <input
                        type="text"
                        value={formData.translations[locale.locale_code]?.name || ''}
                        onChange={(e) => handleTranslationChange(locale.locale_code, 'name', e.target.value)}
                        disabled={!isDisplaying}
                        placeholder={`Example: Deluxe Room with Sea View`}
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
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                    </div>
                  </div>
                )
              ))}

              {/* Room Details */}
              <div className="mt-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room Code *</label>
                  <input
                    type="text"
                    value={formData.room_code}
                    onChange={(e) => handleInputChange('room_code', e.target.value)}
                    disabled={!isDisplaying}
                    placeholder="Example: D101"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Room Type</label>
                  <select
                    value={formData.room_type}
                    onChange={(e) => handleInputChange('room_type', e.target.value)}
                    disabled={!isDisplaying}
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                  >
                    {roomTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Price Per Night (VND)</label>
                    <input
                      type="number"
                      value={formData.price_per_night}
                      onChange={(e) => handleInputChange('price_per_night', Number(e.target.value))}
                      disabled={!isDisplaying}
                      placeholder="1500000"
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Size (m²)</label>
                    <input
                      type="number"
                      value={formData.size_sqm}
                      onChange={(e) => handleInputChange('size_sqm', Number(e.target.value))}
                      disabled={!isDisplaying}
                      placeholder="35"
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Max Guests</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => handleInputChange('capacity', Number(e.target.value))}
                      disabled={!isDisplaying}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* VR360 Link */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faVrCardboard}/>
                    VR360 Panorama Link
                  </label>
                  <input
                    type="url"
                    value={formData.vr_link}
                    onChange={(e) => handleInputChange('vr_link', e.target.value)}
                    placeholder="https://example.com/room-vr.jpg"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                    <span>Enter the URL to the room's 360° panorama image</span>
                  </p>
                  {formData.vr_link && (
                    <button
                      onClick={handlePreviewVR}
                      type="button"
                      className="mt-2 text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                    >
                      <FontAwesomeIcon icon={faEye} />
                      Preview VR360
                    </button>
                  )}
                </div>

                {/* Booking URL */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faLink}/>
                    Booking URL
                  </label>
                  <input
                    type="url"
                    value={formData.booking_url}
                    onChange={(e) => handleInputChange('booking_url', e.target.value)}
                    placeholder="https://booking.example.com/room-123"
                    className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                    <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                    <span>Enter the direct booking URL for this room</span>
                  </p>
                </div>

                {/* Amenities */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Room Amenities ({availableLocales.find(l => l.locale_code === currentLang)?.locale_name || currentLang})
                  </label>
                  
                  {/* Add new amenity input */}
                  <div className="mb-3">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newAmenity}
                        onChange={(e) => setNewAmenity(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addAmenity()}
                        disabled={!isDisplaying}
                        placeholder="Enter amenity name(s)..."
                        className="flex-1 px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      />
                      <button
                        type="button"
                        onClick={addAmenity}
                        disabled={!isDisplaying}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:bg-green-300 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <FontAwesomeIcon icon={faPlus} />
                        Add
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      💡 Tip: Separate multiple amenities with commas (e.g., "WiFi, Air Conditioner, Bathtub, Hair dryer")
                    </p>
                  </div>
                  
                  {/* List of amenities for current language */}
                  <div className="flex flex-wrap gap-2">
                    {(formData.translations[currentLang]?.amenities || []).map((amenity, index) => (
                      <div 
                        key={index}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-md text-sm"
                      >
                        <FontAwesomeIcon icon={faCheckCircle} className="text-blue-600" />
                        <span className="text-slate-700">{amenity}</span>
                        <button
                          type="button"
                          onClick={() => removeAmenity(amenity)}
                          disabled={!isDisplaying}
                          className="ml-1 text-red-600 hover:text-red-800 disabled:text-red-300 disabled:cursor-not-allowed"
                        >
                          <FontAwesomeIcon icon={faTimes} />
                        </button>
                      </div>
                    ))}
                  </div>
                  
                  {(formData.translations[currentLang]?.amenities || []).length === 0 && (
                    <p className="text-sm text-slate-400 italic">No amenities yet. Enter and add amenity above.</p>
                  )}
                </div>

                {/* Room Images */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                    <FontAwesomeIcon icon={faImages} />
                    Room Images
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
                            alt={`Room ${index + 1}`}
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
                              Delete
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
                onClick={saveRoom}
                disabled={isSaving || !isDisplaying}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <FontAwesomeIcon icon={faSave} />
                {isSaving ? 'Saving...' : (editingRoom ? 'Update' : 'Add Room')}
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
        title="Select Room Images"
        kind="image"
        source="vr_hotel"
        folder="rooms"
        maxFileSize={5 * 1024 * 1024}
        allowMultiple={true}
      />
    </div>
  );
};

export default VRHotelRooms;
