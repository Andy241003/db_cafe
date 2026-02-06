import { faCheckCircle, faImage, faPhotoFilm, faSpinner, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { mediaApi, type MediaFile } from '../services/mediaApi';
import { getApiBaseUrl } from '../utils/api';

interface MediaPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect?: (mediaId: number, mediaUrl: string) => void;
  onSelectMultiple?: (mediaIds: number[], mediaUrls: string[]) => void;
  title?: string;
  kind?: 'image' | 'video' | 'file';
  source?: string;
  folder?: string;
  maxFileSize?: number; // in MB
  allowMultiple?: boolean;
}

const MediaPickerModal: React.FC<MediaPickerModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  onSelectMultiple,
  title = 'Select Image',
  kind = 'image',
  source,
  folder,
  maxFileSize = 5,
  allowMultiple = false
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      loadMediaFiles();
      setSelectedMediaIds(new Set()); // Reset selection when opening
    }
  }, [isOpen, activeTab, source, folder]);

  const loadMediaFiles = async () => {
    try {
      setIsLoading(true);
      
      // Try with folder filter first
      let files = await mediaApi.getMediaFiles({
        kind,
        source,
        folder,
        limit: 50
      });
      
      // If no files found with folder filter, try without folder (show all from source)
      if (files.length === 0 && folder) {
        files = await mediaApi.getMediaFiles({
          kind,
          source,
          limit: 50
        });
      }
      
      setMediaFiles(files);
    } catch (error: any) {
      console.error('Failed to load media files:', error);
      toast.error('Failed to load media files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size
    if (file.size > maxFileSize * 1024 * 1024) {
      toast.error(`File size must be less than ${maxFileSize}MB`);
      return;
    }

    setSelectedFile(file);
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file to upload');
      return;
    }

    try {
      setIsUploading(true);
      
      const uploadedFile = await mediaApi.uploadFile(
        selectedFile,
        kind,
        undefined,  // altText
        source,     // source
        undefined,  // entityType
        undefined,  // entityId
        folder      // folder
      );

      toast.success(`Upload successful! ID: ${uploadedFile.id}`);
      
      // Reset upload form
      setSelectedFile(null);
      setPreviewUrl('');
      
      // Switch to library tab and reload to show new image
      setActiveTab('library');
      await loadMediaFiles(); // Reload the list
      
      toast.success('Image added to library!');
      
    } catch (error: any) {
      console.error('❌ Upload failed:', error);
      toast.error(`Upload failed: ${error.response?.data?.detail || error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const toggleMediaSelection = (mediaId: number) => {
    setSelectedMediaIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(mediaId)) {
        newSet.delete(mediaId);
      } else {
        newSet.add(mediaId);
      }
      return newSet;
    });
  };

  const handleSelectFromLibrary = (media: MediaFile) => {
    if (allowMultiple) {
      // Toggle selection in multi-select mode
      toggleMediaSelection(media.id);
    } else {
      // Single select - immediately select and close
      const API_BASE_URL = getApiBaseUrl();
      const mediaUrl = `${API_BASE_URL}/media/${media.id}/view`;
      onSelect?.(media.id, mediaUrl);
      onClose();
    }
  };

  const handleConfirmMultipleSelection = () => {
    if (selectedMediaIds.size === 0) {
      toast.error('Please select at least one image');
      return;
    }

    const API_BASE_URL = getApiBaseUrl();
    const mediaIds = Array.from(selectedMediaIds);
    const mediaUrls = mediaIds.map(id => `${API_BASE_URL}/media/${id}/view`);
    
    onSelectMultiple?.(mediaIds, mediaUrls);
    setSelectedMediaIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-6 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <FontAwesomeIcon icon={faTimes} className="text-2xl" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 flex border-b border-slate-200 bg-white">
          <button
            onClick={() => setActiveTab('library')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'library'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faPhotoFilm} className="mr-2" />
            Library
            {activeTab === 'library' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 'upload'
                ? 'text-blue-600 bg-blue-50'
                : 'text-slate-600 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <FontAwesomeIcon icon={faUpload} className="mr-2" />
            Upload New
            {activeTab === 'upload' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600"></div>
            )}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'library' ? (
            <div>
              {isLoading ? (
                <div className="flex items-center justify-center h-64">
                  <FontAwesomeIcon icon={faSpinner} spin className="text-4xl text-blue-600" />
                </div>
              ) : mediaFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-slate-400">
                  <FontAwesomeIcon icon={faImage} className="text-6xl mb-4" />
                  <p>No images in library</p>
                  <p className="text-sm mt-2">Upload new images to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {mediaFiles.map((media) => {
                    const API_BASE_URL = getApiBaseUrl();
                    const mediaUrl = `${API_BASE_URL}/media/${media.id}/view`;
                    const isSelected = selectedMediaIds.has(media.id);
                    
                    return (
                      <div
                        key={media.id}
                        onClick={() => handleSelectFromLibrary(media)}
                        className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition-all aspect-square ${
                          isSelected 
                            ? 'border-blue-600 ring-2 ring-blue-300' 
                            : 'border-slate-200 hover:border-blue-500'
                        }`}
                      >
                        <img
                          src={mediaUrl}
                          alt={media.original_filename || `Image ${media.id}`}
                          className="w-full h-full object-cover"
                        />
                        
                        {/* Multi-select checkbox */}
                        {allowMultiple && (
                          <div className="absolute top-2 right-2 z-10">
                            <div className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white bg-opacity-70 border-2 border-slate-300'
                            }`}>
                              {isSelected && (
                                <FontAwesomeIcon icon={faCheckCircle} className="text-sm" />
                              )}
                            </div>
                          </div>
                        )}
                        
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-opacity flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                            {allowMultiple 
                              ? (isSelected ? 'Deselect' : 'Select')
                              : 'Select this image'
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-xl mx-auto">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
                {previewUrl ? (
                  <div className="space-y-4">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <p className="text-sm text-slate-600">{selectedFile?.name}</p>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={handleUpload}
                        disabled={isUploading}
                        className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isUploading ? (
                          <>
                            <FontAwesomeIcon icon={faSpinner} spin className="mr-2" />
                            Uploading...
                          </>
                        ) : (
                          'Upload this image'
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFile(null);
                          setPreviewUrl('');
                        }}
                        disabled={isUploading}
                        className="px-6 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-4">
                      <FontAwesomeIcon icon={faUpload} className="text-6xl text-slate-400" />
                      <div>
                        <p className="text-lg font-medium text-slate-700">
                          Click to select image
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          or drag and drop here
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        Maximum size: {maxFileSize}MB
                      </p>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer for multi-select */}
        {allowMultiple && activeTab === 'library' && selectedMediaIds.size > 0 && (
          <div className="flex-shrink-0 border-t border-slate-200 p-4 bg-slate-50">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">
                {selectedMediaIds.size} image{selectedMediaIds.size > 1 ? 's' : ''} selected
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedMediaIds(new Set())}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-white transition-colors"
                >
                  Clear
                </button>
                <button
                  onClick={handleConfirmMultipleSelection}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                >
                  Select {selectedMediaIds.size} image{selectedMediaIds.size > 1 ? 's' : ''}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MediaPickerModal;
