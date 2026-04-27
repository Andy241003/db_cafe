import { faImages } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import MediaGrid from './MediaGrid';
import MediaPickerModal from './MediaPickerModal';

interface MediaSelectionSectionProps {
  /** Label text for the section */
  label?: string;
  /** Array of selected media IDs */
  mediaIds: number[];
  /** ID of the primary/featured image */
  primaryImageMediaId?: number;
  /** Callback when media is removed */
  onRemove: (mediaId: number) => void;
  /** Callback when media is set as primary */
  onSetPrimary: (mediaId: number) => void;
  /** Callback when multiple media are selected from picker */
  onSelectMultiple: (mediaIds: number[]) => void;
  /** MediaPickerModal props */
  pickerTitle?: string;
  pickerKind?: 'image' | 'video' | 'file';
  pickerSource?: string;
  pickerFolder?: string;
  pickerFolderAliases?: string[];
  /** Button text and styling */
  buttonText?: string;
  buttonClassName?: string;
  /** Grid display options */
  gridColumns?: number;
  gridItemHeight?: number;
}

/**
 * MediaSelectionSection component
 * Provides a complete media selection interface with picker, grid display, and management
 * Reusable across different pages
 * 
 * Features:
 * - Media picker modal for selecting images
 * - Grid display of selected images
 * - Set/remove image functionality
 * - Primary image management
 */
const MediaSelectionSection: React.FC<MediaSelectionSectionProps> = ({
  label = 'Media',
  mediaIds,
  primaryImageMediaId,
  onRemove,
  onSetPrimary,
  onSelectMultiple,
  pickerTitle = 'Select Media',
  pickerKind = 'image',
  pickerSource,
  pickerFolder,
  pickerFolderAliases = [],
  buttonText = 'Select Images',
  buttonClassName = 'inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700',
  gridColumns = 4,
  gridItemHeight = 96,
}) => {
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  return (
    <div>
      <label className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-700">
        <FontAwesomeIcon icon={faImages} />
        {label}
      </label>
      <button
        type="button"
        onClick={() => setIsPickerOpen(true)}
        className={buttonClassName}
      >
        <FontAwesomeIcon icon={faImages} />
        {buttonText}
      </button>

      {mediaIds.length > 0 && (
        <div className="mt-4">
          <MediaGrid
            mediaIds={mediaIds}
            primaryImageMediaId={primaryImageMediaId}
            onRemove={onRemove}
            onSetPrimary={onSetPrimary}
            columns={gridColumns}
            gridItemHeight={gridItemHeight}
          />
        </div>
      )}

      <MediaPickerModal
        isOpen={isPickerOpen}
        onClose={() => setIsPickerOpen(false)}
        onSelectMultiple={onSelectMultiple}
        title={pickerTitle}
        kind={pickerKind}
        source={pickerSource}
        folder={pickerFolder}
        folderAliases={pickerFolderAliases}
        allowMultiple={true}
        initialSelectedIds={mediaIds}
      />
    </div>
  );
};

export default MediaSelectionSection;

