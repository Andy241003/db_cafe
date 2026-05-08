from typing import Any, Optional


TITLE_TRANSLATIONS_KEY = "title_translations"
TITLE_LOCALE_PRIORITY = ("vi", "en")


def clean_title_translations(value: Any) -> dict[str, str]:
    if not isinstance(value, dict):
        return {}

    cleaned: dict[str, str] = {}
    for locale, title in value.items():
        if not isinstance(locale, str) or not isinstance(title, str):
            continue

        normalized_title = title.strip()
        if normalized_title:
            cleaned[locale] = normalized_title

    return cleaned


def pick_primary_title(
    title_translations: dict[str, str],
    fallback_title: Optional[str] = None,
) -> Optional[str]:
    for locale in TITLE_LOCALE_PRIORITY:
        if title_translations.get(locale):
            return title_translations[locale]

    if title_translations:
        return next(iter(title_translations.values()))

    if isinstance(fallback_title, str):
        normalized_fallback = fallback_title.strip()
        if normalized_fallback:
            return normalized_fallback

    return None


def sync_title_translations(
    settings_json: Optional[dict],
    *,
    title_translations: Any = None,
    fallback_title: Optional[str] = None,
    key: str = TITLE_TRANSLATIONS_KEY,
) -> tuple[dict, dict[str, str], Optional[str]]:
    next_settings = dict(settings_json or {})
    raw_translations = title_translations if title_translations is not None else next_settings.get(key)
    cleaned_translations = clean_title_translations(raw_translations)

    if cleaned_translations:
        next_settings[key] = cleaned_translations
    else:
        next_settings.pop(key, None)

    primary_title = pick_primary_title(cleaned_translations, fallback_title)
    return next_settings, cleaned_translations, primary_title
