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
