import type { DragEndEvent } from '@dnd-kit/core';
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  faEdit,
  faFlag,
  faGripVertical,
  faImage,
  faInfoCircle,
  faMapMarkerAlt,
  faPhone,
  faPlus,
  faSave,
  faTimes,
  faTrash,
  faVrCardboard,
  faEye,
  faPlay,
  faCircleInfo
} from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { Languages } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import MediaPickerModal from '../../components/MediaPickerModal';
import TranslationModal from '../../components/TranslationModal';
import { cafeBranchesApi, cafeLanguagesApi, cafeSettingsApi, type Branch, type BranchCreate, type BranchTranslation, type BranchUpdate } from '../../services/cafeApi';
import { getApiBaseUrl } from '../../utils/api';

// Sortable Branch Item Component
interface SortableBranchItemProps {
  branch: Branch;
  onEdit: (branch: Branch) => void;
  onTranslate: (branch: Branch) => void;
  onDelete: (id: number) => void;
  imageUrls: Map<number, string>;
}

const SortableBranchItem: React.FC<SortableBranchItemProps> = ({ branch, onEdit, onTranslate, onDelete, imageUrls }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: branch.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const imageUrl = branch.image_media_id ? imageUrls.get(branch.image_media_id) : null;

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
      
      {imageUrl && (
        <img 
          src={imageUrl} 
          alt={branch.name_vi} 
          className="w-20 h-20 object-cover rounded-md"
        />
      )}
      
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600" />
          <h3 className="text-lg font-semibold text-slate-800">
            {branch.name_vi} {branch.name_en && `/ ${branch.name_en}`}
          </h3>
          {!branch.is_active && (
            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded">Inactive</span>
          )}
        </div>
        <div className="text-sm text-slate-600 space-y-1">
          {branch.address_vi && (
            <div className="flex items-start gap-2">
              <FontAwesomeIcon icon={faMapMarkerAlt} className="text-xs mt-1" />
              <span>{branch.address_vi}</span>
            </div>
          )}
          {branch.phone && (
            <div className="flex items-center gap-2">
              <FontAwesomeIcon icon={faPhone} className="text-xs" />
              <span>{branch.phone}</span>
            </div>
          )}
          {branch.opening_hours_vi && (
            <div className="text-slate-500">{branch.opening_hours_vi}</div>
          )}
        </div>
        <div className="mt-2">
          <span className="text-xs font-medium text-blue-600">Order: {branch.display_order}</span>
        </div>
      </div>
      
      <div className="flex gap-3">
        <button 
          onClick={() => onTranslate(branch)}
          className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center gap-2"
          title="Edit Translations"
        >
          <Languages className="w-4 h-4" />
          Translations
        </button>
        <button 
          onClick={() => onEdit(branch)}
          className="px-4 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faEdit} />
          Edit
        </button>
        <button 
          onClick={() => onDelete(branch.id)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <FontAwesomeIcon icon={faTrash} />
          Delete
        </button>
      </div>
    </div>
  );
};

const CafeBranches: React.FC = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentLang, setCurrentLang] = useState<'vi' | 'en'>('vi');
  const [imageUrls, setImageUrls] = useState<Map<number, string>>(new Map());
  
  // Media picker state
  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);
  const [selectedImageId, setSelectedImageId] = useState<number | null>(null);
  const [previewImageUrl, setPreviewImageUrl] = useState<string>('');

  // Translation state
  const [translationModalVisible, setTranslationModalVisible] = useState(false);
  const [translatingBranch, setTranslatingBranch] = useState<Branch | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<string[]>(['vi', 'en']);
  // Display status state
  const [isDisplaying, setIsDisplaying] = useState(true);
  const [savingDisplayStatus, setSavingDisplayStatus] = useState(false);
  const [vr360Link, setVr360Link] = useState('');
  const [vrTitle, setVrTitle] = useState('');
  const [savingVR, setSavingVR] = useState(false);
  const [formData, setFormData] = useState<{
    name_vi: string;
    name_en: string;
    address_vi: string;
    address_en: string;
    phone: string;
    email: string;
    opening_hours_vi: string;
    opening_hours_en: string;
    map_latitude?: number;
    map_longitude?: number;
    google_map_url: string;
    image_media_id?: number;
    is_active: boolean;
  }>({
    name_vi: '',
    name_en: '',
    address_vi: '',
    address_en: '',
    phone: '',
    email: '',
    opening_hours_vi: '',
    opening_hours_en: '',
    google_map_url: '',
    is_active: true,
  });

  useEffect(() => {
    loadBranches();
    loadLanguageSettings();
  }, []);

  const loadLanguageSettings = async () => {
    try {
      const langs = await cafeLanguagesApi.getLanguageCodes();
      setSupportedLanguages(langs);
      
      // Load display status
      const settings = await cafeSettingsApi.getSettings();
      const displayStatus = settings.settings_json?.branches_is_displaying ?? true;
      setIsDisplaying(displayStatus);
      setVr360Link(settings.settings_json?.branches_vr360_link || '');
      setVrTitle(settings.settings_json?.branches_vr_title || '');
    } catch (error) {
      console.error('Error loading languages:', error);
    }
  };

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const data = await cafeBranchesApi.getBranches();
      setBranches(data);
      
      // Load images for branches that have them
      const API_BASE_URL = getApiBaseUrl();
      const urlMap = new Map<number, string>();
      data.forEach(branch => {
        if (branch.image_media_id) {
          urlMap.set(branch.image_media_id, `${API_BASE_URL}/media/${branch.image_media_id}/view`);
        }
      });
      setImageUrls(urlMap);
    } catch (error) {
      console.error('Error loading branches:', error);
      toast.error('Failed to load branches');
    } finally {
      setIsLoading(false);
    }
  };

  const convertToEmbedUrl = (url: string): string => {
    if (!url) return url;
    const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/;
    const match = url.match(youtubeRegex);
    if (match && match[1]) {
      return `https://www.youtube.com/embed/${match[1]}`;
    }
    return url;
  };

  const handleVR360Change = async (field: 'link' | 'title', value: string) => {
    try {
      setSavingVR(true);
      const currentSettings = await cafeSettingsApi.getSettings();
      const updates = { ...currentSettings.settings_json };
      
      if (field === 'link') {
        const embedUrl = convertToEmbedUrl(value);
        updates.branches_vr360_link = embedUrl;
        setVr360Link(embedUrl);
      } else {
        updates.branches_vr_title = value;
        setVrTitle(value);
      }
      
      await cafeSettingsApi.updateSettings({ settings_json: updates });
      toast.success('VR360 settings saved');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to save VR360 settings');
    } finally {
      setSavingVR(false);
    }
  };

  const handleAdd = () => {
    setEditingBranch(null);
    setSelectedImageId(null);
    setPreviewImageUrl('');
    setFormData({
      name_vi: '',
      name_en: '',
      address_vi: '',
      address_en: '',
      phone: '',
      email: '',
      opening_hours_vi: '',
      opening_hours_en: '',
      google_map_url: '',
      is_active: true,
    });
    setShowModal(true);
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name_vi: branch.name_vi || '',
      name_en: branch.name_en || '',
      address_vi: branch.address_vi || '',
      address_en: branch.address_en || '',
      phone: branch.phone || '',
      email: branch.email || '',
      opening_hours_vi: branch.opening_hours_vi || '',
      opening_hours_en: branch.opening_hours_en || '',
      map_latitude: branch.map_latitude,
      map_longitude: branch.map_longitude,
      google_map_url: branch.google_map_url || '',
      image_media_id: branch.image_media_id,
      is_active: branch.is_active,
    });
    
    if (branch.image_media_id) {
      setSelectedImageId(branch.image_media_id);
      const API_BASE_URL = getApiBaseUrl();
      setPreviewImageUrl(`${API_BASE_URL}/media/${branch.image_media_id}/view`);
    } else {
      setSelectedImageId(null);
      setPreviewImageUrl('');
    }
    
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this branch?')) return;
    
    try {
      await cafeBranchesApi.deleteBranch(id);
      toast.success('Branch deleted successfully');
      loadBranches();
    } catch (error) {
      console.error('Error deleting branch:', error);
      toast.error('Failed to delete branch');
    }
  };

  const handleEditBranchTranslations = (branch: Branch) => {
    setTranslatingBranch(branch);
    setTranslationModalVisible(true);
  };

  const handleSaveTranslations = async (translations: Record<string, Record<string, string>>) => {
    if (!translatingBranch) return;

    try {
      const translationArray: BranchTranslation[] = Object.entries(translations).map(([locale, data]) => ({
        locale,
        name: data.name || '',
        address: data.address || '',
        description: data.description || '',
      }));

      await cafeBranchesApi.updateBranchTranslations(translatingBranch.id, translationArray);
      toast.success('Translations updated successfully');
      setTranslationModalVisible(false);
      setTranslatingBranch(null);
      loadBranches();
    } catch (error) {
      console.error('Error updating translations:', error);
      toast.error('Failed to update translations');
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name_vi.trim()) {
      toast.error('Please enter branch name (Vietnamese)');
      return;
    }
    
    try {
      setIsSaving(true);
      
      const payload: BranchCreate | BranchUpdate = {
        name_vi: formData.name_vi,
        name_en: formData.name_en || undefined,
        address_vi: formData.address_vi || undefined,
        address_en: formData.address_en || undefined,
        phone: formData.phone || undefined,
        email: formData.email || undefined,
        opening_hours_vi: formData.opening_hours_vi || undefined,
        opening_hours_en: formData.opening_hours_en || undefined,
        map_latitude: formData.map_latitude,
        map_longitude: formData.map_longitude,
        google_map_url: formData.google_map_url || undefined,
        image_media_id: selectedImageId || undefined,
        is_active: formData.is_active,
      };

      if (editingBranch) {
        await cafeBranchesApi.updateBranch(editingBranch.id, payload as BranchUpdate);
        toast.success('Branch updated successfully');
      } else {
        await cafeBranchesApi.createBranch(payload as BranchCreate);
        toast.success('Branch created successfully');
      }

      setShowModal(false);
      loadBranches();
    } catch (error: any) {
      console.error('Error saving branch:', error);
      toast.error(error.response?.data?.detail || 'Failed to save branch');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;
    
    const oldIndex = branches.findIndex((b) => b.id === active.id);
    const newIndex = branches.findIndex((b) => b.id === over.id);
    
    // Optimistic UI update
    const newBranches = [...branches];
    const [movedBranch] = newBranches.splice(oldIndex, 1);
    newBranches.splice(newIndex, 0, movedBranch);
    
    // Update display_order
    const updatedBranches = newBranches.map((branch, index) => ({
      ...branch,
      display_order: index + 1,
    }));
    
    setBranches(updatedBranches);
    
    // Update on server
    try {
      const branchIds = updatedBranches.map(b => b.id);
      await cafeBranchesApi.reorderBranches(branchIds);
      toast.success('Branch order updated');
    } catch (error) {
      console.error('Error reordering branches:', error);
      toast.error('Failed to update order');
      loadBranches(); // Reload on error
    }
  };

  const handleMediaSelect = async (mediaId: number, mediaUrl: string) => {
    setSelectedImageId(mediaId);
    setPreviewImageUrl(mediaUrl);
    setMediaPickerOpen(false);
  };

  const handleRemoveImage = () => {
    setSelectedImageId(null);
    setPreviewImageUrl('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <FontAwesomeIcon icon={faFlag} className="text-4xl text-blue-600 animate-pulse mb-4" />
          <p className="text-lg font-semibold text-gray-700">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Display Status */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="border-b border-slate-200 pb-4 mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">Display Status - Branches Section</h2>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${isDisplaying ? 'text-green-600' : 'text-slate-500'}`}>
              {isDisplaying ? 'Displaying' : 'Hidden'}
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={isDisplaying}
                onChange={async (e) => {
                  const newValue = e.target.checked;
                  try {
                    setSavingDisplayStatus(true);
                    const currentSettings = await cafeSettingsApi.getSettings();
                    await cafeSettingsApi.updateSettings({
                      settings_json: {
                        ...currentSettings.settings_json,
                        branches_is_displaying: newValue
                      }
                    });
                    setIsDisplaying(newValue);
                    toast.success(newValue ? 'Branches section enabled' : 'Branches section disabled');
                  } catch (error: any) {
                    toast.error(error.response?.data?.detail || 'Failed to update display status');
                  } finally {
                    setSavingDisplayStatus(false);
                  }
                }}
                disabled={savingDisplayStatus}
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"></div>
            </label>
          </div>
        </div>
        
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-blue-600 text-xl mt-0.5" />
          <span className="text-blue-800 text-sm">
            When display is turned off, the "Branches" section will not appear on the website. You can still edit and manage branch locations.
          </span>
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
              Link VR360 Panorama / YouTube Video
            </label>
            <input
              type="url"
              placeholder="https://example.com/panorama.jpg or https://youtube.com/watch?v=..."
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vr360Link}
              onChange={(e) => handleVR360Change('link', e.target.value)}
              disabled={savingVR}
            />
            <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
              <FontAwesomeIcon icon={faCircleInfo} className="mt-0.5" />
              <span>
                Enter the URL to a 360° panorama image (equirectangular JPG, min 4096x2048px) or YouTube video URL
              </span>
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">VR Tour Title</label>
            <input
              type="text"
              placeholder="Enter VR tour title"
              className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
              value={vrTitle}
              onChange={(e) => handleVR360Change('title', e.target.value)}
              disabled={savingVR}
            />
          </div>
          
          {vr360Link && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <FontAwesomeIcon icon={faEye} className="text-slate-600" />
                <h3 className="text-sm font-medium text-slate-700">VR360 Preview</h3>
              </div>
              
              <div className="border-2 border-slate-300 rounded-lg overflow-hidden bg-slate-50">
                <div className="relative w-full" style={{ height: '500px' }}>
                  <iframe
                    src={vr360Link}
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
                  onClick={() => window.open(vr360Link, '_blank')}
                  className="px-6 py-2 bg-slate-600 text-white rounded-md hover:bg-slate-700 transition-colors inline-flex items-center gap-2"
                >
                  <FontAwesomeIcon icon={faPlay} />
                  View Fullscreen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Branch Management</h1>
          <p className="text-slate-600 mt-2">Manage your cafe locations and details</p>
        </div>
        <button
          onClick={handleAdd}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 shadow-md"
        >
          <FontAwesomeIcon icon={faPlus} />
          Add Branch
        </button>
      </div>

      {/* Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <FontAwesomeIcon icon={faInfoCircle} className="text-blue-600 mt-1" />
        <div className="text-sm text-blue-800">
          <strong>Drag & Drop to Reorder:</strong> Drag branches to change their display order on the website.
          The order updates automatically.
        </div>
      </div>

      {/* Branches List - Drag & Drop */}
      {branches.length > 0 ? (
        <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={branches.map(b => b.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-3">
              {branches.map((branch) => (
                <SortableBranchItem
                  key={branch.id}
                  branch={branch}
                  onEdit={handleEdit}
                  onTranslate={handleEditBranchTranslations}
                  onDelete={handleDelete}
                  imageUrls={imageUrls}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border-2 border-dashed border-slate-300">
          <FontAwesomeIcon icon={faMapMarkerAlt} className="text-5xl text-slate-400 mb-4" />
          <p className="text-lg text-slate-600">No branches found</p>
          <p className="text-sm text-slate-500 mt-2">Click "Add Branch" to create your first branch</p>
        </div>
      )}

      {/* Edit/Add Modal - VR Hotel Design */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            {/* Sticky Header */}
            <div className="border-b border-slate-200 p-6 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-xl font-bold text-slate-800">
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 text-2xl"
                type="button"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Content */}
              <div className="p-6">
                {/* Language Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setCurrentLang('vi')}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentLang === 'vi'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFlag} />
                    VI
                  </button>
                  <button
                    type="button"
                    onClick={() => setCurrentLang('en')}
                    className={`px-4 py-2 font-medium flex items-center gap-2 border-b-2 transition-colors ${
                      currentLang === 'en'
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-slate-600 hover:text-slate-800'
                    }`}
                  >
                    <FontAwesomeIcon icon={faFlag} />
                    EN
                  </button>
                </div>

                {/* Translation Section */}
                <div className="space-y-4">
                  {currentLang === 'vi' ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Branch Name (vi) *
                        </label>
                        <input
                          type="text"
                          value={formData.name_vi}
                          onChange={(e) => setFormData({ ...formData, name_vi: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          placeholder="e.g., DB Cafe - Trung Tâm"
                          required
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Address (vi)
                        </label>
                        <textarea
                          value={formData.address_vi}
                          onChange={(e) => setFormData({ ...formData, address_vi: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          rows={3}
                          placeholder="123 Đường Nguyễn Huệ, Quận 1, TP.HCM"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Opening Hours (vi)
                        </label>
                        <input
                          type="text"
                          value={formData.opening_hours_vi}
                          onChange={(e) => setFormData({ ...formData, opening_hours_vi: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          placeholder="Thứ 2-6: 7:00-22:00, Thứ 7-CN: 8:00-23:00"
                          disabled={isSaving}
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Branch Name (en)
                        </label>
                        <input
                          type="text"
                          value={formData.name_en}
                          onChange={(e) => setFormData({ ...formData, name_en: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          placeholder="e.g., DB Cafe - Downtown"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Address (en)
                        </label>
                        <textarea
                          value={formData.address_en}
                          onChange={(e) => setFormData({ ...formData, address_en: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          rows={3}
                          placeholder="123 Nguyen Hue Street, District 1, HCMC"
                          disabled={isSaving}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Opening Hours (en)
                        </label>
                        <input
                          type="text"
                          value={formData.opening_hours_en}
                          onChange={(e) => setFormData({ ...formData, opening_hours_en: e.target.value })}
                          className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                          placeholder="Mon-Fri: 7:00-22:00, Sat-Sun: 8:00-23:00"
                          disabled={isSaving}
                        />
                      </div>
                    </>
                  )}
                </div>

                {/* Settings Section */}
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                        placeholder="+84 28 1234 5678"
                        disabled={isSaving}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                        placeholder="branch@dbcafe.vn"
                        disabled={isSaving}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <FontAwesomeIcon icon={faMapMarkerAlt} />
                      Google Maps URL
                    </label>
                    <input
                      type="url"
                      value={formData.google_map_url}
                      onChange={(e) => setFormData({ ...formData, google_map_url: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:cursor-not-allowed"
                      placeholder="https://maps.google.com/..."
                      disabled={isSaving}
                    />
                    <p className="mt-2 text-sm text-slate-500 flex items-start gap-2">
                      <FontAwesomeIcon icon={faInfoCircle} className="mt-0.5" />
                      <span>Enter the Google Maps URL for this branch location</span>
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
                      <FontAwesomeIcon icon={faImage} />
                      Branch Image
                    </label>
                    
                    {previewImageUrl ? (
                      <div className="mt-4 grid grid-cols-4 gap-3">
                        <div className="relative group">
                          <img 
                            src={previewImageUrl} 
                            alt="Branch" 
                            className="w-full h-24 object-cover rounded-md border-2 border-slate-200"
                          />
                          <div className="absolute top-1 left-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                            Primary
                          </div>
                          <div className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-md flex items-center justify-center gap-2">
                            <button
                              type="button"
                              onClick={handleRemoveImage}
                              className="px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700"
                              disabled={isSaving}
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="mb-3">
                        <button
                          type="button"
                          onClick={() => setMediaPickerOpen(true)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                          disabled={isSaving}
                        >
                          <FontAwesomeIcon icon={faImage} />
                          Select Image
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Sticky Footer */}
              <div className="border-t border-slate-200 p-6 bg-slate-50 sticky bottom-0">
                <div className="flex items-center justify-between mb-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      disabled={isSaving}
                    />
                    <span className="text-sm font-medium text-slate-700">
                      Active (Show on website)
                    </span>
                  </label>
                </div>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 border border-slate-600 text-slate-600 rounded-md hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    disabled={isSaving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <FontAwesomeIcon icon={faSave} />
                    {isSaving ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      <TranslationModal
        visible={translationModalVisible}
        onClose={() => {
          setTranslationModalVisible(false);
          setTranslatingBranch(null);
        }}
        onSave={handleSaveTranslations}
        fields={[
          { key: 'name', label: 'Branch Name', type: 'input', required: true },
          { key: 'address', label: 'Address', type: 'textarea', rows: 2 },
          { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        ]}
        initialData={
          translatingBranch?.translations?.reduce((acc, t) => {
            acc[t.locale] = {
              name: t.name || '',
              address: t.address || '',
              description: t.description || '',
            };
            return acc;
          }, {} as Record<string, Record<string, string>>)
        }
        supportedLanguages={supportedLanguages}
        title="Edit Branch Translations"
      />

      {/* Media Picker Modal */}
      <MediaPickerModal
        isOpen={mediaPickerOpen}
        onClose={() => setMediaPickerOpen(false)}
        onSelect={handleMediaSelect}
        title="Select Branch Image"
        kind="image"
        source="cafe"
        folder="branches"
      />
    </div>
  );
};

export default CafeBranches;
