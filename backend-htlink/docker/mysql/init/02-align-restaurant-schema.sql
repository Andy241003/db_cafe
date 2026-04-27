INSERT IGNORE INTO `locales` (`code`, `name`, `native_name`) VALUES
  ('vi', 'Vietnamese', 'Tiếng Việt'),
  ('en', 'English', 'English'),
  ('ko', 'Korean', '한국어'),
  ('ja', 'Japanese', '日本語'),
  ('zh', 'Chinese', '中文');

INSERT IGNORE INTO `plans` (`code`, `name`, `features_json`, `created_at`) VALUES
  (
    'restaurant-basic',
    'Restaurant Basic',
    JSON_OBJECT(
      'modules', JSON_ARRAY('restaurant', 'media', 'translations', 'analytics'),
      'max_branches', 10,
      'multi_language', true
    ),
    NOW()
  );
