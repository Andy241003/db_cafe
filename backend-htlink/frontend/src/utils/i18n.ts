// src/utils/i18n.ts
// Simple internationalization utility for messages

export type SupportedLanguage = 'en' | 'vi' | 'ja' | 'ko' | 'fr';

const messages = {
  en: {
    cannotDeleteCategoryWithFeatures: 'Cannot delete this category. Please delete all child features/posts first.',
    categoryNotFound: 'Category not found.',
    errorDeletingCategory: 'Error deleting category. Please try again.',
    errorSavingCategory: 'Error saving category. Please try again.',
    translationUpdated: 'Translation for {lang} updated successfully!',
    translationCreated: 'Translation for {lang} created successfully!',
    errorSavingTranslation: 'Error saving translation',
  },
  vi: {
    cannotDeleteCategoryWithFeatures: 'Không thể xóa Category này. Vui lòng xóa hết các Feature/Post con trước.',
    categoryNotFound: 'Không tìm thấy Category.',
    errorDeletingCategory: 'Lỗi khi xóa category. Vui lòng thử lại.',
    errorSavingCategory: 'Lỗi khi lưu category. Vui lòng thử lại.',
    translationUpdated: 'Đã cập nhật bản dịch cho {lang} thành công!',
    translationCreated: 'Đã tạo bản dịch cho {lang} thành công!',
    errorSavingTranslation: 'Lỗi khi lưu bản dịch',
  },
  ja: {
    cannotDeleteCategoryWithFeatures: 'このカテゴリを削除できません。最初にすべての子機能/投稿を削除してください。',
    categoryNotFound: 'カテゴリが見つかりません。',
    errorDeletingCategory: 'カテゴリの削除中にエラーが発生しました。もう一度お試しください。',
    errorSavingCategory: 'カテゴリの保存中にエラーが発生しました。もう一度お試しください。',
    translationUpdated: '{lang}の翻訳が正常に更新されました！',
    translationCreated: '{lang}の翻訳が正常に作成されました！',
    errorSavingTranslation: '翻訳の保存中にエラーが発生しました',
  },
  ko: {
    cannotDeleteCategoryWithFeatures: '이 카테고리를 삭제할 수 없습니다. 먼저 모든 하위 기능/게시물을 삭제하십시오.',
    categoryNotFound: '카테고리를 찾을 수 없습니다.',
    errorDeletingCategory: '카테고리 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.',
    errorSavingCategory: '카테고리 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
    translationUpdated: '{lang} 번역이 성공적으로 업데이트되었습니다!',
    translationCreated: '{lang} 번역이 성공적으로 생성되었습니다!',
    errorSavingTranslation: '번역 저장 중 오류가 발생했습니다',
  },
  fr: {
    cannotDeleteCategoryWithFeatures: 'Impossible de supprimer cette catégorie. Veuillez d\'abord supprimer toutes les fonctionnalités/articles enfants.',
    categoryNotFound: 'Catégorie introuvable.',
    errorDeletingCategory: 'Erreur lors de la suppression de la catégorie. Veuillez réessayer.',
    errorSavingCategory: 'Erreur lors de la sauvegarde de la catégorie. Veuillez réessayer.',
    translationUpdated: 'Traduction pour {lang} mise à jour avec succès !',
    translationCreated: 'Traduction pour {lang} créée avec succès !',
    errorSavingTranslation: 'Erreur lors de la sauvegarde de la traduction',
  },
};

// Get user's preferred language
export const getUserLanguage = (): SupportedLanguage => {
  // Try to get from localStorage first
  const stored = localStorage.getItem('preferred_language');
  if (stored && stored in messages) {
    return stored as SupportedLanguage;
  }

  // Try to get from browser language
  const browserLang = navigator.language.split('-')[0];
  if (browserLang in messages) {
    return browserLang as SupportedLanguage;
  }

  // Default to English
  return 'en';
};

// Get translated message with interpolation support
export const t = (key: keyof typeof messages.en, params?: Record<string, string>): string => {
  const lang = getUserLanguage();
  let message = messages[lang][key] || messages.en[key];

  // Replace parameters in the message
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, value);
    });
  }

  return message;
};