/**
 * REUSABLE MEDIA SELECTION COMPONENTS INDEX
 * 
 * Quick reference for using media picker across the cafe management system
 */

// ============================================================================
// 1. HOOK - For managing media selection state and logic
// ============================================================================
// File: src/hooks/useMediaSelection.ts
// 
// Use this when you need to manage media_ids and primary_image_media_id state
//
// const { 
//   handleMediaSelected,        // Add single media
//   handleMediaSelectedMultiple, // Add multiple media
//   handleRemoveMedia,          // Remove media
//   handleSetPrimaryMedia       // Set as primary
// } = useMediaSelection(item, setItem, onClose?);

import { useMediaSelection } from '../hooks/useMediaSelection';
import type { MediaSelectionItem } from '../hooks/useMediaSelection';

// ============================================================================
// 2. COMPONENTS - For UI rendering
// ============================================================================

// Component 1: MediaGrid
// File: src/components/MediaGrid.tsx
// 
// Displays images in a grid with remove/set-primary buttons
// Use this when you want to customize the picker/button yourself
//
// <MediaGrid
//   mediaIds={[1, 2, 3]}
//   primaryImageMediaId={1}
//   onRemove={(id) => handleRemoveMedia(id)}
//   onSetPrimary={(id) => handleSetPrimaryMedia(id)}
//   columns={4}
//   gridItemHeight={96}
// />

import MediaGrid from '../components/MediaGrid';

// Component 2: MediaSelectionSection
// File: src/components/MediaSelectionSection.tsx
// 
// RECOMMENDED - Complete section with picker, grid, and all controls
// Use this as your primary choice for media selection UI
//
// <MediaSelectionSection
//   label="Event Images"
//   mediaIds={event.media_ids}
//   primaryImageMediaId={event.primary_image_media_id}
//   onRemove={handleRemoveMedia}
//   onSetPrimary={handleSetPrimaryMedia}
//   onSelectMultiple={handleMediaSelectedMultiple}
//   pickerFolder="events"
// />

import MediaSelectionSection from '../components/MediaSelectionSection';

// ============================================================================
// 3. QUICK START PATTERN
// ============================================================================
/**
 * Most pages should follow this pattern:
 * 
 * 1. Add to your item interface:
 *    interface MyItem {
 *      media_ids: number[];
 *      primary_image_media_id?: number;
 *      // ... other fields
 *    }
 * 
 * 2. Use the hook:
 *    const handlers = useMediaSelection(myItem, setMyItem);
 * 
 * 3. Add the component:
 *    <MediaSelectionSection
 *      mediaIds={myItem.media_ids}
 *      primaryImageMediaId={myItem.primary_image_media_id}
 *      onRemove={handlers.handleRemoveMedia}
 *      onSetPrimary={handlers.handleSetPrimaryMedia}
 *      onSelectMultiple={handlers.handleMediaSelectedMultiple}
 *      pickerFolder="my-feature"
 *    />
 * 
 * 4. Include in API payload:
 *    { ...other fields, media_ids, primary_image_media_id }
 */

// ============================================================================
// 4. EXAMPLE: Space Management Page
// ============================================================================

import React, { useState } from 'react';
import MediaSelectionSection from '../../components/MediaSelectionSection';

interface EditableSpace {
  id?: number;
  name: string;
  media_ids: number[];
  primary_image_media_id?: number;
  // ... other fields
}

const SpacePageExample = () => {
  const [editingSpace, setEditingSpace] = useState<EditableSpace | null>(null);

  // Get all handlers from hook
  const {
    handleMediaSelectedMultiple,
    handleRemoveMedia,
    handleSetPrimaryMedia,
  } = useMediaSelection(editingSpace, setEditingSpace);

  return (
    <div>
      {/* ... other form fields ... */}

      {/* Media section - THAT'S IT! */}
      <MediaSelectionSection
        label="Space Photos"
        mediaIds={editingSpace?.media_ids || []}
        primaryImageMediaId={editingSpace?.primary_image_media_id}
        onRemove={handleRemoveMedia}
        onSetPrimary={handleSetPrimaryMedia}
        onSelectMultiple={handleMediaSelectedMultiple}
        pickerTitle="Select Space Photos"
        pickerFolder="spaces"
      />

      {/* Save button - media is automatically included */}
      <button onClick={handleSaveSpace}>Save Space</button>
    </div>
  );

  const handleSaveSpace = async () => {
    if (!editingSpace) return;

    const payload = {
      ...editingSpace,
      // Media is already in editingSpace!
      // media_ids and primary_image_media_id are automatically included
    };

    // API call
    await spacesApi.save(payload);
  };
};

// ============================================================================
// 5. DOCUMENTATION FILES
// ============================================================================
/**
 * Read these files for detailed information:
 * 
 * - MEDIA_SELECTION_GUIDE.md          - Complete guide with all patterns
 * - MEDIA_REUSE_SUMMARY.md            - Summary and quick reference
 * - CAREERS_REFACTOR_EXAMPLE.tsx      - Real before/after example
 * - This file (INDEX.ts)              - You are here!
 */

// ============================================================================
// 6. INTEGRATION CHECKLIST
// ============================================================================
/**
 * When adding media support to a new page:
 * 
 * [ ] Update interface to include media_ids and primary_image_media_id
 * [ ] Import useMediaSelection hook from src/hooks/
 * [ ] Call the hook with your state
 * [ ] Import MediaSelectionSection component
 * [ ] Add MediaSelectionSection to JSX
 * [ ] Pass all props correctly (handlers, folder, etc)
 * [ ] Include media fields in API payload
 * [ ] Test media selection/removal/primary image
 * [ ] Test save and load of media
 */

// ============================================================================
// 7. PAGES ALREADY USING MEDIA
// ============================================================================
/**
 * These pages already have MediaPickerModal and could benefit from refactoring:
 * 
 * ??? Careers          - Newest, fully integrated with media picker
 * ???? Space/Spaces     - Has media, should use hook to reduce code duplication
 * ???? Menu             - Has media for items
 * ???? Promotions       - Has media
 * ???? Events           - Has media
 * ???? Services         - Has media
 * ???? Branches         - Has media
 * ???? Settings         - Has vr360 media
 */

// ============================================================================
// 8. TYPES & INTERFACES
// ============================================================================

/**
 * MediaSelectionItem interface
 * Your item type must have these fields (can have more)
 */
interface ItemWithMedia extends MediaSelectionItem {
  media_ids: number[];
  primary_image_media_id?: number;
  [key: string]: any; // Other fields
}

/**
 * MediaGrid Props
 */
interface MediaGridProps {
  mediaIds: number[];
  primaryImageMediaId?: number;
  onRemove: (mediaId: number) => void;
  onSetPrimary: (mediaId: number) => void;
  columns?: number;         // default 4
  gridItemHeight?: number;  // default 96
  altText?: string;
}

/**
 * MediaSelectionSection Props
 */
interface MediaSelectionSectionProps {
  label?: string;
  mediaIds: number[];
  primaryImageMediaId?: number;
  onRemove: (mediaId: number) => void;
  onSetPrimary: (mediaId: number) => void;
  onSelectMultiple: (mediaIds: number[]) => void;
  pickerTitle?: string;
  pickerKind?: 'image' | 'video' | 'file';
  pickerSource?: string;
  pickerFolder?: string;
  pickerFolderAliases?: string[];
  buttonText?: string;
  buttonClassName?: string;
  gridColumns?: number;
  gridItemHeight?: number;
}

// ============================================================================
// 9. COMMON PATTERNS
// ============================================================================

// Pattern 1: With custom container and styling
export const PatternWithCustomStyling = () => {
  const [item, setItem] = useState(null);
  const handlers = useMediaSelection(item, setItem);

  return (
    <div className="rounded-lg border-2 border-purple-300 p-6 bg-purple-50">
      <h3 className="mb-4 text-lg font-bold">My Custom Media Section</h3>
      <MediaSelectionSection
        {...handlers}
        mediaIds={item?.media_ids || []}
        primaryImageMediaId={item?.primary_image_media_id}
        buttonClassName="custom-button-class"
        gridColumns={3}
      />
    </div>
  );
};

// Pattern 2: With folder aliases for fallback
export const PatternWithFolderAliases = () => {
  const [item, setItem] = useState(null);
  const handlers = useMediaSelection(item, setItem);

  return (
    <MediaSelectionSection
      {...handlers}
      pickerFolder="events-2026"
      pickerFolderAliases={['events-2025', 'events-old', 'events']}
      mediaIds={item?.media_ids || []}
      primaryImageMediaId={item?.primary_image_media_id}
    />
  );
};

// Pattern 3: Multiple media sections on same page
export const PatternMultipleSections = () => {
  const [items, setItems] = useState({
    header: null,
    gallery: null,
    footer: null,
  });

  const handlersHeader = useMediaSelection(items.header, (v) =>
    setItems((p) => ({ ...p, header: v }))
  );
  const handlersGallery = useMediaSelection(items.gallery, (v) =>
    setItems((p) => ({ ...p, gallery: v }))
  );
  const handlersFooter = useMediaSelection(items.footer, (v) =>
    setItems((p) => ({ ...p, footer: v }))
  );

  return (
    <>
      <MediaSelectionSection
        label="Header Image"
        {...handlersHeader}
        pickerFolder="header"
      />
      <MediaSelectionSection
        label="Gallery Images"
        {...handlersGallery}
        pickerFolder="gallery"
      />
      <MediaSelectionSection
        label="Footer Image"
        {...handlersFooter}
        pickerFolder="footer"
      />
    </>
  );
};

// ============================================================================
// 10. TROUBLESHOOTING
// ============================================================================
/**
 * Q: Where are my files?
 * A: Check these locations:
 *    - Hook:       src/hooks/useMediaSelection.ts
 *    - Component:  src/components/MediaGrid.tsx
 *    - Component:  src/components/MediaSelectionSection.tsx
 *
 * Q: Why aren't my media showing?
 * A: Check:
 *    1. Are you logged in? (Token in localStorage)
 *    2. Is tenant_code correct?  
 *    3. Are media_ids correct?
 *    4. Check browser console for errors
 *
 * Q: Can I customize the grid?
 * A: Yes! Use MediaGrid directly or customize MediaSelectionSection props
 *
 * Q: How do I add drag-to-reorder?
 * A: Extend MediaGrid or create new component with react-beautiful-dnd
 *
 * Q: How do I filter media by type?
 * A: Use pickerKind prop ('image', 'video', 'file')
 */

export default SpacePageExample;
