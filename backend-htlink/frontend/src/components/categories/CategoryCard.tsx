// src/components/categories/CategoryCard.tsx
import React from 'react';
import type { Category } from '../../types/categories';

interface CategoryCardProps {
  category: Category;
  onEdit: (category: Category) => void;
  onDelete: (id: number) => void;
  onViewFeatures: (id: number) => void;
  onTranslate: (category: Category) => void;
}

const ICON_CLASS: Record<string, string> = {
  'info-circle': 'fa-info-circle',
  'concierge-bell': 'fa-concierge-bell',
  'building': 'fa-building',
  'hiking': 'fa-hiking',
  'car': 'fa-car',
  'spa': 'fa-spa',
  'utensils': 'fa-utensils',
  'shopping-bag': 'fa-shopping-bag',
  'share-alt': 'fa-share-alt',
  'file-contract': 'fa-file-contract',
  'star': 'fa-star',
  'heart': 'fa-heart',
};


const GRADIENT_COLORS: Record<string, string> = {
  'info-circle': 'from-indigo-500 to-purple-600',
  'concierge-bell': 'from-blue-500 to-blue-600',
  'building': 'from-green-500 to-green-600',
  'hiking': 'from-orange-500 to-orange-600',
  'star': 'from-purple-500 to-purple-600',
  'heart': 'from-pink-500 to-red-500',
  'car': 'from-gray-500 to-gray-600',
  'spa': 'from-teal-500 to-teal-600',
  'utensils': 'from-yellow-500 to-orange-500',
  'shopping-bag': 'from-pink-400 to-pink-500',
  'share-alt': 'from-cyan-500 to-blue-500',
  'file-contract': 'from-slate-500 to-slate-600'
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onEdit,
  onDelete,
  onViewFeatures,
  onTranslate,
}) => {
  const gradient = GRADIENT_COLORS[category.icon] ?? 'from-gray-500 to-gray-600';

  const handleEdit = () => onEdit(category);
  const handleDelete = () => onDelete(category.id);
  const handleViewFeatures = () => onViewFeatures(category.id);
  const handleTranslate = () => onTranslate(category);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Header with icon and menu */}
      <div className="flex items-start justify-between p-4 pb-3">
        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white text-lg shadow-sm`}>
          <i className={`fas ${ICON_CLASS[category.icon] ?? 'fa-box'}`}></i>
        </div>
        
        {/* Type badge and menu */}
        <div className="flex flex-col items-end gap-1">
          {category.type === 'system' && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-600 tracking-wide">
              SYSTEM
            </span>
          )}
          <button className="text-gray-400 hover:text-gray-600 p-1">
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Title and description */}
      <div className="px-4 pb-3">
        <h3 className="text-base font-semibold text-gray-900 mb-1.5">
          {category.translations?.en?.title ?? 'Untitled'}
        </h3>
        <p className="text-gray-600 text-xs leading-snug">
          {category.translations?.en?.description ?? 'No description available'}
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
