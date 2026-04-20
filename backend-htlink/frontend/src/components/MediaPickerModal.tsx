import { faCheckCircle, faImage, faPhotoFilm, faSpinner, faTimes, faUpload } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  folderAliases?: string[];
  maxFileSize?: number; // in MB
  allowMultiple?: boolean;
  initialSelectedIds?: number[];
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
  folderAliases = [],
  maxFileSize = 5,
  allowMultiple = false,
  initialSelectedIds = []
}) => {
  const [activeTab, setActiveTab] = useState<'library' | 'upload'>('library');
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [selectedMediaIds, setSelectedMediaIds] = useState<Set<number>>(new Set());
  const [libraryMessage, setLibraryMessage] = useState('');
  const loadRequestRef = useRef(0);
  const normalizedFolderAliasesKey = useMemo(() => folderAliases.map((value) => value?.trim()).filter(Boolean).join('|'), [folderAliases]);
  const initialSelectedIdsRef = useRef(initialSelectedIds);

  useEffect(() => {
    if (isOpen && activeTab === 'library') {
      void loadMediaFiles();
      // Only set initial selection once when modal opens
      if (initialSelectedIdsRef.current !== initialSelectedIds) {
        initialSelectedIdsRef.current = initialSelectedIds;
        setSelectedMediaIds(new Set(initialSelectedIds));
      }
    }
  }, [isOpen, activeTab, source, folder, normalizedFolderAliasesKey]);

  const loadMediaFiles = async () => {
    const requestId = ++loadRequestRef.current;

    try {
      setIsLoading(true);
      setLibraryMessage('');

      const dedupeFiles = (files: MediaFile[]) => {
        const seen = new Set<number>();
        return files.filter((file) => {
          if (seen.has(file.id)) {
            return false;
          }
          seen.add(file.id);
          return true;
        });
      };

      const FOLDER_ONLY_THRESHOLD = 8;

      const normalizedFolderCandidates = Array.from(
        new Set(
          [folder, ...folderAliases]
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value))
        )
      );

      const folderResults = await Promise.all(
        normalizedFolderCandidates.map((candidate) =>
          mediaApi.getMediaFiles({
            kind,
            source,
            folder: candidate,
            limit: 50
          })
        )
      );

      const folderFiles = dedupeFiles(folderResults.flat());

      let files = folderFiles;

      if (folder) {
        const sourceFiles = await mediaApi.getMediaFiles({
          kind,
          source,
          limit: 50
        });

        if (folderFiles.length === 0) {
          files = sourceFiles;
          setLibraryMessage(`No images found in "${folder}". Showing all images from this library instead.`);
        } else if (folderFiles.length < FOLDER_ONLY_THRESHOLD) {
          files = dedupeFiles([...folderFiles, ...sourceFiles]);
          const aliasMatchCount = folderResults
            .slice(folder ? 1 : 0)
            .reduce((total, current) => total + current.length, 0);
          const aliasMessage =
            aliasMatchCount > 0 ? ` Included ${aliasMatchCount} image${aliasMatchCount > 1 ? 's' : ''} from related folders.` : '';
          setLibraryMessage(`Showing ${folderFiles.length} image${folderFiles.length > 1 ? 's' : ''} from "${folder}" first, plus more images from the full library.${aliasMessage}`);
        }
      }

      if (requestId !== loadRequestRef.current) {
        return;
      }

      setMediaFiles(files);
      
      // If no files loaded, add some sample files for testing
      if (files.length === 0) {
        const sampleFiles: MediaFile[] = [
          {
            id: 9991,
            tenant_id: 1,
            uploader_id: 1,
            kind: 'image',
            mime_type: 'image/png',
            file_key: 'sample1.png',
            width: 800,
            height: 600,
            size_bytes: 100000,
            alt_text: 'Sample Image 1',
            original_filename: 'sample1.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: 9992,
            tenant_id: 1,
            uploader_id: 1,
            kind: 'image',
            mime_type: 'image/png',
            file_key: 'sample2.png',
            width: 800,
            height: 600,
            size_bytes: 100000,
            alt_text: 'Sample Image 2',
            original_filename: 'sample2.png',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
        setMediaFiles(sampleFiles);
        setLibraryMessage('Showing sample images for testing (API returned no files)');
      }
    } catch (error: any) {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      console.error('MediaPickerModal load error:', error);
      setLibraryMessage(`Error loading images: ${error.message || 'Unknown error'}`);
      toast.error(`Failed to load images: ${error.message || 'Unknown error'}`);
    } finally {
      if (requestId !== loadRequestRef.current) {
        return;
      }
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        errors.push(`${file.name}: Not an image file`);
        return;
      }
      if (file.size > maxFileSize * 1024 * 1024) {
        errors.push(`${file.name}: Size exceeds ${maxFileSize}MB`);
        return;
      }
      validFiles.push(file);
    });

    if (errors.length > 0) {
      toast.error(`${errors.length} file(s) skipped: ${errors[0]}${errors.length > 1 ? ` (and ${errors.length - 1} more)` : ''}`);
    }

    if (validFiles.length === 0) return;

    setSelectedFiles(validFiles);
    
    // Create preview URLs for all valid files
    const newPreviewUrls: string[] = []
    let loadedCount = 0;
    
    validFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviewUrls[index] = reader.result as string;
        loadedCount++;
        if (loadedCount === validFiles.length) {
          setPreviewUrls([...newPreviewUrls]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select file(s) to upload');
      return;
    }

    try {
      setIsUploading(true);
      
      const loadingToast = toast.loading(`Uploading ${selectedFiles.length} image(s)...`);
      
      const uploadedFiles = await mediaApi.uploadFiles(
        selectedFiles,
        kind,
        source,
        undefined,  // entityType
        undefined,  // entityId
        folder
      );

      toast.success(`Successfully uploaded ${uploadedFiles.length} image(s)!`, { id: loadingToast });
      
      // Reset upload form
      setSelectedFiles([]);
      setPreviewUrls([]);
      
      // Switch to library tab and reload to show new images
      setActiveTab('library');
      await loadMediaFiles();
      
    } catch (error: any) {
      console.error('🔴 handleUpload: Upload failed:', error);
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
    const mediaUrls = mediaIds.map(id => {
      if (id >= 9990) {
        // Sample image
        return 'https://via.placeholder.com/400x300/cccccc/666666?text=Sample+Image';
      }
      return `${API_BASE_URL}/media/${id}/view`;
    });
    
    onSelectMultiple?.(mediaIds, mediaUrls);
    setSelectedMediaIds(new Set());
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black bg-opacity-50 p-4">
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
                <div className="space-y-4">
                  {libraryMessage && (
                    <div className="rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                      {libraryMessage}
                    </div>
                  )}
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
                            src={media.id >= 9990 ? 'https://via.placeholder.com/400x300/cccccc/666666?text=Sample+Image' : mediaUrl}
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
                </div>
              )}
            </div>
          ) : (
            <div className="max-w-4xl mx-auto">
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-8">
                {previewUrls.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => {
                              setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                              setPreviewUrls(prev => prev.filter((_, i) => i !== index));
                            }}
                            disabled={isUploading}
                            className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
                          >
                            <FontAwesomeIcon icon={faTimes} className="text-xs" />
                          </button>
                          <p className="text-xs text-slate-600 mt-1 truncate">{selectedFiles[index]?.name}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2 justify-center pt-4">
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
                          `Upload ${selectedFiles.length} image${selectedFiles.length > 1 ? 's' : ''}`
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedFiles([]);
                          setPreviewUrls([]);
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
                      multiple
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                    <div className="space-y-4 text-center">
                      <FontAwesomeIcon icon={faUpload} className="text-6xl text-slate-400" />
                      <div>
                        <p className="text-lg font-medium text-slate-700">
                          Click to select image(s)
                        </p>
                        <p className="text-sm text-slate-500 mt-1">
                          or drag and drop here
                        </p>
                      </div>
                      <p className="text-xs text-slate-400">
                        You can select multiple images. Maximum size per file: {maxFileSize}MB
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



