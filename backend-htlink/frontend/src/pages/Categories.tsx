import React from 'react';
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

const Categories: React.FC = () => {
  const navigate = useNavigate();
  const { categories, loading, createCategory, updateCategory, deleteCategory } = useCategories();
  const { filters, filteredCategories, updateFilters } = useFilters(categories);
  
  const categoryModal = useModal<Category>();
  const translateModal = useModal<Category>();

  const handleSaveCategory = async (formData: CategoryFormData): Promise<void> => {
    try {
      if (categoryModal.modalData) {
        await updateCategory(categoryModal.modalData.id, formData);
      } else {
        await createCategory(formData);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      alert(t('errorSavingCategory'));
    }
  };

  const handleEditCategory = (category: Category): void => {
    categoryModal.openModal(category);
  };

  const handleDeleteCategory = async (id: number): Promise<void> => {
    // Tìm category để kiểm tra featureCount
    const category = categories.find(c => c.id === id);

    if (!category) {
      alert(t('categoryNotFound'));
      return;
    }

    // Kiểm tra xem category có feature con không
    if (category.featureCount > 0) {
      alert(t('cannotDeleteCategoryWithFeatures'));
      return;
    }

    try {
      await deleteCategory(id);
    } catch (error) {
      console.error('Error deleting category:', error);
      alert(t('errorDeletingCategory'));
    }
  };

  const handleViewFeatures = (categoryId: number): void => {
    navigate(`/features?category=${categoryId}`);
  };

  const handleTranslateCategory = (category: Category): void => {
    translateModal.openModal(category);
  };

  const handleAddCategory = (): void => {
    categoryModal.openModal();
  };

  const handleAcceptTranslation = async (categoryId: number, targetLang: Language, translatedData: any): Promise<void> => {
    try {
      console.log('=== SAVING CATEGORY TRANSLATION ===');
      console.log('Category ID:', categoryId);
      console.log('Target Language:', targetLang);
      console.log('Translation Data:', translatedData);

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
        console.log('Updating existing translation:', translationPayload);
        await categoriesApi.updateCategoryTranslation(
          categoryId,
          targetLang,
          {
            title: translatedData.title,
            short_desc: translatedData.description || '',
          }
        );
        alert(t('translationUpdated', { lang: targetLang.toUpperCase() }));
      } else {
        // Create new translation
        console.log('Creating new translation:', translationPayload);
        console.log('Full payload with category_id:', {
          category_id: categoryId,
          ...translationPayload
        });

        const result = await categoriesApi.createCategoryTranslation(categoryId, translationPayload);
        console.log('Translation created successfully:', result);
        alert(t('translationCreated', { lang: targetLang.toUpperCase() }));
      }

      translateModal.closeModal();

      // Refresh categories to show updated translations
      window.location.reload();
    } catch (error: any) {
      console.error('Error saving translation:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config);

      // Show detailed error message
      let errorMessage = t('errorSavingTranslation');
      if (error.response?.data?.detail) {
        errorMessage += `: ${error.response.data.detail}`;
      } else if (error.response?.data) {
        errorMessage += `: ${JSON.stringify(error.response.data)}`;
      } else {
        errorMessage += `: ${error.message}`;
      }

      alert(errorMessage);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg text-gray-600">Loading categories...</div>
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
    </div>
  );
};

export default Categories;

