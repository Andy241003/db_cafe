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

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { filters, filteredCategories, updateFilters } = useFilters(categories);
  
  const categoryModal = useModal<Category>();
  const translateModal = useModal<Category>();

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

  const handleAcceptTranslation = async (categoryId: number, targetLang: Language, translatedData: any): Promise<void> => {
    try {
      // Import categoriesApi for translation operations
      const { categoriesApi } = await import('../services/categoriesApi');

      // Check if translation already exists for this locale
      const category = categories.find(c => c.id === categoryId);
      const existingTranslation = category?.translations?.[targetLang];

      const translationPayload = {
        locale: targetLang,
        title: translatedData.title,
        short_desc: translatedData.description || '',
      };

      if (existingTranslation) {
        // Update existing translation
        await categoriesApi.updateCategoryTranslation(
          categoryId,
          targetLang,
          {
            title: translatedData.title,
            short_desc: translatedData.description || '',
          }
        );
        toast.success(t('translationUpdated', { lang: targetLang.toUpperCase() }));
      } else {
        // Create new translation
        await categoriesApi.createCategoryTranslation(categoryId, translationPayload);
        toast.success(t('translationCreated', { lang: targetLang.toUpperCase() }));
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

      {/* Categories Grid */}
      {filteredCategories.length === 0 ? (
        <div className="text-center text-gray-500 py-16 bg-white rounded-lg shadow">
          <h3 className="text-xl font-semibold mb-2">No Categories Found</h3>
          <p>Try adjusting your filters or add a new category to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onEdit={() => handleEditCategory(category)}
              onDelete={() => handleDeleteCategory(category.id)}
              onViewFeatures={() => handleViewFeatures(category.id)}
              onTranslate={() => handleTranslateCategory(category)}
            />
          ))}
        </div>
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