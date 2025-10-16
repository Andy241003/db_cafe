// src/services/mediaApi.ts
import axios from 'axios';
import { getApiBaseUrl } from '../utils/api';

const API_BASE_URL = getApiBaseUrl();

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
  kind: 'image' | 'video' | 'file';
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
    kind: 'image' | 'video' | 'file' = 'image',
    altText?: string
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (altText) {
      formData.append('alt_text', altText);
    }
    
    // Use kind directly since backend now expects lowercase
    const backendKind = kind;

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
    kind: 'image' | 'video' | 'file' = 'image'
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, kind));
    return Promise.all(uploadPromises);
  }

  /**
   * Get all media files
   */
  async getMediaFiles(
    kind?: 'image' | 'video' | 'file',
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
    try {
      await mediaApiClient.delete(`/media/${mediaId}`);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download media file
   */
  async downloadMediaFile(mediaId: number, filename: string): Promise<void> {
    try {
      const response = await mediaApiClient.get(`/media/${mediaId}/download`, {
        responseType: 'blob',
        timeout: 30000, // 30 second timeout for large files
      });
      
      // Create blob with proper content type
      const contentType = response.headers['content-type'] || 'application/octet-stream';
      const blob = new Blob([response.data], { type: contentType });
      
      // Get filename from Content-Disposition header if available
      const contentDisposition = response.headers['content-disposition'];
      let downloadFilename = filename;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          downloadFilename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      // Create blob URL and trigger download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadFilename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update media file information
   */
  async updateMediaFile(
    mediaId: number,
    updates: {
      alt_text?: string;
      kind?: 'image' | 'video' | 'file';
    }
  ): Promise<MediaFile> {
    const params = new URLSearchParams();
    if (updates.alt_text !== undefined) {
      params.append('alt_text', updates.alt_text);
    }
    if (updates.kind) {
      params.append('kind', updates.kind);
    }

    const response = await mediaApiClient.put(`/media/${mediaId}?${params.toString()}`);
    return response.data;
  }

  /**
   * Get media file URL for direct access
   */
  getMediaFileUrl(mediaId: number): string {
    const token = localStorage.getItem('access_token');
    const tenantCode = getTenantCode();
    const baseUrl = `${API_BASE_URL}/media/${mediaId}/download`;
    
    // Add auth params to URL for direct access
    const params = new URLSearchParams();
    if (token) params.append('token', token);
    if (tenantCode) params.append('tenant', tenantCode);
    
    return params.toString() ? `${baseUrl}?${params.toString()}` : baseUrl;
  }
}

export const mediaApi = new MediaApiService();