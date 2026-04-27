// src/components/categories/CategoryCard.tsx
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { findIconByName, DEFAULT_ICON } from '../../config/icons';
import { getIconGradient } from '../../utils/iconColors';
import type { Category } from '../../types/categories';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface CategoryCardProps {
  category: Category;
  rank: number;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onViewFeatures: (id: number) => void;
  onTranslate: (category: Category) => void;
  onIncreasePriority?: (category: Category) => void;
  onDecreasePriority?: (category: Category) => void;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  rank,
  onEdit,
  onDelete,
  onViewFeatures,
  onTranslate,
  onIncreasePriority,
  onDecreasePriority,
}) => {
  // Sortable hooks
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: category.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Get gradient from centralized utility based on icon category
  const gradient = getIconGradient(category.icon);
  
  // Get default language from localStorage
  const getDefaultLanguage = () => {
    try {
      const storedSettings = localStorage.getItem('property_settings');
      if (storedSettings) {
        const parsed = JSON.parse(storedSettings);
        return parsed.defaultLanguage || 'en';
      }
    } catch (error) {
      // Silent fallback
    }
    return 'en';
  };
  
  const defaultLanguage = getDefaultLanguage();
  
  // Get title and description in default language with fallback
  const getLocalizedText = (field: 'title' | 'description') => {
    // Try default language first
    const defaultText = category.translations?.[defaultLanguage]?.[field];
    if (defaultText) return defaultText;
    
    // Try fallback language (en)
    const fallbackText = category.translations?.en?.[field];
    if (fallbackText) return fallbackText;
    
    // Try any available language
    const availableTranslations = Object.values(category.translations || {});
    for (const translation of availableTranslations) {
      if ((translation as any)?.[field]) {
        return (translation as any)[field];
      }
    }
    
    return field === 'title' ? 'Untitled' : 'No description available';
  };

  const handleEdit = () => onEdit(category);
  const handleDelete = () => onDelete(category.id);
  const handleViewFeatures = () => onViewFeatures(category.id);
  const handleTranslate = () => onTranslate(category);

  // Get icon from centralized config
  const iconObject = findIconByName(category.icon) || DEFAULT_ICON;

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm 
        hover:shadow-md transition-shadow
        ${isDragging ? 'cursor-grabbing ring-2 ring-blue-400' : 'cursor-grab'}
      `}
    >
      {/* Header with icon and menu */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-sm`}>
            <FontAwesomeIcon icon={iconObject} />
          </div>
          
          {/* Ranking Badge - Show rank instead of priority */}
          <div className="flex items-center justify-center min-w-[40px]">
            <div className={`
              px-2.5 py-1 rounded-lg font-bold text-sm
              ${category.priority > 0 
                ? 'bg-gradient-to-br from-amber-500 to-orange-600 text-white shadow-md' 
                : 'bg-gray-100 text-gray-400 border border-gray-200'
              }
            `}>
              #{rank}
            </div>
          </div>
        </div>
        
        {/* Type badge and priority controls */}
        <div className="flex flex-col items-end gap-1">
          {category.type === 'system' && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-600 tracking-wide">
              SYSTEM
            </span>
          )}
          
          {/* Ranking Controls */}
          {(onIncreasePriority || onDecreasePriority) && (
            <div className="flex gap-1">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onIncreasePriority?.(category);
                }}
                className="w-6 h-6 flex items-center justify-center text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
                </svg>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDecreasePriority?.(category);
                }}
                disabled={category.priority <= 0}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-50 rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Title and description */}
      <div className="px-4 pb-3">
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
          {getLocalizedText('title')}
        </h3>
        <p className="text-gray-600 text-xs leading-snug">
          {getLocalizedText('description')}
        </p>
      </div>

      {/* Stats */}
      <div className="px-4 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <i className={"fas fa-puzzle-piece"}></i>
          <span className="font-medium text-gray-900">{category.featureCount}</span>
          <span className="text-gray-500 text-xs">features</span>
        </div>

        <span className={`px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide rounded-full ${
          category.status === 'active'
            ? 'bg-green-100 text-green-700'
            : 'bg-red-100 text-red-700'
        }`}>
          {category.status}
        </span>
      </div>

      {/* Action buttons */}
      <div className="p-4 pt-0 space-y-1.5">
        {/* First row */}
        <div className="flex gap-2">
          <button
            onClick={handleEdit}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>

          <button
            onClick={handleViewFeatures}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View
          </button>
        </div>

        {/* Second row */}
        <div className="flex gap-2">
          <button
            onClick={handleTranslate}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
            </svg>
            Translate
          </button>

          <button
            onClick={handleDelete}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;

