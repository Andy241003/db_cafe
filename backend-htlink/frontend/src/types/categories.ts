// src/types/categories.ts

export interface Category {
  name: string;
  id: number;
  slug: string;
  icon: string;
  status: 'active' | 'inactive';
  type: 'system' | 'custom';
  featureCount: number;
  translations: Record<string, CategoryTranslation>;
}

export interface CategoryTranslation {
  title: string;
  description: string;
}

export interface CategoryFilters {
  search: string;
  status: string;
  type: string;
}

export interface CategoryFormData {
  slug: string;
  icon: string;
  translations: {
    en: CategoryTranslation;
    vi: CategoryTranslation;
    ja: CategoryTranslation;
  };
}


export interface TranslationData {
  title: string;
  description: string;
}

export type Language = 'en' | 'vi' | 'ja' | 'kr' | 'fr';