import asyncio, sys
sys.path.insert(0, r"c:\Users\DONG\Downloads\hotel-link\backend-htlink\backend")
from app.services.universal_translation import translate_text

async def main():
    try:
        res = await translate_text('Xin chào thế giới', 'en', source='auto', is_html=False)
        print('TRANSLATION_RESULT:', repr(res))
    except Exception as e:
        print('ERROR:', e)

asyncio.run(main())
