export type TitleTranslations = Record<string, string>;

const TITLE_LOCALE_PRIORITY = ['vi', 'en'];

const normalizeValue = (value: unknown): string => (typeof value === 'string' ? value.trim() : '');

export const compactTitleTranslations = (translations: TitleTranslations): TitleTranslations =>
  Object.fromEntries(
    Object.entries(translations).filter(([, value]) => normalizeValue(value).length > 0),
  );

export const pickPrimaryTitle = (
  translations: TitleTranslations,
  fallbackTitle = '',
): string => {
  const compacted = compactTitleTranslations(translations);

  for (const locale of TITLE_LOCALE_PRIORITY) {
    if (compacted[locale]) {
      return compacted[locale];
    }
  }

  const firstValue = Object.values(compacted)[0];
  if (firstValue) {
    return firstValue;
  }

  return normalizeValue(fallbackTitle);
};

export const buildTitleTranslations = (
  locales: string[],
  rawTranslations: unknown,
  fallbackTitle = '',
): TitleTranslations => {
  const nextTranslations = Object.fromEntries(locales.map((locale) => [locale, ''])) as TitleTranslations;

  if (rawTranslations && typeof rawTranslations === 'object' && !Array.isArray(rawTranslations)) {
    Object.entries(rawTranslations as Record<string, unknown>).forEach(([locale, value]) => {
      nextTranslations[locale] = normalizeValue(value);
    });
  }

  const hasAnyValue = Object.values(nextTranslations).some((value) => value.length > 0);
  const normalizedFallback = normalizeValue(fallbackTitle);

  if (!hasAnyValue && normalizedFallback) {
    const targetLocale = locales.find((locale) => TITLE_LOCALE_PRIORITY.includes(locale)) || locales[0] || 'vi';
    nextTranslations[targetLocale] = normalizedFallback;
  }

  return nextTranslations;
};

export const getScopedTitleTranslations = (
  settingsJson: Record<string, any> | null | undefined,
  prefix: string,
  locales: string[],
): TitleTranslations =>
  buildTitleTranslations(
    locales,
    settingsJson?.[`${prefix}_title_translations`],
    settingsJson?.[`${prefix}_vr_title`] || '',
  );

export const applyScopedTitleTranslations = (
  settingsJson: Record<string, any> | null | undefined,
  prefix: string,
  translations: TitleTranslations,
): Record<string, any> => ({
  ...(settingsJson || {}),
  [`${prefix}_title_translations`]: compactTitleTranslations(translations),
  [`${prefix}_vr_title`]: pickPrimaryTitle(translations),
});
