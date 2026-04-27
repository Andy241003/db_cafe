from __future__ import annotations

import asyncio
import logging
import re
from typing import Iterable, List

import httpx
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

logger = logging.getLogger(__name__)


async def _google_translate_once(text: str, target: str, source: str = "auto") -> str:
    """Call the unofficial Google Translate endpoint (translate.googleapis.com).

    Returns translated text on success. Raises httpx.HTTPError on network/HTTP errors.
    """
    url = "https://translate.googleapis.com/translate_a/single"
    params = {
        "client": "gtx",
        "sl": source or "auto",
        "tl": target,
        "dt": "t",
        "q": text,
    }

    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()

    # Response is a nested array. Extract the translated segments.
    try:
        # data[0] is a list of [translated, original, ...]
        parts = [seg[0] for seg in data[0] if seg and len(seg) > 0]
        return "".join(parts)
    except Exception as e:
        logger.exception("Failed to parse Google translate response: %s", e)
        raise


@retry(wait=wait_exponential(min=0.5, max=4), stop=stop_after_attempt(3), retry=retry_if_exception_type(httpx.HTTPError))
async def _google_translate(text: str, target: str, source: str = "auto") -> str:
    return await _google_translate_once(text, target, source)


async def _libre_translate(text: str, target: str, source: str = "auto", is_html: bool = False, libre_url: str | None = None) -> str:
    """Fallback translator using LibreTranslate. If libre_url is None uses public instance.
    """
    url = (libre_url or "https://libretranslate.com") + "/translate"
    payload = {
        "q": text,
        "source": source or "auto",
        "target": target,
        "format": "html" if is_html else "text",
    }
    headers = {"Content-Type": "application/json"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()

    # LibreTranslate returns { translatedText: "..." }
    return data.get("translatedText") or data.get("result") or ""


def _extract_text_from_html(html: str) -> tuple[list[str], list[str]]:
    """Extract text segments from HTML, preserving structure.
    
    Returns:
        tuple: (text_segments, template_parts)
        - text_segments: list of text to translate
        - template_parts: list of HTML parts with placeholders {{N}}
    """
    # Pattern to match HTML tags
    tag_pattern = re.compile(r'(<[^>]+>)')
    
    parts = tag_pattern.split(html)
    text_segments = []
    template_parts = []
    placeholder_index = 0
    
    for part in parts:
        if not part:
            continue
            
        # If it's an HTML tag, keep it as-is
        if part.startswith('<'):
            template_parts.append(part)
        else:
            # It's text content
            stripped = part.strip()
            if stripped:
                # Add placeholder
                template_parts.append(f'{{{{TRANSLATE_{placeholder_index}}}}}')
                text_segments.append(part)
                placeholder_index += 1
            else:
                # Keep whitespace/newlines as-is
                template_parts.append(part)
    
    return text_segments, template_parts


def _reconstruct_html(translated_segments: list[str], template_parts: list[str]) -> str:
    """Reconstruct HTML from translated text segments and template."""
    result = ''.join(template_parts)
    
    # Replace placeholders with translated text
    for i, translated in enumerate(translated_segments):
        placeholder = f'{{{{TRANSLATE_{i}}}}}'
        result = result.replace(placeholder, translated)
    
    return result


async def translate_text(text: str, target: str, source: str = "auto", is_html: bool = False, libre_url: str | None = None) -> str:
    """Translate a single text string. Tries Google first, falls back to LibreTranslate.
    
    If is_html=True, extracts text from HTML tags, translates only text content,
    and preserves all HTML structure including images.
    """
    if not text:
        return text

    # If HTML mode, extract and translate only text content
    if is_html:
        try:
            text_segments, template_parts = _extract_text_from_html(text)
            
            if not text_segments:
                # No text to translate, return original
                return text
            
            # Translate each text segment
            translated_segments = []
            for segment in text_segments:
                try:
                    translated = await _google_translate(segment, target, source)
                    translated_segments.append(translated)
                except Exception as e:
                    logger.warning("Google translate failed for segment, trying LibreTranslate: %s", e)
                    try:
                        translated = await _libre_translate(segment, target, source, is_html=False, libre_url=libre_url)
                        translated_segments.append(translated)
                    except Exception:
                        # If both fail, use original
                        logger.error("Both translation services failed, using original text")
                        translated_segments.append(segment)
            
            # Reconstruct HTML with translated text
            return _reconstruct_html(translated_segments, template_parts)
            
        except Exception as e:
            logger.error("HTML translation failed: %s, returning original", e)
            return text
    
    # Plain text translation
    try:
        translated = await _google_translate(text, target, source)
        return translated
    except Exception as e:
        logger.warning("Google translate failed, falling back to LibreTranslate: %s", e)
        try:
            return await _libre_translate(text, target, source, is_html=False, libre_url=libre_url)
        except Exception as e2:
            logger.exception("LibreTranslate fallback failed: %s", e2)
            raise


async def translate_batch(texts: Iterable[str], target: str, source: str = "auto", is_html: bool = False, concurrent: int = 8, libre_url: str | None = None) -> List[str]:
    """Translate multiple texts in parallel.

    - texts: iterable of strings
    - concurrent: max number of concurrent HTTP calls
    """
    texts = list(texts)
    if not texts:
        return []

    semaphore = asyncio.Semaphore(concurrent)

    async def _worker(t: str) -> str:
        async with semaphore:
            return await translate_text(t, target, source, is_html=is_html, libre_url=libre_url)

    results = await asyncio.gather(*[_worker(t) for t in texts], return_exceptions=False)
    return results

