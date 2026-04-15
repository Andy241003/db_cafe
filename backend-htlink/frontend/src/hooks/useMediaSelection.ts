/**
 * Custom hook for managing media selection (images, videos, etc.)
 * Provides reusable logic for:
 * - Selecting multiple media files
 * - Setting a primary/featured image
 * - Removing media from selection
 * - Handling media state updates
 * 
 * Usage in component state:
 * const [editingItem, setEditingItem] = useState<EditableItem>({...})
 * const mediaHandlers = useMediaSelection(editingItem, setEditingItem)
 * 
 * Then use:
 * - mediaHandlers.handleGallerySelect(mediaIds, mediaUrls)
 * - mediaHandlers.handleRemoveMedia(mediaId)
 * - mediaHandlers.handleSetPrimaryMedia(mediaId)
 */

import { useCallback } from 'react';

interface MediaState {
  media_ids?: number[];
  primary_image_media_id?: number | null;
  [key: string]: any; // For other fields in the state object
}

interface UseMediaSelectionReturn<T extends MediaState> {
  handleGallerySelect: (mediaIds: number[], mediaUrls?: string[]) => void;
  handleRemoveMedia: (mediaId: number) => void;
  handleSetPrimaryMedia: (mediaId: number) => void;
  getInitialSelectedIds: () => number[];
}

/**
 * Hook to manage media selection and primary image logic
 * @param state Current state object with media_ids and primary_image_media_id
 * @param setState State setter function
 * @returns Object with media handling functions
 */
export const useMediaSelection = <T extends MediaState>(
  state: T | null | undefined,
  setState: (newState: T | ((prev: T | null | undefined) => T | null | undefined)) => void
): UseMediaSelectionReturn<T> => {
  /**
   * Handle gallery/library selection
   * - Deduplicates media IDs
   * - Maintains current primary image if it's in the new selection
   * - Otherwise sets first image as primary
   */
  const handleGallerySelect = useCallback(
    (mediaIds: number[], mediaUrls?: string[]) => {
      setState((previous) => {
        if (!previous) return previous;

        // Deduplicate media IDs
        const dedupedMediaIds = Array.from(new Set(mediaIds));

        // Maintain primary image if it's still in selection, otherwise pick first
        const nextPrimary =
          previous.primary_image_media_id && dedupedMediaIds.includes(previous.primary_image_media_id)
            ? previous.primary_image_media_id
            : dedupedMediaIds[0];

        return {
          ...previous,
          media_ids: dedupedMediaIds,
          primary_image_media_id: nextPrimary,
        };
      });
    },
    [setState]
  );

  /**
   * Handle removing a media file from selection
   * - Removes the media ID from the list
   * - If removed media was primary, sets first remaining as primary
   */
  const handleRemoveMedia = useCallback(
    (mediaId: number) => {
      setState((previous) => {
        if (!previous) return previous;

        const nextMediaIds = (previous.media_ids || []).filter((id) => id !== mediaId);
        const nextPrimary =
          previous.primary_image_media_id === mediaId ? nextMediaIds[0] : previous.primary_image_media_id;

        return {
          ...previous,
          media_ids: nextMediaIds,
          primary_image_media_id: nextPrimary,
        };
      });
    },
    [setState]
  );

  /**
   * Handle setting a specific media as primary/featured
   */
  const handleSetPrimaryMedia = useCallback(
    (mediaId: number) => {
      setState((previous) =>
        previous
          ? {
              ...previous,
              primary_image_media_id: mediaId,
            }
          : previous
      );
    },
    [setState]
  );

  /**
   * Get initial selected IDs for MediaPickerModal
   */
  const getInitialSelectedIds = useCallback(() => {
    return state?.media_ids || [];
  }, [state?.media_ids]);

  return {
    handleGallerySelect,
    handleRemoveMedia,
    handleSetPrimaryMedia,
    getInitialSelectedIds,
  };
};

export default useMediaSelection;
import { useCallback } from 'react';

/**
 * Media selection item interface
 */
export interface MediaSelectionItem {
  media_ids: number[];
  primary_image_media_id?: number;
  [key: string]: any;
}

/**
 * Hook for managing media selection logic
 * Handles adding, removing, and setting primary images
 * 
 * Usage:
 * const {
 *   handleMediaSelected,
 *   handleMediaSelectedMultiple,
 *   handleRemoveMedia,
 *   handleSetPrimaryMedia
 * } = useMediaSelection(editingItem, setEditingItem, onClose);
 */
export const useMediaSelection = <T extends MediaSelectionItem>(
  item: T | null,
  setItem: (item: T | null) => void,
  onClose?: () => void
) => {
  /**
   * Handle single media selection
   * Adds media to the list if not already included
   */
  const handleMediaSelected = useCallback(
    (mediaId: number) => {
      setItem((prev) => {
        if (!prev) return prev;
        const mediaIds = prev.media_ids.includes(mediaId)
          ? prev.media_ids
          : [...prev.media_ids, mediaId];
        return {
          ...prev,
          media_ids: mediaIds,
          primary_image_media_id: prev.primary_image_media_id ?? mediaId,
        } as T;
      });
      onClose?.();
    },
    [setItem, onClose]
  );

  /**
   * Handle multiple media selection
   * Replaces the media list with the selected media IDs
   * Deduplicates and preserves primary image if still in selection
   */
  const handleMediaSelectedMultiple = useCallback(
    (mediaIds: number[]) => {
      setItem((prev) => {
        if (!prev) return prev;
        const dedupedMediaIds = Array.from(new Set(mediaIds));
        const nextPrimary =
          prev.primary_image_media_id &&
          dedupedMediaIds.includes(prev.primary_image_media_id)
            ? prev.primary_image_media_id
            : dedupedMediaIds[0];
        return {
          ...prev,
          media_ids: dedupedMediaIds,
          primary_image_media_id: nextPrimary,
        } as T;
      });
      onClose?.();
    },
    [setItem, onClose]
  );

  /**
   * Handle media removal
   * Removes media from the list and updates primary image if needed
   */
  const handleRemoveMedia = useCallback(
    (mediaId: number) => {
      setItem((prev) => {
        if (!prev) return prev;
        const nextMediaIds = prev.media_ids.filter((id) => id !== mediaId);
        const nextPrimary =
          prev.primary_image_media_id === mediaId
            ? nextMediaIds[0]
            : prev.primary_image_media_id;
        return {
          ...prev,
          media_ids: nextMediaIds,
          primary_image_media_id: nextPrimary,
        } as T;
      });
    },
    [setItem]
  );

  /**
   * Handle setting primary image
   * Sets the specified media as the primary/featured image
   */
  const handleSetPrimaryMedia = useCallback(
    (mediaId: number) => {
      setItem((prev) =>
        prev && prev.media_ids.includes(mediaId)
          ? ({ ...prev, primary_image_media_id: mediaId } as T)
          : prev
      );
    },
    [setItem]
  );

  return {
    handleMediaSelected,
    handleMediaSelectedMultiple,
    handleRemoveMedia,
    handleSetPrimaryMedia,
  };
};
