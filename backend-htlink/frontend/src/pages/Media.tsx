import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  Search, 
  Grid, 
  List, 
  Eye, 
  Download, 
  Trash2, 
  FolderPlus, 
  X, 
  Play, 
  FileText, 
  Image,
  Video,
  File,
  Wifi,
  Car,
  Utensils,
  Waves,
  Sparkles,
  Check,
  MoreVertical
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  type: 'image' | 'video' | 'document';
  size: string;
  sizeBytes: number;
  folder: string;
  preview?: string;
  dimensions?: string;
  uploadDate: string;
  modifiedDate: string;
}

interface IconFile {
  id: string;
  name: string;
  preview: string;
}

const initialMedia: MediaFile[] = [
  {
    id: '1',
    name: 'deluxe-suite.jpg',
    type: 'image',
    size: '2.4 MB',
    sizeBytes: 2.4,
    folder: 'rooms',
    preview: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect width="200" height="160" fill="%23f1f5f9"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="%2364748b"%3EDeluxe Suite%3C/text%3E%3C/svg%3E',
    dimensions: '1920×1080',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  },
  {
    id: '2',
    name: 'pool-tour.mp4',
    type: 'video',
    size: '8.7 MB',
    sizeBytes: 8.7,
    folder: 'facilities',
    dimensions: '1280×720',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  },
  {
    id: '3',
    name: 'restaurant-menu.pdf',
    type: 'document',
    size: '1.2 MB',
    sizeBytes: 1.2,
    folder: 'documents',
    dimensions: '3 pages',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  },
  {
    id: '4',
    name: 'spa-treatment.jpg',
    type: 'image',
    size: '3.1 MB',
    sizeBytes: 3.1,
    folder: 'facilities',
    preview: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect width="200" height="160" fill="%23f3e8ff"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="%237c3aed"%3ESpa Treatment%3C/text%3E%3C/svg%3E',
    dimensions: '1600×900',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  },
  {
    id: '5',
    name: 'gourmet-dish.jpg',
    type: 'image',
    size: '1.8 MB',
    sizeBytes: 1.8,
    folder: 'food',
    preview: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="160" viewBox="0 0 200 160"%3E%3Crect width="200" height="160" fill="%23fef3c7"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="14" fill="%23d97706"%3EGourmet Dish%3C/text%3E%3C/svg%3E',
    dimensions: '1200×800',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  },
  {
    id: '6',
    name: 'hotel-brochure.docx',
    type: 'document',
    size: '5.4 MB',
    sizeBytes: 5.4,
    folder: 'documents',
    dimensions: '12 pages',
    uploadDate: '3 days ago',
    modifiedDate: '2 hours ago'
  }
];

export default function MediaLibrary() {
  const [media, setMedia] = useState<MediaFile[]>(initialMedia);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeFilter, setActiveFilter] = useState<'all' | 'image' | 'video' | 'document'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [folderFilter, setFolderFilter] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentMediaFile, setCurrentMediaFile] = useState<MediaFile | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [icons, setIcons] = useState<IconFile[]>([
    { id: '1', name: 'wifi.png', preview: 'wifi' },
    { id: '2', name: 'pool.svg', preview: 'waves' },
    { id: '3', name: 'restaurant.png', preview: 'utensils' },
    { id: '4', name: 'spa.png', preview: 'sparkles' },
    { id: '5', name: 'parking.svg', preview: 'car' }
  ]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const iconInputRef = useRef<HTMLInputElement>(null);

  const getFilteredMedia = useCallback(() => {
    return media.filter(file => {
      const matchesType = activeFilter === 'all' || file.type === activeFilter;
      const matchesSearch = file.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFolder = !folderFilter || file.folder === folderFilter;
      
      let matchesSize = true;
      if (sizeFilter === 'small') matchesSize = file.sizeBytes < 1;
      else if (sizeFilter === 'medium') matchesSize = file.sizeBytes >= 1 && file.sizeBytes <= 5;
      else if (sizeFilter === 'large') matchesSize = file.sizeBytes > 5;
      
      return matchesType && matchesSearch && matchesFolder && matchesSize;
    });
  }, [media, activeFilter, searchQuery, folderFilter, sizeFilter]);

  const filteredMedia = getFilteredMedia();

  const getFileIcon = (type: MediaFile['type'], size: 'sm' | 'lg' = 'sm') => {
    const iconSize = size === 'sm' ? 'w-8 h-8' : 'w-12 h-12';
    const iconClass = `${iconSize} text-white`;
    
    switch (type) {
      case 'image':
        return (
          <div className={`${iconSize} bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center`}>
            <Image className={iconClass} />
          </div>
        );
      case 'video':
        return (
          <div className={`${iconSize} bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center`}>
            <Video className={iconClass} />
          </div>
        );
      case 'document':
        return (
          <div className={`${iconSize} bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center`}>
            <FileText className={iconClass} />
          </div>
        );
      default:
        return (
          <div className={`${iconSize} bg-gradient-to-br from-gray-500 to-gray-600 rounded-lg flex items-center justify-center`}>
            <File className={iconClass} />
          </div>
        );
    }
  };

  const getIconComponent = (iconType: string) => {
    switch (iconType) {
      case 'wifi': return <Wifi className="w-8 h-8 text-blue-500" />;
      case 'waves': return <Waves className="w-8 h-8 text-cyan-500" />;
      case 'utensils': return <Utensils className="w-8 h-8 text-red-500" />;
      case 'sparkles': return <Sparkles className="w-8 h-8 text-green-500" />;
      case 'car': return <Car className="w-8 h-8 text-amber-500" />;
      default: return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleFileUpload = (files: FileList | null) => {
    if (files && files.length > 0) {
      const fileArray = Array.from(files);
      alert(`Uploading ${fileArray.length} file(s)...\n\nFiles: ${fileArray.map(f => f.name).join(', ')}\n\nIn a real implementation, these would be uploaded to your server and appear in the media library.`);
    }
  };

  const handleIconUpload = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    if (icons.length + fileArray.length > 10) {
      alert("You can only upload up to 10 icons.");
      return;
    }

    fileArray.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newIcon: IconFile = {
            id: Date.now() + Math.random().toString(),
            name: file.name,
            preview: e.target?.result as string
          };
          setIcons(prev => [...prev, newIcon]);
        };
        reader.readAsDataURL(file);
      }
    });
  };

  const handleDrop = useCallback((e: React.DragEvent, type: 'media' | 'icon' = 'media') => {
    e.preventDefault();
    e.stopPropagation();
    
    const files = e.dataTransfer.files;
    if (type === 'media') {
      handleFileUpload(files);
    } else {
      handleIconUpload(files);
    }
  }, [icons.length]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredMedia.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredMedia.map(file => file.id)));
    }
  };

  const viewMedia = (file: MediaFile) => {
    setCurrentMediaFile(file);
    setIsModalOpen(true);
  };

  const downloadMedia = (fileName: string) => {
    alert(`Downloading ${fileName}...\n\nIn a real implementation, this would trigger a file download.`);
  };

  const deleteMedia = (fileId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete ${fileName}? This action cannot be undone.`)) {
      setMedia(prev => prev.filter(file => file.id !== fileId));
      setSelectedFiles(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileId);
        return newSet;
      });
      alert(`${fileName} deleted successfully!`);
    }
  };

  const deleteIcon = (iconId: string, iconName: string) => {
    if (window.confirm(`Do you want to delete "${iconName}"?`)) {
      setIcons(prev => prev.filter(icon => icon.id !== iconId));
      alert(`"${iconName}" has been deleted.`);
    }
  };

  const bulkDelete = () => {
    if (window.confirm(`Permanently delete ${selectedFiles.size} selected files? This action cannot be undone.`)) {
      setMedia(prev => prev.filter(file => !selectedFiles.has(file.id)));
      setSelectedFiles(new Set());
      alert(`${selectedFiles.size} files deleted successfully!`);
    }
  };

  const bulkDownload = () => {
    if (window.confirm(`Download ${selectedFiles.size} selected files as ZIP archive?`)) {
      alert(`Downloading ${selectedFiles.size} files...\n\nIn a real implementation, this would create a ZIP archive with all selected files.`);
      setSelectedFiles(new Set());
    }
  };

  const createFolder = () => {
    const folderName = window.prompt('Enter folder name:');
    if (folderName && folderName.trim()) {
      alert(`Creating folder "${folderName}"...\n\nIn a real implementation, this would create a new folder and update the folder filter options.`);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setCurrentMediaFile(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}


      {/* Main Content */}
      <div className="p-6">
        {/* Title and Description */}
        <div className="mb-6 flex items-center justify-between">
          {/* Text bên trái */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Media Library</h2>
            <p className="text-sm text-gray-600 mt-1">
              Store and organize images, videos, documents for your hotel content
            </p>
          </div>

          {/* Button bên phải */}
          <div className="flex items-center gap-3">
            <button
              onClick={createFolder}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <FolderPlus className="w-4 h-4" />
              New Folder
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files)}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-6">
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{media.length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Files</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">1.2 GB</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Storage Used</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{media.filter(f => f.type === 'image').length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Images</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{media.filter(f => f.type === 'video').length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Videos</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{media.filter(f => f.type === 'document').length}</div>
            <div className="text-xs text-gray-500 uppercase tracking-wide">Documents</div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-gray-200 overflow-x-auto">
          {[
            { key: 'all', label: 'All Files', icon: null, count: media.length },
            { key: 'image', label: 'Images', icon: Image, count: media.filter(f => f.type === 'image').length },
            { key: 'video', label: 'Videos', icon: Video, count: media.filter(f => f.type === 'video').length },
            { key: 'document', label: 'Documents', icon: FileText, count: media.filter(f => f.type === 'document').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveFilter(tab.key as any)}
              className={`flex items-center gap-2 px-5 py-3 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                activeFilter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon && <tab.icon className="w-4 h-4" />}
              {tab.label}
              <span className={`px-2 py-0.5 rounded-full text-xs min-w-[20px] text-center ${
                activeFilter === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Upload Area */}
        <div
          className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 text-center mb-6 cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-50"
          onClick={() => fileInputRef.current?.click()}
          onDrop={(e) => handleDrop(e, 'media')}
          onDragOver={handleDragOver}
        >
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <Upload className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-base font-medium text-gray-900 mb-2">Drag and drop files here</div>
          <div className="text-sm text-gray-600 mb-4">or click to browse your computer</div>
          <div className="text-xs text-gray-500">Supported formats: JPG, PNG, GIF, MP4, MOV, PDF, DOC, DOCX (max 10MB per file)</div>
        </div>

        {/* Media Controls */}
        <div className="bg-white rounded-xl p-5 border border-gray-200 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search media files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={folderFilter}
              onChange={(e) => setFolderFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Folders</option>
              <option value="rooms">Room Photos</option>
              <option value="facilities">Facilities</option>
              <option value="food">Food & Beverage</option>
              <option value="documents">Documents</option>
            </select>

            <select
              value={sizeFilter}
              onChange={(e) => setSizeFilter(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm bg-white min-w-[120px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sizes</option>
              <option value="small">Small (&lt; 1MB)</option>
              <option value="medium">Medium (1-5MB)</option>
              <option value="large">Large (&gt; 5MB)</option>
            </select>

            <div className="flex bg-gray-100 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === 'list'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedFiles.size > 0 && (
          <div className="bg-blue-600 text-white px-5 py-3 rounded-lg flex items-center justify-between mb-5">
            <span className="font-medium">
              {selectedFiles.size} file{selectedFiles.size > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={bulkDownload}
                className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-md text-xs font-medium hover:bg-white/30 transition-colors"
              >
                <Download className="w-3 h-3 inline mr-1" />
                Download
              </button>
              <button
                onClick={bulkDelete}
                className="px-3 py-1.5 bg-white/20 border border-white/30 rounded-md text-xs font-medium hover:bg-white/30 transition-colors"
              >
                <Trash2 className="w-3 h-3 inline mr-1" />
                Delete
              </button>
            </div>
          </div>
        )}

        {/* Media Grid/List */}
        {filteredMedia.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-15 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <Image className="w-6 h-6 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No media files found</h3>
            <p className="text-gray-600 mb-5">Upload your first files to get started</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Upload Files
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {filteredMedia.map(file => (
              <div
                key={file.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer relative"
              >
                {/* Checkbox */}
                <div className="absolute top-2 left-2 z-10">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>

                {/* Actions */}
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 rounded-md p-1 flex gap-1">
                  <button
                    onClick={() => viewMedia(file)}
                    className="p-1 text-white hover:bg-white/20 rounded"
                    title="View"
                  >
                    <Eye className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => downloadMedia(file.name)}
                    className="p-1 text-white hover:bg-white/20 rounded"
                    title="Download"
                  >
                    <Download className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => deleteMedia(file.id, file.name)}
                    className="p-1 text-white hover:bg-white/20 rounded"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>

                {/* Preview */}
                <div className="w-full h-40 bg-gray-50 flex items-center justify-center overflow-hidden">
                  {file.preview ? (
                    <img
                      src={file.preview}
                      alt={file.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    getFileIcon(file.type, 'lg')
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  <div className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                    {file.name}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {file.type.toUpperCase()} • {file.dimensions}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{file.size}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* List Header */}
            <div className="bg-gray-50 border-b border-gray-200 px-6 py-4 grid grid-cols-6 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide">
              <div>
                <input
                  type="checkbox"
                  checked={selectedFiles.size === filteredMedia.length}
                  onChange={selectAllFiles}
                  className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                />
              </div>
              <div className="col-span-2">Name</div>
              <div>Type</div>
              <div>Size</div>
              <div>Actions</div>
            </div>

            {/* List Rows */}
            {filteredMedia.map(file => (
              <div
                key={file.id}
                className="px-6 py-4 border-b border-gray-100 last:border-b-0 grid grid-cols-6 gap-4 items-center hover:bg-gray-50 transition-colors"
              >
                <div>
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="w-4 h-4 text-blue-600 bg-white border-gray-300 rounded focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-2 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-gray-100 flex items-center justify-center overflow-hidden">
                    {file.preview ? (
                      <img src={file.preview} alt={file.name} className="w-full h-full object-cover" />
                    ) : (
                      getFileIcon(file.type, 'sm')
                    )}
                  </div>
                  <div>
                    <div className="font-medium text-sm text-gray-900 truncate" title={file.name}>
                      {file.name}
                    </div>
                    <div className="text-xs text-gray-500">{file.folder}</div>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{file.type.toUpperCase()}</div>
                <div className="text-sm text-gray-600">{file.size}</div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => viewMedia(file)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadMedia(file.name)}
                    className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Icon Library Section */}
        <div className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Icon Library <span className="text-sm font-normal text-gray-500">(max 10)</span>
          </h2>
          
          <div className="flex flex-wrap gap-4 mb-6">
            {icons.map(icon => (
              <div
                key={icon.id}
                className="w-20 text-center cursor-pointer group"
                onClick={() => deleteIcon(icon.id, icon.name)}
              >
                <div className="w-16 h-16 mx-auto border border-gray-200 rounded-lg bg-gray-50 flex items-center justify-center transition-all group-hover:bg-red-50 group-hover:border-red-200 group-hover:-translate-y-0.5">
                  {typeof icon.preview === 'string' && icon.preview.startsWith('data:') ? (
                    <img src={icon.preview} alt={icon.name} className="w-8 h-8 object-contain" />
                  ) : (
                    getIconComponent(icon.preview)
                  )}
                </div>
                <div className="text-xs text-gray-700 mt-1.5 break-all" title={icon.name}>
                  {icon.name}
                </div>
              </div>
            ))}
          </div>

          {/* Icon Upload Area */}
          <div
            className="bg-white border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer transition-all hover:border-blue-400 hover:bg-gray-50"
            onClick={() => iconInputRef.current?.click()}
            onDrop={(e) => handleDrop(e, 'icon')}
            onDragOver={handleDragOver}
          >
            <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
              <Upload className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-base font-medium text-gray-900 mb-2">Drag & drop hotel icons here</div>
            <div className="text-sm text-gray-600 mb-4">or click to browse your computer</div>
            <div className="text-xs text-gray-500">Max 10 icons • Supported: PNG, JPG, SVG • Recommended size: 64×64</div>
          </div>
          
          <input
            ref={iconInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => handleIconUpload(e.target.files)}
          />
        </div>
      </div>

      {/* Media Preview Modal */}
      {isModalOpen && currentMediaFile && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              closeModal();
            }
          }}
        >
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-semibold text-gray-900">{currentMediaFile.name}</h3>
              <button
                onClick={closeModal}
                className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Preview */}
            <div className="text-center mb-5">
              {currentMediaFile.preview ? (
                <img
                  src={currentMediaFile.preview}
                  alt={currentMediaFile.name}
                  className="max-w-full max-h-96 mx-auto rounded-lg shadow-lg"
                />
              ) : currentMediaFile.type === 'video' ? (
                <div className="bg-gray-100 p-10 rounded-lg">
                  <Play className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Video preview not available</p>
                </div>
              ) : (
                <div className="bg-gray-100 p-10 rounded-lg">
                  <FileText className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Document preview not available</p>
                </div>
              )}
            </div>

            {/* Modal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File Name</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.name}</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File Type</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.type.charAt(0).toUpperCase() + currentMediaFile.type.slice(1)}</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">File Size</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.size}</div>
                </div>
              </div>
              <div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Dimensions</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.dimensions}</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Upload Date</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.uploadDate}</div>
                </div>
                <div className="mb-4">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Last Modified</div>
                  <div className="text-sm text-gray-900">{currentMediaFile.modifiedDate}</div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 pt-5 border-t border-gray-200">
              <button
                onClick={() => downloadMedia(currentMediaFile.name)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download
              </button>
              <button
                onClick={() => {
                  alert(`Editing details for ${currentMediaFile.name}...\n\nThis would open a form to edit file name, alt text, description, etc.`);
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FileText className="w-4 h-4" />
                Edit Details
              </button>
              <button
                onClick={() => {
                  alert(`Using ${currentMediaFile.name} in content...\n\nThis would insert the media file into the current post or content editor.`);
                  closeModal();
                }}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Check className="w-4 h-4" />
                Use in Content
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}