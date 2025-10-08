from __future__ import annotations

import asyncio
import logging
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


async def translate_text(text: str, target: str, source: str = "auto", is_html: bool = False, libre_url: str | None = None) -> str:
    """Translate a single text string. Tries Google first, falls back to LibreTranslate.
    """
    if not text:
        return text

    try:
        translated = await _google_translate(text, target, source)
        return translated
    except Exception as e:
        logger.warning("Google translate failed, falling back to LibreTranslate: %s", e)
        try:
            return await _libre_translate(text, target, source, is_html=is_html, libre_url=libre_url)
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
