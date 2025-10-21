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
    // Permission errors
    permissionDenied: 'You do not have permission to perform this action. Please contact the Administrator.',
    permissionDeniedShort: 'Access denied. Please contact Admin.',
    cannotCreateUser: 'You do not have permission to create users with this role.',
    cannotEditUser: 'You do not have permission to edit this user.',
    cannotDeleteUser: 'You do not have permission to delete this user.',
    cannotDeleteContent: 'You do not have permission to delete this content.',
    cannotEditContent: 'You do not have permission to edit this content.',
    cannotCreateContent: 'You do not have permission to create this content.',
  },
  vi: {
    cannotDeleteCategoryWithFeatures: 'Không thể xóa Category này. Vui lòng xóa hết các Feature/Post con trước.',
    categoryNotFound: 'Không tìm thấy Category.',
    errorDeletingCategory: 'Lỗi khi xóa category. Vui lòng thử lại.',
    errorSavingCategory: 'Lỗi khi lưu category. Vui lòng thử lại.',
    translationUpdated: 'Đã cập nhật bản dịch cho {lang} thành công!',
    translationCreated: 'Đã tạo bản dịch cho {lang} thành công!',
    errorSavingTranslation: 'Lỗi khi lưu bản dịch',
    // Permission errors
    permissionDenied: 'Bạn không có quyền thực hiện hành động này. Vui lòng liên hệ Quản trị viên.',
    permissionDeniedShort: 'Không có quyền truy cập. Vui lòng liên hệ Admin.',
    cannotCreateUser: 'Bạn không có quyền tạo người dùng với vai trò này.',
    cannotEditUser: 'Bạn không có quyền chỉnh sửa người dùng này.',
    cannotDeleteUser: 'Bạn không có quyền xóa người dùng này.',
    cannotDeleteContent: 'Bạn không có quyền xóa nội dung này.',
    cannotEditContent: 'Bạn không có quyền chỉnh sửa nội dung này.',
    cannotCreateContent: 'Bạn không có quyền tạo nội dung này.',
  },
  ja: {
    cannotDeleteCategoryWithFeatures: 'このカテゴリを削除できません。最初にすべての子機能/投稿を削除してください。',
    categoryNotFound: 'カテゴリが見つかりません。',
    errorDeletingCategory: 'カテゴリの削除中にエラーが発生しました。もう一度お試しください。',
    errorSavingCategory: 'カテゴリの保存中にエラーが発生しました。もう一度お試しください。',
    translationUpdated: '{lang}の翻訳が正常に更新されました！',
    translationCreated: '{lang}の翻訳が正常に作成されました！',
    errorSavingTranslation: '翻訳の保存中にエラーが発生しました',
    // Permission errors
    permissionDenied: 'この操作を実行する権限がありません。管理者にお問い合わせください。',
    permissionDeniedShort: 'アクセス拒否。管理者にお問い合わせください。',
    cannotCreateUser: 'このロールでユーザーを作成する権限がありません。',
    cannotEditUser: 'このユーザーを編集する権限がありません。',
    cannotDeleteUser: 'このユーザーを削除する権限がありません。',
    cannotDeleteContent: 'このコンテンツを削除する権限がありません。',
    cannotEditContent: 'このコンテンツを編集する権限がありません。',
    cannotCreateContent: 'このコンテンツを作成する権限がありません。',
  },
  ko: {
    cannotDeleteCategoryWithFeatures: '이 카테고리를 삭제할 수 없습니다. 먼저 모든 하위 기능/게시물을 삭제하십시오.',
    categoryNotFound: '카테고리를 찾을 수 없습니다.',
    errorDeletingCategory: '카테고리 삭제 중 오류가 발생했습니다. 다시 시도해 주세요.',
    errorSavingCategory: '카테고리 저장 중 오류가 발생했습니다. 다시 시도해 주세요.',
    translationUpdated: '{lang} 번역이 성공적으로 업데이트되었습니다!',
    translationCreated: '{lang} 번역이 성공적으로 생성되었습니다!',
    errorSavingTranslation: '번역 저장 중 오류가 발생했습니다',
    // Permission errors
    permissionDenied: '이 작업을 수행할 권한이 없습니다. 관리자에게 문의하십시오.',
    permissionDeniedShort: '액세스 거부됨. 관리자에게 문의하십시오.',
    cannotCreateUser: '이 역할로 사용자를 생성할 권한이 없습니다.',
    cannotEditUser: '이 사용자를 편집할 권한이 없습니다.',
    cannotDeleteUser: '이 사용자를 삭제할 권한이 없습니다.',
    cannotDeleteContent: '이 콘텐츠를 삭제할 권한이 없습니다.',
    cannotEditContent: '이 콘텐츠를 편집할 권한이 없습니다.',
    cannotCreateContent: '이 콘텐츠를 생성할 권한이 없습니다.',
  },
  fr: {
    cannotDeleteCategoryWithFeatures: 'Impossible de supprimer cette catégorie. Veuillez d\'abord supprimer toutes les fonctionnalités/articles enfants.',
    categoryNotFound: 'Catégorie introuvable.',
    errorDeletingCategory: 'Erreur lors de la suppression de la catégorie. Veuillez réessayer.',
    errorSavingCategory: 'Erreur lors de la sauvegarde de la catégorie. Veuillez réessayer.',
    translationUpdated: 'Traduction pour {lang} mise à jour avec succès !',
    translationCreated: 'Traduction pour {lang} créée avec succès !',
    errorSavingTranslation: 'Erreur lors de la sauvegarde de la traduction',
    // Permission errors
    permissionDenied: 'Vous n\'avez pas la permission d\'effectuer cette action. Veuillez contacter l\'Administrateur.',
    permissionDeniedShort: 'Accès refusé. Veuillez contacter l\'Admin.',
    cannotCreateUser: 'Vous n\'avez pas la permission de créer des utilisateurs avec ce rôle.',
    cannotEditUser: 'Vous n\'avez pas la permission de modifier cet utilisateur.',
    cannotDeleteUser: 'Vous n\'avez pas la permission de supprimer cet utilisateur.',
    cannotDeleteContent: 'Vous n\'avez pas la permission de supprimer ce contenu.',
    cannotEditContent: 'Vous n\'avez pas la permission de modifier ce contenu.',
    cannotCreateContent: 'Vous n\'avez pas la permission de créer ce contenu.',
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
  const langMessages = messages[lang] as Record<string, string>;
  const enMessages = messages.en as Record<string, string>;
  let message = langMessages[key] || enMessages[key] || key;

  // Replace parameters in the message
  if (params) {
    Object.entries(params).forEach(([param, value]) => {
      message = message.replace(`{${param}}`, value);
    });
  }

  return message;
};