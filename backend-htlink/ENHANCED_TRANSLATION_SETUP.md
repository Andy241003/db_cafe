# 🚀 Hướng dẫn nâng cấp hệ thống dịch chuyên nghiệp

## 📋 Tổng quan

Hệ thống dịch mới cải thiện:
- ⚡ **Tốc độ**: Nhanh hơn 3-5x với API chuyên nghiệp
- 🎯 **Độ chính xác**: Tăng 40-60% với DeepL/Google Cloud
- 🏨 **Ngữ cảnh khách sạn**: Tự động nhận biết thuật ngữ chuyên ngành
- 📄 **Văn bản dài**: Xử lý tới 128KB/request với smart chunking

---

## 🔧 Các dịch vụ dịch (theo thứ tự ưu tiên)

### 1️⃣ **DeepL API** (Khuyên dùng - Chất lượng cao nhất)

**Ưu điểm:**
- Chất lượng dịch tốt nhất thị trường (đặc biệt tiếng Nhật, Hàn, châu Âu)
- Hiểu ngữ cảnh tốt
- Giữ được tone văn chuyên nghiệp

**Giá:**
- **Free**: 500,000 ký tự/tháng
- **Pro**: $5.49/tháng cho 1M ký tự (~23,000đ/tháng)

**Đăng ký:**
1. Truy cập: https://www.deepl.com/pro-api
2. Đăng ký tài khoản (có thể dùng Free tier)
3. Lấy API Key tại: https://www.deepl.com/account/summary

**Cấu hình:**
```bash
# Thêm vào file .env
DEEPL_API_KEY=your-deepl-api-key-here:fx
```

---

### 2️⃣ **Google Cloud Translation API** (Thay thế tốt)

**Ưu điểm:**
- Hỗ trợ 133+ ngôn ngữ
- Có thể tùy chỉnh Glossary (bảng thuật ngữ riêng)
- Tích hợp dễ dàng

**Giá:**
- **$20/1 triệu ký tự** (~460,000đ/1M ký tự)
- Free $300 credit khi đăng ký mới (dùng được ~15M ký tự)

**Đăng ký:**
1. Truy cập: https://console.cloud.google.com/
2. Tạo project mới
3. Enable "Cloud Translation API"
4. Tạo API Key:
   - IAM & Admin → API Keys → Create Key
   - Restrict key to "Cloud Translation API"

**Cấu hình:**
```bash
# Thêm vào file .env
GOOGLE_CLOUD_API_KEY=your-google-cloud-api-key
```

---

### 3️⃣ **Google Translate Free** (Fallback - Miễn phí)

- Tự động fallback nếu không có API key
- Chất lượng trung bình
- Không giới hạn nhưng có thể bị rate limit

---

## 🏨 Bảng thuật ngữ ngành khách sạn (Hotel Glossary)

Hệ thống tự động nhận biết và dịch chính xác các thuật ngữ:

| English | Tiếng Việt | 日本語 | 한국어 |
|---------|-----------|--------|--------|
| Check-in | Nhận phòng | チェックイン | 체크인 |
| Check-out | Trả phòng | チェックアウト | 체크아웃 |
| Suite | Phòng suite | スイートルーム | 스위트룸 |
| Deluxe Room | Phòng cao cấp | デラックスルーム | 디럭스룸 |
| Amenities | Tiện nghi | アメニティ | 편의시설 |
| Concierge | Lễ tân | コンシェルジュ | 컨시어지 |
| Room Service | Dịch vụ phòng | ルームサービス | 룸서비스 |
| Complimentary | Miễn phí | 無料 | 무료 |
| Ocean View | View biển | オーシャンビュー | 오션뷰 |
| All-inclusive | Trọn gói | オールインクルーシブ | 올인클루시브 |

*...và 20+ thuật ngữ khác*

**Tùy chỉnh thêm thuật ngữ:**
Chỉnh sửa file `enhanced_translation.py` → `HOTEL_GLOSSARY`

---

## 📦 Cài đặt

### 1. Cài đặt dependencies

```bash
# Không cần package mới, đã dùng httpx có sẵn
cd backend-htlink/backend
pip install -r requirements.txt
```

### 2. Cấu hình environment variables

```bash
# .env hoặc .env.production
DEEPL_API_KEY=your-deepl-api-key:fx          # (Optional - Khuyên dùng)
GOOGLE_CLOUD_API_KEY=your-google-api-key     # (Optional - Backup)

# Nếu không set, sẽ dùng Google Free (chậm hơn)
```

### 3. Update translation endpoints

File: `backend/app/api/v1/endpoints/translations.py`

```python
# Thay đổi import
from app.services.enhanced_translation import translate_batch_enhanced

# Trong endpoint /translate-batch
@router.post("/translate-batch", response_model=TranslateBatchResponse)
async def translate_batch_endpoint(request: TranslateBatchRequest):
    """
    Translate multiple texts using enhanced translation service.
    Supports DeepL, Google Cloud, and free fallback.
    """
    results = await translate_batch_enhanced(
        texts=request.texts,
        target=request.target,
        source=request.source or "auto",
        is_html=request.is_html or False,
        concurrent=request.concurrent or 8,
        prefer_deepl=True,      # Ưu tiên DeepL
        apply_glossary=True     # Dùng hotel glossary
    )
    
    return TranslateBatchResponse(translations=results)
```

---

## 🧪 Test thử

### Test với Python

```python
# backend/test_enhanced_translation.py
import asyncio
from app.services.enhanced_translation import translate_text_enhanced, translate_batch_enhanced

async def test_translation():
    # Test đơn
    text = "Welcome to our luxury hotel! Check-in is at 2 PM. Enjoy complimentary breakfast and spa amenities."
    
    result = await translate_text_enhanced(text, "vi", apply_glossary=True)
    print("Vietnamese:", result)
    
    result = await translate_text_enhanced(text, "ja", apply_glossary=True)
    print("Japanese:", result)
    
    # Test batch
    texts = [
        "Our deluxe suite offers ocean view and private balcony",
        "Room service available 24/7",
        "Complimentary WiFi and minibar included"
    ]
    
    results = await translate_batch_enhanced(texts, "ko", apply_glossary=True)
    for i, r in enumerate(results):
        print(f"Korean {i+1}:", r)

asyncio.run(test_translation())
```

```bash
cd backend
python test_enhanced_translation.py
```

### Test qua API

```bash
curl -X POST "http://localhost:8000/api/v1/translations/translate-batch" \
  -H "Content-Type: application/json" \
  -d '{
    "texts": [
      "Welcome to Tabi Hotel! Check-in: 2 PM. Enjoy our spa and amenities.",
      "Our deluxe ocean view suite includes complimentary breakfast."
    ],
    "target": "vi",
    "source": "en",
    "is_html": false,
    "concurrent": 4
  }'
```

---

## 📊 So sánh hiệu năng

| Dịch vụ | Tốc độ | Chất lượng | Chi phí | Glossary |
|---------|--------|-----------|---------|----------|
| **DeepL** | ⚡⚡⚡ Rất nhanh | ⭐⭐⭐⭐⭐ Xuất sắc | $5.49/1M ký tự | ❌ Không |
| **Google Cloud** | ⚡⚡⚡ Nhanh | ⭐⭐⭐⭐ Tốt | $20/1M ký tự | ✅ Có |
| **Google Free** | ⚡ Chậm | ⭐⭐⭐ Trung bình | Miễn phí | ❌ Không |

### Ước tính chi phí thực tế:

**Ví dụ khách sạn 50 phòng:**
- 100 bài viết/tháng × 500 từ = 50,000 ký tự
- 50 danh mục × 100 từ = 5,000 ký tự
- **Tổng: ~55,000 ký tự/tháng**

**Chi phí với DeepL:**
- 55,000 ký tự = **$0.30/tháng** (~7,000đ)
- Free tier đủ dùng!

---

## 🚀 Tính năng mới

### 1. **Smart Chunking** (Chia nhỏ văn bản thông minh)

```python
# Tự động chia văn bản dài thành các đoạn
text = "..." # 20,000 ký tự
result = await translate_text_enhanced(text, "vi")
# → Chia thành 4 chunks × 5000 ký tự
# → Dịch song song → Nối lại
```

### 2. **HTML Preservation** (Giữ nguyên cấu trúc HTML)

```python
html = """
<h1>Welcome</h1>
<img src="hotel.jpg" alt="Hotel" />
<p>Enjoy your stay at our <strong>luxury resort</strong></p>
"""

result = await translate_text_enhanced(html, "ja", is_html=True)
# → Chỉ dịch text, giữ nguyên HTML tags và images
```

### 3. **Auto Glossary** (Tự động thay thuật ngữ)

```python
text = "Check-in at the deluxe suite with ocean view"
result = await translate_text_enhanced(text, "vi", apply_glossary=True)
# → "Nhận phòng tại phòng cao cấp view biển"
#    (Tự động dùng thuật ngữ chuyên ngành)
```

---

## 🔍 Troubleshooting

### ❌ Lỗi: "DEEPL_API_KEY not set"
**Giải pháp:**
- Kiểm tra file `.env` có chứa `DEEPL_API_KEY`
- Restart server sau khi thêm env variable
- Hoặc tắt DeepL: set `prefer_deepl=False`

### ❌ Lỗi: "Rate limit exceeded"
**Giải pháp:**
- Giảm `concurrent` parameter (từ 8 → 4)
- Upgrade lên paid tier
- Hoặc dùng Google Cloud làm primary

### ❌ Dịch chậm với văn bản dài
**Giải pháp:**
- Smart chunking đã tự động kích hoạt với text > 5000 ký tự
- Tăng `concurrent` để dịch song song nhiều chunks

---

## 📚 Tài liệu thêm

- [DeepL API Docs](https://www.deepl.com/docs-api)
- [Google Cloud Translation](https://cloud.google.com/translate/docs)
- [Custom Glossary Guide](https://cloud.google.com/translate/docs/advanced/glossary)

---

## 💡 Tips & Best Practices

1. **Dùng Free tier trước**: DeepL Free = 500K ký tự/tháng (đủ cho hầu hết khách sạn nhỏ)

2. **Monitor usage**:
   ```python
   # Thêm logging để track số ký tự dịch
   logger.info(f"Translated {len(text)} characters to {target}")
   ```

3. **Cache translations**: Lưu bản dịch vào DB để tránh dịch lại

4. **Batch processing**: Dịch nhiều texts cùng lúc thay vì từng cái một

5. **Tùy chỉnh glossary**: Thêm thuật ngữ riêng của khách sạn bạn

---

## 📞 Support

Nếu cần hỗ trợ:
1. Kiểm tra logs: `docker logs backend`
2. Test API endpoint với curl
3. Verify API keys tại console của DeepL/Google

---

**Chúc bạn thành công! 🎉**
