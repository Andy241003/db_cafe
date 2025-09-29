// src/components/properties/index.ts

// Composants principaux
export { default as Properties } from '../../pages/Properties';
export { HotelItem } from './HotelItem';
export { SearchFilters } from './SearchFilters';

// Modals
export { AddHotelModal } from './AddHotelModal';
export { EditHotelPostModal } from './EditHotelPostModal';
export { TranslateModal } from './TranslateModal';

// Composants utilitaires
export { IconSelector } from './IconSelector';
export { ColorSelector } from './ColorSelector';
export { RichTextEditor } from './RichTextEditor';

// Types
export type { Hotel, HotelPost, HotelFormData, TranslationData } from '../../types/properties';

// Hook
export { useProperties } from '../../hooks/useProperties';