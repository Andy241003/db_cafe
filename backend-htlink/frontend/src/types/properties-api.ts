// src/types/properties-api.ts

// Backend API types matching the Property model
export interface ApiProperty {
  id: number;
  tenant_id: number;
  property_name: string;
  code: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  banner_images?: string[];
  intro_video_url?: string;
  vr360_url?: string;
  address?: string;
  district?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  phone_number?: string;
  email?: string;
  website_url?: string;
  zalo_oa_id?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  google_map_url?: string;
  latitude?: number;
  longitude?: number;
  primary_color?: string;
  secondary_color?: string;
  copyright_text?: string;
  terms_url?: string;
  privacy_url?: string;
  timezone?: string;
  default_locale: string;
  settings_json?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface ApiPropertyCreate {
  tenant_id?: number; // Optional, will be set by backend
  property_name: string;
  code: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  banner_images?: string[];
  intro_video_url?: string;
  vr360_url?: string;
  address?: string;
  district?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  phone_number?: string;
  email?: string;
  website_url?: string;
  zalo_oa_id?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  google_map_url?: string;
  latitude?: number;
  longitude?: number;
  primary_color?: string;
  secondary_color?: string;
  copyright_text?: string;
  terms_url?: string;
  privacy_url?: string;
  timezone?: string;
  default_locale: string;
  settings_json?: Record<string, any>;
  is_active: boolean;
}

export interface ApiPropertyUpdate {
  property_name?: string;
  code?: string;
  slogan?: string;
  description?: string;
  logo_url?: string;
  banner_images?: string[];
  intro_video_url?: string;
  vr360_url?: string;
  address?: string;
  district?: string;
  city?: string;
  country?: string;
  postal_code?: string;
  phone_number?: string;
  email?: string;
  website_url?: string;
  zalo_oa_id?: string;
  facebook_url?: string;
  youtube_url?: string;
  tiktok_url?: string;
  instagram_url?: string;
  google_map_url?: string;
  latitude?: number;
  longitude?: number;
  primary_color?: string;
  secondary_color?: string;
  copyright_text?: string;
  terms_url?: string;
  privacy_url?: string;
  timezone?: string;
  default_locale?: string;
  settings_json?: Record<string, any>;
  is_active?: boolean;
}

// Transform functions to convert between API and UI types
export function transformApiPropertyToUI(apiProperty: ApiProperty) {
  return {
    id: apiProperty.id.toString(),
    name: apiProperty.property_name,
    phone: apiProperty.phone_number || '',
    email: apiProperty.email || '',
    address: apiProperty.address || '',
    vrLink: apiProperty.vr360_url || '',
    description: apiProperty.description || '<p>No description available.</p>',
    icon: 'fa-building',
    color: apiProperty.primary_color || 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
    status: (apiProperty.is_active ? 'active' : 'inactive') as 'active' | 'inactive',
    code: apiProperty.code,
    slogan: apiProperty.slogan,
    bannerImages: apiProperty.banner_images || [],
    website_url: apiProperty.website_url,
    // Map fields
    googleMapUrl: apiProperty.google_map_url,
    latitude: apiProperty.latitude,
    longitude: apiProperty.longitude,
    posts: [] // Posts will be loaded separately
  };
}

export function transformUIToApiPropertyCreate(uiData: any): ApiPropertyCreate {
  const data: ApiPropertyCreate = {
    property_name: uiData.name,
    code: uiData.code || generatePropertyCode(uiData.name),
    slogan: uiData.slogan,
    description: uiData.description,
    logo_url: uiData.logo_url,
    banner_images: uiData.banner_images || [],
    intro_video_url: uiData.intro_video_url,
    vr360_url: uiData.vrLink,
    address: uiData.address,
    phone_number: uiData.phone,
    email: uiData.email,
    // If website_url not provided, generate from code: https://{code}.trip360.vn
    website_url: uiData.website_url || `https://${(uiData.code || generatePropertyCode(uiData.name)).toLowerCase()}.trip360.vn`,
    // Map fields
    google_map_url: uiData.googleMapUrl,
    latitude: uiData.latitude,
    longitude: uiData.longitude,
    primary_color: uiData.color,
    default_locale: 'en',
    is_active: uiData.status === 'active'
  };
  
  // Remove undefined values to clean the payload
  Object.keys(data).forEach(key => {
    if (data[key as keyof ApiPropertyCreate] === undefined) {
      delete data[key as keyof ApiPropertyCreate];
    }
  });
  
  return data;
}

export function transformUIToApiPropertyUpdate(uiData: any): ApiPropertyUpdate {
  const updateData: ApiPropertyUpdate = {};
  
  // Only include fields that have values
  if (uiData.name) updateData.property_name = uiData.name;
  if (uiData.description) updateData.description = uiData.description;
  if (uiData.vrLink) updateData.vr360_url = uiData.vrLink;
  if (uiData.address) updateData.address = uiData.address;
  if (uiData.phone) updateData.phone_number = uiData.phone;
  if (uiData.email) updateData.email = uiData.email;
  if (uiData.color) updateData.primary_color = uiData.color;
  if (uiData.status !== undefined) updateData.is_active = uiData.status === 'active';
  
  // Map fields
  if (uiData.googleMapUrl !== undefined) updateData.google_map_url = uiData.googleMapUrl;
  if (uiData.latitude !== undefined) updateData.latitude = uiData.latitude;
  if (uiData.longitude !== undefined) updateData.longitude = uiData.longitude;
  
  // Don't send code to avoid conflicts - backend will keep existing code
  
  return updateData;
}

// Helper to generate property code from name
function generatePropertyCode(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 50);
}