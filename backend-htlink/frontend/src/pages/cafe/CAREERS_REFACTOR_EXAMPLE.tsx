/**
 * EXAMPLE: How to use reusable media components in Careers page
 * 
 * This file shows how to refactor the Careers page to use:
 * - useMediaSelection hook
 * - MediaSelectionSection component
 * - MediaGrid component
 * 
 * This reduces code duplication and makes maintenance easier.
 */

// Import the hook and components
import { useMediaSelection } from '../../hooks/useMediaSelection';
import MediaSelectionSection from '../../components/MediaSelectionSection';
import MediaGrid from '../../components/MediaGrid';

// In your Careers component:
interface EditableCareer {
  id?: number;
  code: string;
  /* ... other fields ... */
  primary_image_media_id?: number;
  media_ids: number[];
}

const CareersExample = () => {
  const [editingCareer, setEditingCareer] = useState<EditableCareer | null>(null);
  
  // ========== BEFORE: Manual handlers (not reused) ==========
  // const handleGallerySelect = (mediaIds: number[], mediaUrls: string[]) => {
  //   setEditingCareer((previous) => {
  //     if (!previous) return previous;
  //     const dedupedMediaIds = Array.from(new Set(mediaIds));
  //     const nextPrimary = previous.primary_image_media_id && dedupedMediaIds.includes(previous.primary_image_media_id)
  //       ? previous.primary_image_media_id
  //       : dedupedMediaIds[0];
  //     return {
  //       ...previous,
  //       media_ids: dedupedMediaIds,
  //       primary_image_media_id: nextPrimary,
  //     };
  //   });
  //   setMediaPickerMode(null);
  // };
  //
  // const handleRemoveMedia = (mediaId: number) => {
  //   setEditingCareer((previous) => {
  //     if (!previous) return previous;
  //     const nextMediaIds = previous.media_ids.filter((id) => id !== mediaId);
  //     const nextPrimary = previous.primary_image_media_id === mediaId ? nextMediaIds[0] : previous.primary_image_media_id;
  //     return {
  //       ...previous,
  //       media_ids: nextMediaIds,
  //       primary_image_media_id: nextPrimary,
  //     };
  //   });
  // };
  //
  // const handleSetPrimaryMedia = (mediaId: number) => {
  //   setEditingCareer((previous) => (previous ? { ...previous, primary_image_media_id: mediaId } : previous));
  // };

  // ========== AFTER: Using the reusable hook ==========
  const {
    handleMediaSelectedMultiple,
    handleRemoveMedia,
    handleSetPrimaryMedia,
  } = useMediaSelection(editingCareer, setEditingCareer, () => setMediaPickerMode(null));

  // ========== OPTION 1: Use MediaSelectionSection (RECOMMENDED) ==========
  return (
    <div>
      {/* All media handling UI in one component */}
      <MediaSelectionSection
        label="Career Images"
        mediaIds={editingCareer?.media_ids || []}
        primaryImageMediaId={editingCareer?.primary_image_media_id}
        onRemove={handleRemoveMedia}
        onSetPrimary={handleSetPrimaryMedia}
        onSelectMultiple={handleMediaSelectedMultiple}
        pickerTitle="Select Career Images"
        pickerKind="image"
        pickerSource="cafe"
        pickerFolder="careers"
        buttonText="Select Images"
        gridColumns={4}
        gridItemHeight={96}
      />
    </div>
  );

  // ========== OPTION 2: Use MediaGrid manually ==========
  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <FontAwesomeIcon icon={faImages} />
        Career Images
      </label>
      <button
        type="button"
        onClick={() => setMediaPickerMode('gallery')}
        className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
      >
        <FontAwesomeIcon icon={faImages} />
        Select Images
      </button>

      {/* Use MediaGrid instead of manual rendering */}
      {editingCareer?.media_ids.length ? (
        <div className="mt-4">
          <MediaGrid
            mediaIds={editingCareer.media_ids}
            primaryImageMediaId={editingCareer.primary_image_media_id}
            onRemove={handleRemoveMedia}
            onSetPrimary={handleSetPrimaryMedia}
            columns={4}
            gridItemHeight={96}
            altText="Career"
          />
        </div>
      ) : null}

      {mediaPickerMode && (
        <MediaPickerModal
          isOpen={!!mediaPickerMode}
          onClose={() => setMediaPickerMode(null)}
          onSelectMultiple={handleMediaSelectedMultiple}
          allowMultiple={true}
          initialSelectedIds={editingCareer?.media_ids || []}
          title="Select Career Images"
        />
      )}
    </div>
  );

  // ========== OPTION 3: Use with your existing API calls ==========
  const handleSaveCareer = async () => {
    // ... existing validation code ...

    const payload: CareerCreate = {
      // ... other fields ...
      primary_image_media_id: editingCareer.primary_image_media_id || null,
      media_ids: editingCareer.media_ids,
    };

    try {
      if (editingCareer.id) {
        await cafeCareersApi.updateCareer(editingCareer.id, payload);
      } else {
        await cafeCareersApi.createCareer(payload);
      }
      // Media is automatically saved as part of the payload!
    } catch (error: any) {
      toast.error(error.message || 'Failed to save career');
    }
  };
};

// ========== EXAMPLE: Minimal code needed for new features ==========
/**
 * If adding media picker to a NEW page like "Interviews":
 * 
 * 1. Add media_ids and primary_image_media_id to your type:
 *    interface EditableInterview { media_ids: number[]; primary_image_media_id?: number; }
 * 
 * 2. Use the hook:
 *    const { handleRemoveMedia, handleSetPrimaryMedia, handleMediaSelectedMultiple } 
 *      = useMediaSelection(editingInterview, setEditingInterview);
 * 
 * 3. Add the section:
 *    <MediaSelectionSection
 *      mediaIds={editingInterview.media_ids}
 *      onRemove={handleRemoveMedia}
 *      onSetPrimary={handleSetPrimaryMedia}
 *      onSelectMultiple={handleMediaSelectedMultiple}
 *      pickerFolder="interviews"
 *    />
 * 
 * 4. Include in your API payload:
 *    const payload = { ..., media_ids: editingInterview.media_ids, ... };
 * 
 * That's it! No need to copy-paste media handling code anymore.
 */

export default CareersExample;
