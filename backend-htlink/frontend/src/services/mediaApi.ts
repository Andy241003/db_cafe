// src/services/mediaApi.ts
import axios from 'axios';

// Use the same API client setup as other services
const API_BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api/v1` 
  : 'http://localhost:8000/api/v1';

export const mediaApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Longer timeout for file uploads
});

// Auto-detect tenant code based on domain
const getTenantCode = (): string => {
  // First try tenant_code (used by login), then tenant_domain (backup)
  const savedTenant = localStorage.getItem('tenant_code') || localStorage.getItem('tenant_domain');
  if (savedTenant) return savedTenant;
  
  const hostname = window.location.hostname;
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    return 'premier_admin';
  }
  return 'demo';
};

// Request interceptor to add auth token and tenant header
mediaApiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    if (tenantCode) {
      config.headers['X-Tenant-Code'] = tenantCode;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
mediaApiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface MediaFile {
  id: number;
  tenant_id: number;
  uploader_id: number;
  kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO';
  mime_type: string;
  file_key: string;
  size_bytes: number;
  alt_text?: string;
  created_at: string;
  updated_at?: string;
}

export interface UploadResponse {
  id: number;
  file_key: string;
  mime_type: string;
  size_bytes: number;
  url?: string; // Generated URL if available
}

class MediaApiService {
  /**
   * Upload a single file
   */
  async uploadFile(
    file: File, 
    kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' = 'IMAGE',
    altText?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (altText) {
      formData.append('alt_text', altText);
    }
    
    // Convert frontend kind to backend format (backend expects lowercase)
    const kindMapping: Record<string, string> = {
      'IMAGE': 'image',
      'VIDEO': 'video', 
      'DOCUMENT': 'file',
      'AUDIO': 'file' // Backend doesn't have audio, use file
    };
    const backendKind = kindMapping[kind] || 'file';
    console.log('🔄 Converting kind:', kind, '→', backendKind);

    // Kind goes in query params, not form data - BACK TO ORIGINAL
    const response = await mediaApiClient.post(`/media/upload?kind=${backendKind}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Generate URL based on file_key (this should match your actual file serving setup)
    const mediaFile = response.data;
    const generatedUrl = `${API_BASE_URL}/media/${mediaFile.file_key}`;
    
    return {
      ...mediaFile,
      url: generatedUrl
    };
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[], 
    kind: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO' = 'IMAGE'
  ): Promise<UploadResponse[]> {
    console.log('🔄 Uploading', files.length, 'files with kind:', kind);
    const uploadPromises = files.map(file => this.uploadFile(file, kind));
    return Promise.all(uploadPromises);
  }

  /**
   * Get all media files
   */
  async getMediaFiles(
    kind?: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'AUDIO',
    skip = 0,
    limit = 100
  ): Promise<MediaFile[]> {
    const params: any = { skip, limit };
    if (kind) {
      params.kind = kind;
    }

    const response = await mediaApiClient.get('/media/', { params });
    return response.data;
  }

  /**
   * Get media file by ID
   */
  async getMediaFile(mediaId: number): Promise<MediaFile> {
    const response = await mediaApiClient.get(`/media/${mediaId}`);
    return response.data;
  }

  /**
   * Delete media file
   */
  async deleteMediaFile(mediaId: number): Promise<void> {
    await mediaApiClient.delete(`/media/${mediaId}`);
  }
}

export const mediaApi = new MediaApiService();