// src/types/properties.ts
export interface Hotel {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  vrLink?: string;
  icon: string;
  color: string;
  status: 'active' | 'inactive';
  posts: HotelPost[];
  bannerImages?: FileList | string[];
  description?: string;
}

export interface HotelPost {
  id: number;
  hotelId: string;
  title: string;
  content: string;
  excerpt?: string;
  slug?: string;
  locale?: 'en' | 'vi' | 'ja';
  status: 'draft' | 'published';
  address?: string;
  phone?: string;
  vrLink?: string;
  createdAt?: string;
  updatedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
}

export interface HotelFormData {
  name: string;
  phone: string;
  email?: string;
  address: string;
  vrLink?: string;
  description?: string;
  status: 'active' | 'inactive';
  icon: string;
  color: string;
  bannerImages?: FileList;
}

export interface TranslationData {
  locale: string;
  title: string;
  content: string;
  excerpt?: string;
  metaTitle?: string;
  metaDescription?: string;
  originalAddress?: string;
  originalPhone?: string;
  originalContent?: string;
  translatedAddress?: string;
  translatedPhone?: string;
  translatedContent?: string;
  targetLanguage?: 'en' | 'vi' | 'ja';
}