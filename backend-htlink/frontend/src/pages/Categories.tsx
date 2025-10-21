import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { useFilters } from '../hooks/useFilters';
import { useModal } from '../hooks/useModal';
import { SearchFilters } from '../components/categories/SearchFilters';
import { CategoryCard } from '../components/categories/CategoryCard';
import { CategoryModal } from '../components/categories/CategoryModal';
import { TranslateModal } from '../components/categories/TranslateModal';
import { t } from '../utils/i18n';
import type { Category, CategoryFormData, Language } from '../types/categories';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory, refreshCategories } = useCategories();
  const { filters, filteredCategories, updateFilters } = useFilters(categories);
  
  const categoryModal = useModal<Category>();
  const translateModal = useModal<Category>();

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px movement to start drag
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Confirm Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    variant?: 'danger' | 'warning' | 'primary';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  });

  const handleSaveCategory = async (formData: CategoryFormData): Promise<void> => {
    try {
      if (categoryModal.modalData) {
        await updateCategory(categoryModal.modalData.id, formData);
        toast.success('Category updated successfully!');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully!');
      }
    } catch (error) {
      toast.error(t('errorSavingCategory'));
    }
  };

  const handleEditCategory = (category: Category): void => {
    categoryModal.openModal(category);
  };

  const handleDeleteCategory = (id: number): void => {
    // Tìm category để kiểm tra featureCount
    const category = categories.find(c => c.id === id);

    if (!category) {
      toast.error(t('categoryNotFound'));
      return;
    }

    // Kiểm tra xem category có feature con không
    if (category.featureCount > 0) {
      toast.error(t('cannotDeleteCategoryWithFeatures'));
      return;
    }

    setConfirmModal({
      isOpen: true,
      title: 'Delete Category',
      message: 'Are you sure you want to delete this category? This action cannot be undone.',
      confirmText: 'Delete',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteCategory(id);
          toast.success('Category deleted successfully!');
        } catch (error) {
          toast.error(t('errorDeletingCategory'));
        }
      },
    });
  };

  const handleViewFeatures = (categoryId: number): void => {
    // Find category to get its slug
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      // Navigate to Features page with category slug as filter
      navigate(`/features?category=${category.slug}`);
    } else {
      navigate('/features');
    }
  };

  const handleTranslateCategory = (category: Category): void => {
    translateModal.openModal(category);
  };

  const handleAddCategory = (): void => {
    categoryModal.openModal();
  };

  // Handle drag end - update priorities based on new order
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over || active.id === over.id) return;

    const draggedCategory = filteredCategories.find((cat) => cat.id === active.id);
    const targetCategory = filteredCategories.find((cat) => cat.id === over.id);

    if (!draggedCategory || !targetCategory) return;

    // Sort categories by priority DESC (highest priority first)
    const sortedCategories = [...filteredCategories].sort((a, b) => (b.priority || 0) - (a.priority || 0));
    
    const draggedIndex = sortedCategories.findIndex((cat) => cat.id === active.id);
    const targetIndex = sortedCategories.findIndex((cat) => cat.id === over.id);
    
    let newPriority: number;
    
    // Determine if dragging UP or DOWN
    if (draggedIndex > targetIndex) {
      // Dragging UP (to higher priority)
      if (targetIndex === 0) {
        // Dropped on #1 position - become new #1
        newPriority = (sortedCategories[0].priority || 0) + 1;
      } else {
        // Dropped between items - get priority between the two neighbors
        const above = sortedCategories[targetIndex - 1];
        const below = sortedCategories[targetIndex];
        const priorityAbove = above.priority || 0;
        const priorityBelow = below.priority || 0;
        
        // If there's a gap, use middle value, otherwise add 1 to below
        if (priorityAbove - priorityBelow > 1) {
          newPriority = Math.floor((priorityAbove + priorityBelow) / 2);
        } else {
          newPriority = priorityBelow + 1;
        }
      }
    } else {
      // Dragging DOWN (to lower priority)
      if (targetIndex === sortedCategories.length - 1) {
        // Dropped on last position
        const lastPriority = sortedCategories[sortedCategories.length - 1].priority || 0;
        newPriority = Math.max(0, lastPriority - 1);
      } else {
        // Dropped between items
        const above = sortedCategories[targetIndex];
        const below = sortedCategories[targetIndex + 1];
        const priorityAbove = above.priority || 0;
        const priorityBelow = below.priority || 0;
        
        // If there's a gap, use middle value, otherwise subtract 1 from above
        if (priorityAbove - priorityBelow > 1) {
          newPriority = Math.floor((priorityAbove + priorityBelow) / 2);
        } else {
          newPriority = Math.max(0, priorityAbove - 1);
        }
      }
    }
    
    try {
      // Only update the dragged category's priority
      await updateCategory(draggedCategory.id, {
        slug: draggedCategory.slug,
        icon: draggedCategory.icon,
        priority: newPriority,
        translations: draggedCategory.translations as any
      });
      
      await refreshCategories();
    } catch (error) {
      toast.error('Failed to reorder categories');
    }
  };

  // Quick priority adjustment handlers
  const handleIncreasePriority = async (category: Category) => {
    try {
      const newPriority = (category.priority || 0) + 1;
      await updateCategory(category.id, {
        slug: category.slug,
        icon: category.icon,
        priority: newPriority,
        translations: category.translations as any
      });
      await refreshCategories();
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handleDecreasePriority = async (category: Category) => {
    try {
      const currentPriority = category.priority || 0;
      if (currentPriority <= 0) return;
      
      const newPriority = currentPriority - 1;
      await updateCategory(category.id, {
        slug: category.slug,
        icon: category.icon,
        priority: newPriority,
        translations: category.translations as any
      });
      await refreshCategories();
    } catch (error) {
      toast.error('Failed to update priority');
    }
  };

  const handleAcceptTranslation = async (categoryId: number, targetLang: Language, translatedData: any): Promise<void> => {
    try {
      // Import categoriesApi for translation operations
      const { categoriesApi } = await import('../services/categoriesApi');

      const translationPayload = {
        locale: targetLang,
        title: translatedData.title,
        short_desc: translatedData.description || '',
      };

      try {
        // Try to update first (faster if it exists)
        await categoriesApi.updateCategoryTranslation(
          categoryId,
          targetLang,
          {
            title: translatedData.title,
            short_desc: translatedData.description || '',
          }
        );
        toast.success(t('translationUpdated', { lang: targetLang.toUpperCase() }));
      } catch (updateError: any) {
        // If update fails with 404, create new translation
        if (updateError.response?.status === 404) {
          await categoriesApi.createCategoryTranslation(categoryId, translationPayload);
          toast.success(t('translationCreated', { lang: targetLang.toUpperCase() }));
        } else {
          // Re-throw other errors
          throw updateError;
        }
      }

      translateModal.closeModal();

      // Refresh categories to show updated translations
      window.location.reload();
    } catch (error: any) {
      // Show error message
      const errorMessage = error.response?.data?.detail || error.message || t('errorSavingTranslation');
      toast.error(`${t('errorSavingTranslation')}: ${errorMessage}`);
    }
  };

  if (loading && categories.length === 0) {
    return (
      <div className="p-6 bg-gray-50 min-h-screen">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-9 w-64 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-5 w-96 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="h-10 w-36 bg-gray-200 rounded-lg animate-pulse"></div>
          </div>
        </div>

        {/* Search Skeleton */}
        <div className="mb-6">
          <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>

        {/* Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                <div className="flex gap-2">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                </div>
              </div>
              <div className="h-6 w-3/4 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 w-full bg-gray-200 rounded mb-4"></div>
              <div className="h-9 w-full bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Feature Categories</h1>
            <p className="text-gray-600 mt-1">Organize your hotel features into logical categories.</p>
          </div>
          <button
            onClick={handleAddCategory}
            className="px-5 py-2.5 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all"
          >
            + Add Category
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="mb-6">
        <SearchFilters filters={filters} onFiltersChange={updateFilters} />
      </div>

      {/* Categories Grid with Drag & Drop */}
      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
          <p>Try adjusting your filters or add a new category to get started.</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={filteredCategories.map((cat) => cat.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCategories.map((category) => {
                // Calculate ranking: sort by priority desc, then assign rank
                const sortedCategories = [...filteredCategories].sort((a, b) => (b.priority || 0) - (a.priority || 0));
                const rank = sortedCategories.findIndex(c => c.id === category.id) + 1;
                
                return (
                  <CategoryCard
                    key={category.id}
                    category={category}
                    rank={rank}
                    onEdit={() => handleEditCategory(category)}
                    onDelete={() => handleDeleteCategory(category.id)}
                    onViewFeatures={() => handleViewFeatures(category.id)}
                    onTranslate={() => handleTranslateCategory(category)}
                    onIncreasePriority={handleIncreasePriority}
                    onDecreasePriority={handleDecreasePriority}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModal.isOpen}
        onClose={categoryModal.closeModal}
        onSave={handleSaveCategory}
        category={categoryModal.modalData ?? undefined}
      />

      {/* Translate Modal */}
      <TranslateModal
        isOpen={translateModal.isOpen}
        onClose={translateModal.closeModal}
        category={translateModal.modalData}
        onAcceptTranslation={handleAcceptTranslation}
      />

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.variant}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal({ ...confirmModal, isOpen: false })}
      />
    </div>
  );
};

export default Categories;