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
  if (savedTenant) {
    console.log('MediaAPI using tenant from localStorage:', savedTenant);
    return savedTenant;
  }
  
  const hostname = window.location.hostname;
  console.log('MediaAPI hostname:', hostname);
  
  if (hostname.includes('zalominiapp.vtlink.vn')) {
    console.log('MediaAPI using hardcoded tenant: premier_admin');
    return 'premier_admin';
  }
  
  // Try 'boton_blue' instead of 'demo' as default
  console.log('MediaAPI using default tenant: boton_blue');
  return 'boton_blue';
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

// Setup interceptors for auth and permission handling
import { setupAxiosInterceptors } from '../utils/axiosInterceptors';
setupAxiosInterceptors(mediaApiClient);

export interface MediaFile {
  id: number;
  tenant_id: number;
  uploader_id: number;
  kind: 'image' | 'video' | 'file';
  mime_type: string;
  file_key: string;
  original_filename?: string;
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
    altText?: string,
    source?: string,
    entityType?: string,
    entityId?: number,
    folder?: string
  ): Promise<UploadResponse> {
    console.log('📤 uploadFile: Starting upload of', file.name, '- size:', file.size);
    
    const formData = new FormData();
    formData.append('file', file);
    
    if (altText) {
      formData.append('alt_text', altText);
    }
    
    // Use kind directly since backend now expects lowercase
    const backendKind = kind;

    // Build query params
    let queryParams = `kind=${backendKind}`;
    if (source) queryParams += `&source=${source}`;
    if (entityType) queryParams += `&entity_type=${entityType}`;
    if (entityId) queryParams += `&entity_id=${entityId}`;
    if (folder) queryParams += `&folder=${folder}`;

    console.log('📤 uploadFile: Query params:', queryParams);

    // Kind goes in query params, not form data - BACK TO ORIGINAL
    try {
      console.log('📤 uploadFile: Sending POST request to /media/upload');
      const response = await mediaApiClient.post(`/media/upload?${queryParams}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for file uploads
      });

      console.log('✅ uploadFile: Response received:', response.data);

      // Return backend response directly - backend already provides correct URL format
      const mediaFile = response.data;
      
      return {
        ...mediaFile,
        // Use backend URL if provided, otherwise construct new format with ID
        url: mediaFile.url || `${API_BASE_URL}/media/${mediaFile.id}/download`
      };
    } catch (error: any) {
      console.error('❌ uploadFile: Error:', error.message, error.response?.data);
      throw error;
    }
  }

  /**
   * Upload multiple files
   */
  async uploadFiles(
    files: File[], 
    kind: 'image' | 'video' | 'file' = 'image',
    source?: string,
    entityType?: string,
    entityId?: number,
    folder?: string
  ): Promise<UploadResponse[]> {
    const uploadPromises = files.map(file => this.uploadFile(file, kind, undefined, source, entityType, entityId, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Get all media files
   */
  async getMediaFiles(
    options?: {
      kind?: 'image' | 'video' | 'file';
      skip?: number;
      limit?: number;
      source?: string;
      folder?: string;
    } | 'image' | 'video' | 'file',
    skip = 0,
    limit = 100,
    source?: string
  ): Promise<MediaFile[]> {
    let params: any = {};
    
    // Support both object params and individual params for backward compatibility
    if (typeof options === 'object' && options !== null) {
      params = {
        skip: options.skip ?? 0,
        limit: options.limit ?? 100
      };
      if (options.kind) params.kind = options.kind;
      if (options.source) params.source = options.source;
      if (options.folder) params.folder = options.folder;
    } else {
      // Old signature: getMediaFiles(kind, skip, limit, source)
      params = { skip, limit };
      if (options) params.kind = options; // options is kind in old signature
      if (source) params.source = source;
    }

    const response = await mediaApiClient.get('/media/', { params });
    return response.data;
  }

  /**
   * Get media file by ID
   * Note: Backend doesn't have /media/{id} endpoint, so we fetch all and filter
   */
  async getMediaFile(mediaId: number): Promise<MediaFile> {
    const response = await mediaApiClient.get(`/media/`);
    const allFiles: MediaFile[] = response.data;
    const file = allFiles.find(f => f.id === mediaId);
    if (!file) {
      throw new Error(`Media file with ID ${mediaId} not found`);
    }
    return file;
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
      original_filename?: string;
      alt_text?: string;
      kind?: 'image' | 'video' | 'file';
    }
  ): Promise<MediaFile> {
    const params = new URLSearchParams();
    if (updates.original_filename !== undefined) {
      params.append('original_filename', updates.original_filename);
    }
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