"""
Enhanced Translation Service with:
- DeepL API (fast, high quality, context-aware)
- Google Cloud Translation API (with glossary support)
- Smart chunking for long texts
- Hotel/hospitality industry glossary
- Fallback to free services
"""
from __future__ import annotations

import asyncio
import logging
import os
import re
from typing import Iterable, List, Optional

import httpx
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

logger = logging.getLogger(__name__)

# Hotel/Hospitality Industry Glossary (EN -> VI, JA, KO, etc.)
HOTEL_GLOSSARY = {
    "en": {
        "check-in": {"vi": "nhận phòng", "ja": "チェックイン", "ko": "체크인"},
        "check-out": {"vi": "trả phòng", "ja": "チェックアウト", "ko": "체크아웃"},
        "suite": {"vi": "phòng suite", "ja": "スイートルーム", "ko": "스위트룸"},
        "deluxe room": {"vi": "phòng cao cấp", "ja": "デラックスルーム", "ko": "디럭스룸"},
        "superior room": {"vi": "phòng hạng sang", "ja": "スーペリアルーム", "ko": "슈페리어룸"},
        "standard room": {"vi": "phòng tiêu chuẩn", "ja": "スタンダードルーム", "ko": "스탠다드룸"},
        "amenities": {"vi": "tiện nghi", "ja": "アメニティ", "ko": "편의시설"},
        "concierge": {"vi": "lễ tân", "ja": "コンシェルジュ", "ko": "컨시어지"},
        "housekeeping": {"vi": "dọn phòng", "ja": "ハウスキーピング", "ko": "하우스키핑"},
        "room service": {"vi": "dịch vụ phòng", "ja": "ルームサービス", "ko": "룸서비스"},
        "spa": {"vi": "spa", "ja": "スパ", "ko": "스파"},
        "wellness": {"vi": "chăm sóc sức khỏe", "ja": "ウェルネス", "ko": "웰니스"},
        "complimentary": {"vi": "miễn phí", "ja": "無料", "ko": "무료"},
        "reservation": {"vi": "đặt phòng", "ja": "予約", "ko": "예약"},
        "booking": {"vi": "đặt chỗ", "ja": "予約", "ko": "예약"},
        "vacancy": {"vi": "phòng trống", "ja": "空室", "ko": "빈 방"},
        "occupancy": {"vi": "tỷ lệ lấp đầy", "ja": "占有率", "ko": "객실 점유율"},
        "all-inclusive": {"vi": "trọn gói", "ja": "オールインクルーシブ", "ko": "올인클루시브"},
        "breakfast included": {"vi": "bao gồm bữa sáng", "ja": "朝食付き", "ko": "조식 포함"},
        "minibar": {"vi": "tủ lạnh mini", "ja": "ミニバー", "ko": "미니바"},
        "balcony": {"vi": "ban công", "ja": "バルコニー", "ko": "발코니"},
        "ocean view": {"vi": "view biển", "ja": "オーシャンビュー", "ko": "오션뷰"},
        "city view": {"vi": "view thành phố", "ja": "シティビュー", "ko": "시티뷰"},
        "pool view": {"vi": "view hồ bơi", "ja": "プールビュー", "ko": "풀뷰"},
        "fitness center": {"vi": "phòng gym", "ja": "フィットネスセンター", "ko": "피트니스 센터"},
        "business center": {"vi": "trung tâm dịch vụ", "ja": "ビジネスセンター", "ko": "비즈니스 센터"},
        "meeting room": {"vi": "phòng họp", "ja": "会議室", "ko": "회의실"},
        "ballroom": {"vi": "phòng tiệc", "ja": "宴会場", "ko": "연회장"},
    }
}


def _apply_glossary(text: str, target_lang: str, source_lang: str = "en") -> str:
    """Apply hotel industry glossary to text before translation."""
    if source_lang not in HOTEL_GLOSSARY:
        return text
    
    glossary = HOTEL_GLOSSARY[source_lang]
    result = text
    
    # Replace terms (case-insensitive)
    for term, translations in glossary.items():
        if target_lang in translations:
            # Use word boundaries to avoid partial matches
            pattern = re.compile(r'\b' + re.escape(term) + r'\b', re.IGNORECASE)
            result = pattern.sub(translations[target_lang], result)
    
    return result


def _smart_chunk_text(text: str, max_chunk_size: int = 5000) -> List[str]:
    """
    Smart chunking for long texts.
    Splits by paragraphs/sentences to maintain context.
    """
    if len(text) <= max_chunk_size:
        return [text]
    
    chunks = []
    
    # First, try splitting by double newlines (paragraphs)
    paragraphs = text.split('\n\n')
    current_chunk = ""
    
    for para in paragraphs:
        if len(current_chunk) + len(para) + 2 <= max_chunk_size:
            current_chunk += para + "\n\n"
        else:
            if current_chunk:
                chunks.append(current_chunk.strip())
            current_chunk = para + "\n\n"
    
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    # If any chunk is still too large, split by sentences
    final_chunks = []
    for chunk in chunks:
        if len(chunk) <= max_chunk_size:
            final_chunks.append(chunk)
        else:
            # Split by sentences
            sentences = re.split(r'(?<=[.!?])\s+', chunk)
            current = ""
            for sentence in sentences:
                if len(current) + len(sentence) + 1 <= max_chunk_size:
                    current += sentence + " "
                else:
                    if current:
                        final_chunks.append(current.strip())
                    current = sentence + " "
            if current:
                final_chunks.append(current.strip())
    
    return final_chunks


def _extract_text_from_html(html: str, batch_mode: bool = True) -> tuple[list[str], list[str]]:
    """
    Extract text segments from HTML, preserving structure.
    
    Args:
        html: HTML string to process
        batch_mode: If True, merge adjacent text nodes for faster batch translation
                   If False, translate each text node individually (slower but more granular)
    
    Returns:
        tuple: (text_segments, template_parts)
        - text_segments: list of text to translate
        - template_parts: list of HTML parts with placeholders {{N}}
    """
    # Pattern to match HTML tags (including img, svg, icon tags)
    tag_pattern = re.compile(r'(<[^>]+>)')
    
    parts = tag_pattern.split(html)
    text_segments = []
    template_parts = []
    placeholder_index = 0
    
    # Batch mode: merge adjacent text nodes separated only by inline tags
    if batch_mode:
        inline_tags = {'<img', '<svg', '<i', '<span', '<strong', '<em', '<b>', '<u>', '<a'}
        current_text = ""
        current_template = []
        
        for part in parts:
            if not part:
                continue
            
            # Check if it's an inline tag (img, icon, etc.)
            is_inline_tag = any(part.lower().startswith(tag) for tag in inline_tags)
            
            if part.startswith('<'):
                if is_inline_tag:
                    # Keep inline tags in current batch
                    current_template.append(part)
                else:
                    # Block tag - flush current batch
                    if current_text.strip():
                        template_parts.append(f'{{{{TRANSLATE_{placeholder_index}}}}}')
                        text_segments.append(current_text)
                        placeholder_index += 1
                        current_text = ""
                        current_template = []
                    template_parts.append(part)
            else:
                # Text content
                stripped = part.strip()
                if stripped:
                    current_text += part
                    current_template.append(part)
                elif current_template:
                    # Whitespace within a batch
                    current_text += part
                    current_template.append(part)
                else:
                    # Standalone whitespace
                    template_parts.append(part)
        
        # Flush remaining batch
        if current_text.strip():
            template_parts.append(f'{{{{TRANSLATE_{placeholder_index}}}}}')
            text_segments.append(current_text)
    else:
        # Original granular mode - translate each text node separately
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


async def _deepl_translate(
    text: str, 
    target: str, 
    source: str = "auto",
    api_key: Optional[str] = None
) -> str:
    """
    DeepL API translation (paid, high quality).
    
    Pricing: ~$20/month for 500K characters
    Superior quality, especially for European languages + Japanese
    """
    api_key = api_key or os.getenv("DEEPL_API_KEY")
    if not api_key:
        raise ValueError("DEEPL_API_KEY not set")
    
    # DeepL API endpoint (free or pro)
    # Note: Free tier keys end with ':fx' and use api-free.deepl.com
    # Pro keys don't have ':fx' suffix and use api.deepl.com
    is_free = api_key.endswith(":fx")
    base_url = "https://api-free.deepl.com/v2" if is_free else "https://api.deepl.com/v2"
    url = f"{base_url}/translate"
    
    # Map language codes (DeepL uses uppercase)
    target_code = target.upper()
    source_code = None if source == "auto" else source.upper()
    
    payload = {
        "text": [text],
        "target_lang": target_code,
        "formality": "default",  # or "more" for formal hospitality language
        "preserve_formatting": True,
    }
    
    if source_code:
        payload["source_lang"] = source_code
    
    headers = {
        "Authorization": f"DeepL-Auth-Key {api_key}",
        "Content-Type": "application/json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload, headers=headers)
        resp.raise_for_status()
        data = resp.json()
    
    return data["translations"][0]["text"]


async def _google_cloud_translate(
    text: str,
    target: str,
    source: str = "auto",
    api_key: Optional[str] = None,
    use_glossary: bool = True
) -> str:
    """
    Google Cloud Translation API (paid, with glossary support).
    
    Pricing: $20/1M characters
    Supports custom glossaries for industry-specific terms
    """
    api_key = api_key or os.getenv("GOOGLE_CLOUD_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_CLOUD_API_KEY not set")
    
    url = "https://translation.googleapis.com/language/translate/v2"
    
    payload = {
        "q": text,
        "target": target,
        "format": "text",
        "key": api_key
    }
    
    if source != "auto":
        payload["source"] = source
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        resp = await client.post(url, json=payload)
        resp.raise_for_status()
        data = resp.json()
    
    translated = data["data"]["translations"][0]["translatedText"]
    
    # Apply hotel glossary post-processing
    if use_glossary:
        translated = _apply_glossary(translated, target, source)
    
    return translated


async def _google_translate_free(text: str, target: str, source: str = "auto") -> str:
    """Free Google Translate (existing implementation - fallback)."""
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

    try:
        parts = [seg[0] for seg in data[0] if seg and len(seg) > 0]
        return "".join(parts)
    except Exception as e:
        logger.exception("Failed to parse Google translate response: %s", e)
        raise


@retry(
    wait=wait_exponential(min=0.5, max=4),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type(httpx.HTTPError)
)
async def translate_text_enhanced(
    text: str,
    target: str,
    source: str = "auto",
    is_html: bool = False,
    prefer_deepl: bool = True,
    apply_glossary: bool = True
) -> str:
    """
    Enhanced translation with multiple strategies:
    
    1. Try DeepL (if API key available) - Best quality
    2. Try Google Cloud (if API key available) - Good quality + glossary
    3. Fallback to free Google Translate
    
    Args:
        text: Text to translate
        target: Target language code (en, vi, ja, ko, etc.)
        source: Source language (auto-detect if "auto")
        is_html: Whether to preserve HTML structure
        prefer_deepl: Prefer DeepL over Google Cloud
        apply_glossary: Apply hotel industry glossary
    """
    if not text or not text.strip():
        return text
    
    # Apply glossary pre-processing for better context
    if apply_glossary and not is_html:
        text = _apply_glossary(text, target, source)
    
    # Handle HTML - use batch mode for faster processing
    if is_html:
        # Batch mode: merge text nodes separated by inline tags (img, icon, etc.)
        # This reduces API calls significantly - e.g., 50 segments → 10 segments
        text_segments, template_parts = _extract_text_from_html(text, batch_mode=True)
        
        if not text_segments:
            return text
        
        logger.info(f"HTML extracted into {len(text_segments)} text segments for translation")
        
        # Translate segments in parallel for speed
        tasks = [
            translate_text_enhanced(
                segment, target, source, 
                is_html=False, 
                prefer_deepl=prefer_deepl,
                apply_glossary=apply_glossary
            )
            for segment in text_segments
        ]
        translated_segments = await asyncio.gather(*tasks)
        
        return _reconstruct_html(translated_segments, template_parts)
    
    # Try translation services in order
    deepl_key = os.getenv("DEEPL_API_KEY")
    google_key = os.getenv("GOOGLE_CLOUD_API_KEY")
    
    strategies = []
    
    if prefer_deepl and deepl_key:
        strategies.append(("DeepL", lambda: _deepl_translate(text, target, source, deepl_key)))
    
    if google_key:
        strategies.append(("Google Cloud", lambda: _google_cloud_translate(text, target, source, google_key, apply_glossary)))
    
    if not prefer_deepl and deepl_key:
        strategies.append(("DeepL", lambda: _deepl_translate(text, target, source, deepl_key)))
    
    # Always have free fallback
    strategies.append(("Google Free", lambda: _google_translate_free(text, target, source)))
    
    # Try each strategy
    for name, strategy_func in strategies:
        try:
            logger.info(f"Trying translation with {name}...")
            result = await strategy_func()
            logger.info(f"✅ Translation successful with {name}")
            return result
        except Exception as e:
            logger.warning(f"❌ {name} failed: {e}")
            continue
    
    # If all fail, return original
    logger.error("All translation strategies failed")
    return text


async def translate_batch_enhanced(
    texts: Iterable[str],
    target: str,
    source: str = "auto",
    is_html: bool = False,
    concurrent: int = 8,
    prefer_deepl: bool = True,
    apply_glossary: bool = True
) -> List[str]:
    """
    Translate multiple texts in parallel with enhanced quality.
    
    Features:
    - Smart chunking for long texts (up to 128KB per text)
    - Parallel processing for speed
    - Hotel industry glossary
    - Multiple translation service fallbacks
    """
    texts = list(texts)
    if not texts:
        return []

    semaphore = asyncio.Semaphore(concurrent)

    async def _worker(t: str) -> str:
        async with semaphore:
            # For HTML content, use optimized batch extraction
            if is_html:
                # Check if HTML is too large (> 100KB)
                if len(t) > 100000:
                    # Split HTML by major block tags for parallel processing
                    block_pattern = re.compile(r'(<(?:div|section|article|p|h[1-6])[^>]*>.*?</(?:div|section|article|p|h[1-6])>)', re.DOTALL)
                    blocks = block_pattern.findall(t)
                    
                    if len(blocks) > 1:
                        logger.info(f"Large HTML split into {len(blocks)} blocks for parallel translation")
                        
                        # Translate each block in parallel
                        block_tasks = [
                            translate_text_enhanced(
                                block, target, source,
                                is_html=True,
                                prefer_deepl=prefer_deepl,
                                apply_glossary=apply_glossary
                            )
                            for block in blocks
                        ]
                        translated_blocks = await asyncio.gather(*block_tasks)
                        return "\n".join(translated_blocks)
                
                # Regular HTML processing with batch mode
                return await translate_text_enhanced(
                    t, target, source,
                    is_html=True,
                    prefer_deepl=prefer_deepl,
                    apply_glossary=apply_glossary
                )
            
            # Smart chunking for very long plain texts
            elif len(t) > 5000:
                chunks = _smart_chunk_text(t, max_chunk_size=5000)
                logger.info(f"Text split into {len(chunks)} chunks for translation")
                
                # Translate chunks in parallel
                chunk_tasks = [
                    translate_text_enhanced(
                        chunk, target, source, 
                        is_html=False,
                        prefer_deepl=prefer_deepl,
                        apply_glossary=apply_glossary
                    )
                    for chunk in chunks
                ]
                translated_chunks = await asyncio.gather(*chunk_tasks)
                return "\n\n".join(translated_chunks)
            else:
                # Regular translation for short texts
                return await translate_text_enhanced(
                    t, target, source,
                    is_html=is_html,
                    prefer_deepl=prefer_deepl,
                    apply_glossary=apply_glossary
                )

    results = await asyncio.gather(*[_worker(t) for t in texts], return_exceptions=False)
    return results


# Backwards compatibility - expose same interface as universal_translation
translate_text = translate_text_enhanced
translate_batch = translate_batch_enhanced
