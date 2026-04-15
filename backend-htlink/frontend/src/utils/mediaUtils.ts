/**
 * Shared utilities and types for media handling across cafe pages
 * Provides common patterns for media selection, display, and API integration
 */

import { getApiBaseUrl } from './api';

/**
 * Combined media state type used across multiple entities
 * Applied to: Careers, Events, Menu Items, Promotions, Services, Spaces
 */
export interface MediaSelectableEntity {
  id?: number;
  media_ids?: number[];
  primary_image_media_id?: number | null;
  media?: Array<{
    media_id: number;
    is_primary?: boolean;
    sort_order?: number;
  }>;
}

/**
 * Get URL for viewing a media file
 * @param mediaId - ID of the media file
 * @param size - Optional size for thumbnail ('small', 'medium', 'large')
 */
export const getMediaViewUrl = (
  mediaId: number,
  size?: 'small' | 'medium' | 'large'
): string => {
  const baseUrl = `${getApiBaseUrl()}/media/${mediaId}/view`;
  return size ? `${baseUrl}?size=${size}` : baseUrl;
};

/**
 * Get URL for downloading a media file
 */
export const getMediaDownloadUrl = (mediaId: number): string => {
  return `${getApiBaseUrl()}/media/${mediaId}/download`;
};

/**
 * Convert API media response to editable form state
 * Extracts media_ids and primary_image_media_id from nested media array
 */
export const mediaResponseToState = (
  entity: MediaSelectableEntity | undefined
): {
  media_ids: number[];
  primary_image_media_id: number | undefined;
} => {
  if (!entity) {
    return {
      media_ids: [],
      primary_image_media_id: undefined,
    };
  }

  // If already has media_ids, use it directly
  if (entity.media_ids && entity.media_ids.length > 0) {
    return {
      media_ids: entity.media_ids,
      primary_image_media_id: entity.primary_image_media_id,
    };
  }

  // Otherwise extract from media array (for backward compatibility)
  if (entity.media && entity.media.length > 0) {
    const mediaIds = entity.media.map((m) => m.media_id);
    const primary = entity.media.find((m) => m.is_primary)?.media_id || mediaIds[0];
    return {
      media_ids: mediaIds,
      primary_image_media_id: primary,
    };
  }

  return {
    media_ids: [],
    primary_image_media_id: undefined,
  };
};

/**
 * Validate media selection before saving
 * Checks for minimum/maximum media count based on rules
 */
export interface MediaValidationRules {
  minCount?: number; // Minimum required media (0 = optional)
  maxCount?: number; // Maximum allowed media
  requiredRoleName?: string; // Custom error message role name
}

export const validateMediaSelection = (
  mediaIds: number[] | undefined,
  rules: MediaValidationRules = {}
): { valid: boolean; error?: string } => {
  const count = mediaIds?.length || 0;
  const { minCount = 0, maxCount = undefined, requiredRoleName = 'image' } = rules;

  if (count < minCount) {
    if (minCount === 1) {
      return {
        valid: false,
        error: `Please select at least one ${requiredRoleName}`,
      };
    }
    return {
      valid: false,
      error: `Please select at least ${minCount} ${requiredRoleName}s`,
    };
  }

  if (maxCount && count > maxCount) {
    return {
      valid: false,
      error: `Maximum ${maxCount} ${requiredRoleName}s allowed`,
    };
  }

  return { valid: true };
};

/**
 * Create API payload from media state
 * Formats media selection for submission to API
 */
export const createMediaPayload = (
  mediaIds: number[] | undefined,
  primaryImageMediaId: number | null | undefined
): {
  media_ids: number[] | undefined;
  primary_image_media_id: number | null | undefined;
} => {
  return {
    media_ids: mediaIds && mediaIds.length > 0 ? mediaIds : undefined,
    primary_image_media_id: primaryImageMediaId || null,
  };
};

/**
 * Common media picker options for gallery dialog
 */
export const getMediaPickerOptions = (entityType: string) => {
  const optionsMap: Record<
    string,
    {
      title: string;
      kind: 'image' | 'video' | 'file';
      source?: string;
      folder?: string;
      folderAliases?: string[];
    }
  > = {
    career: {
      title: 'Select Career Images',
      kind: 'image',
      source: 'careers',
      folder: 'careers',
    },
    event: {
      title: 'Select Event Images',
      kind: 'image',
      source: 'events',
      folder: 'events',
    },
    menu_item: {
      title: 'Select Menu Item Images',
      kind: 'image',
      source: 'menu',
      folder: 'menu',
      folderAliases: ['menu_items', 'items'],
    },
    promotion: {
      title: 'Select Promotion Images',
      kind: 'image',
      source: 'promotions',
      folder: 'promotions',
    },
    service: {
      title: 'Select Service Images',
      kind: 'image',
      source: 'services',
      folder: 'services',
    },
    space: {
      title: 'Select Space Images',
      kind: 'image',
      source: 'spaces',
      folder: 'spaces',
    },
  };

  return optionsMap[entityType] || {
    title: 'Select Images',
    kind: 'image' as const,
  };
};

export default {
  getMediaViewUrl,
  getMediaDownloadUrl,
  mediaResponseToState,
  validateMediaSelection,
  createMediaPayload,
  getMediaPickerOptions,
};
