# 🧪 Hướng dẫn Test Translation mới (DeepL)

## 📋 Chuẩn bị

1. ✅ Backend đã có `DEEPL_API_KEY` trong `.env.production`
2. ✅ Backend container đã restart
3. ✅ Frontend đã build mới (`npm run build`)
4. ✅ Browser đã clear cache (Ctrl + Shift + Delete)

---

## 🎯 Test Case 1: Features Translation

### Bước 1: Mở Features
```
1. Đăng nhập vào Dashboard
2. Menu bên trái → Features
3. Click vào bất kỳ feature nào (hoặc tạo mới)
```

### Bước 2: Mở Translation Modal
```
1. Click nút "Translate" (biểu tượng 🌐)
2. ✅ Kiểm tra: Header có badge "⚡ DeepL Powered"
3. ✅ Kiểm tra: Helper text nói về "DeepL Translation"
```

### Bước 3: Test Dịch
```
1. Chọn ngôn ngữ đích: Vietnamese (Tiếng Việt)
2. Đợi auto-translate (2-3 giây)
3. ✅ Kiểm tra: Title và Description đã được dịch
4. ✅ Kiểm tra: Chất lượng dịch tự nhiên, chính xác
```

### Bước 4: Test Regenerate
```
1. Click nút "Regenerate"
2. ✅ Kiểm tra: Translation thay đổi (có thể hơi khác)
3. ✅ Kiểm tra: Vẫn chính xác và tự nhiên
```

### Bước 5: Save
```
1. Click "Use Translation"
2. ✅ Kiểm tra: Modal đóng lại
3. ✅ Kiểm tra: Feature có translation mới trong list
```

---

## 🎯 Test Case 2: Categories Translation

### Bước 1: Mở Categories
```
1. Menu → Categories
2. Click vào category bất kỳ
3. Click "Translate"
```

### Bước 2: Test Hotel Glossary
```
Original Category:
- Title: "Deluxe Ocean View Suite"
- Description: "Enjoy check-in at our premium suite with complimentary breakfast and room service"

Dịch sang Vietnamese → Kiểm tra:
✅ "Deluxe Ocean View Suite" → "Phòng Suite Cao Cấp View Biển"
✅ "check-in" → "nhận phòng"
✅ "complimentary" → "miễn phí"
✅ "room service" → "dịch vụ phòng"
```

### Bước 3: Test Multiple Languages
```
1. Dịch sang Vietnamese → Check quality
2. Regenerate → Dịch sang Japanese → Check quality
3. Regenerate → Dịch sang Korean → Check quality

✅ Tất cả phải chính xác và tự nhiên
```

---

## 🎯 Test Case 3: Properties/Posts Translation

### Bước 1: Mở Property Post
```
1. Menu → Properties → Select property
2. Tab "Posts" hoặc "Hotel Posts"
3. Edit hoặc tạo post mới
```

### Bước 2: Test HTML Content
```
Original HTML:
<h2>Welcome to Our Hotel</h2>
<img src="/hotel.jpg" alt="Hotel" />
<p>Enjoy our <strong>deluxe amenities</strong>:</p>
<ul>
  <li>Ocean view rooms</li>
  <li>Complimentary breakfast</li>
  <li>24/7 room service</li>
</ul>

Sau khi dịch → Kiểm tra:
✅ HTML tags được giữ nguyên (<h2>, <img>, <ul>, <li>)
✅ Images không bị mất
✅ Chỉ text content được dịch
✅ Thuật ngữ khách sạn chính xác
```

### Bước 3: Test Long Content
```
1. Tạo post với content dài (~5000 ký tự)
2. Thêm nhiều đoạn văn, lists, headings
3. Click Translate

✅ Kiểm tra: Dịch thành công (không bị timeout)
✅ Kiểm tra: Toàn bộ content được dịch
✅ Kiểm tra: Formatting được giữ nguyên
```

---

## 🎯 Test Case 4: Speed Test

### So sánh tốc độ dịch:

```
Test 1: Dịch 1 câu ngắn (~10 từ)
- Before (Google Free): ~2-3 giây
- After (DeepL):        ~0.3-0.5 giây
✅ Nhanh hơn ~5-10x

Test 2: Dịch 1 đoạn văn (~100 từ)
- Before: ~5-8 giây
- After:  ~0.8-1.5 giây
✅ Nhanh hơn ~5x

Test 3: Dịch content dài (~500 từ)
- Before: Timeout hoặc fail
- After:  ~2-4 giây
✅ Xử lý được văn bản dài
```

---

## 🎯 Test Case 5: Quality Test

### Test thuật ngữ khách sạn:

| English | Vietnamese (Expected) | Kết quả |
|---------|----------------------|---------|
| Check-in | Nhận phòng | ✅ Pass / ❌ Fail |
| Check-out | Trả phòng | ✅ Pass / ❌ Fail |
| Deluxe suite | Phòng cao cấp | ✅ Pass / ❌ Fail |
| Ocean view | View biển | ✅ Pass / ❌ Fail |
| Room service | Dịch vụ phòng | ✅ Pass / ❌ Fail |
| Complimentary | Miễn phí | ✅ Pass / ❌ Fail |
| All-inclusive | Trọn gói | ✅ Pass / ❌ Fail |
| Amenities | Tiện nghi | ✅ Pass / ❌ Fail |

**Cách test:**
1. Tạo content có chứa các từ trên
2. Dịch sang Vietnamese
3. Check xem có đúng thuật ngữ không

---

## 🐛 Troubleshooting

### Lỗi 1: Modal không có badge "DeepL Powered"
**Nguyên nhân:** Frontend chưa build mới
**Giải pháp:**
```bash
cd frontend
npm run build
# Hard refresh browser: Ctrl + Shift + R
```

### Lỗi 2: Dịch vẫn chậm như cũ
**Nguyên nhân:** Backend chưa dùng DeepL API
**Kiểm tra:**
```bash
# Check backend logs
docker logs backend-htlink-backend-1 --tail 50

# Nếu thấy: [TRANSLATE] 🚀 Enhanced → OK
# Nếu thấy: [TRANSLATE_ENDPOINT] incoming → Dùng code cũ
```

**Giải pháp:**
```bash
cd backend-htlink
docker-compose up -d --build backend
```

### Lỗi 3: Translation sai hoặc kém chất lượng
**Nguyên nhân:** DeepL API key chưa set hoặc sai
**Kiểm tra:**
```bash
# Check env trong container
docker exec backend-htlink-backend-1 env | grep DEEPL

# Phải thấy: DEEPL_API_KEY=6d3b1a4c-....:fx
```

**Giải pháp:**
```bash
# Update .env.production
DEEPL_API_KEY=6d3b1a4c-3755-46b1-a94c-126a3c96609a:fx

# Restart
docker-compose restart backend
```

### Lỗi 4: Console có lỗi network
**Kiểm tra Network tab:**
```
POST /api/v1/translations/translate
Status: 422 → Body format sai
Status: 500 → Backend lỗi
Status: 200 → OK!
```

**Check Request Body:**
```json
{
  "texts": ["Welcome..."],
  "target": "vi",
  "source": "auto",
  "is_html": true,
  "concurrent": 4,
  "prefer_deepl": true,     ← Phải có
  "apply_glossary": true    ← Phải có
}
```

---

## ✅ Expected Results Checklist

Sau khi test, tất cả phải PASS:

- [ ] Modal có badge "⚡ DeepL Powered"
- [ ] Helper text nói về DeepL + Glossary
- [ ] Dịch nhanh (<1s cho text ngắn)
- [ ] Chất lượng dịch tự nhiên, chính xác
- [ ] Thuật ngữ khách sạn đúng (check-in → nhận phòng, etc.)
- [ ] HTML được preserve (tags, images không mất)
- [ ] Long content dịch thành công (>5000 chars)
- [ ] Regenerate hoạt động tốt
- [ ] Save translation thành công
- [ ] Không có error trong console

---

## 📊 Test Report Template

```markdown
# Translation Test Report

**Ngày test:** [Date]
**Người test:** [Name]
**Environment:** Production / Staging

## Test Cases

### 1. Features Translation
- [ ] PASS / [ ] FAIL
- Notes: _______________________________

### 2. Categories Translation
- [ ] PASS / [ ] FAIL
- Notes: _______________________________

### 3. Properties Translation
- [ ] PASS / [ ] FAIL
- Notes: _______________________________

### 4. Speed Test
- Average speed: _____ seconds
- [ ] PASS (<1s) / [ ] FAIL

### 5. Quality Test
- Hotel terms accuracy: ___/8 correct
- [ ] PASS (≥7/8) / [ ] FAIL

## Issues Found
1. [Issue description]
2. [Issue description]

## Overall Status
- [ ] ✅ Ready for Production
- [ ] ⚠️ Minor issues (can deploy)
- [ ] ❌ Major issues (fix first)
```

---

## 💡 Tips

1. **Test với real data:** Dùng content thực tế của khách sạn, không phải text mẫu
2. **Test nhiều ngôn ngữ:** Vietnamese, Japanese, Korean, Chinese
3. **Test edge cases:** 
   - Empty content
   - Very long content (10,000+ chars)
   - Content với special characters
   - HTML với nhiều images
4. **Monitor logs:** Check backend logs để xem có dùng DeepL không
5. **Compare results:** So sánh với bản dịch cũ để thấy sự khác biệt

---

**Happy Testing! 🎉**
