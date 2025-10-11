# 🌍 Tourism Locales - Quick Reference

## ✅ Hoàn Thành

Đã thêm **24 ngôn ngữ** phổ biến vào hệ thống Hotel Link 360.

---

## 📋 Danh Sách Ngắn Gọn

### 🌏 Châu Á (9)
```
zh-CN  中文（简体）        Chinese (Simplified)
zh-TW  中文（繁體）        Chinese (Traditional)
ko     한국어              Korean
ja     日本語              Japanese
th     ภาษาไทย            Thai
ms     Bahasa Melayu      Malay
id     Bahasa Indonesia   Indonesian
tl     Tagalog            Filipino
yue    粵語               Cantonese
```

### 🌍 Châu Âu (6)
```
en     English            English
fr     Français           French
de     Deutsch            German
ru     Русский            Russian
es     Español            Spanish
it     Italiano           Italian
```

### 🌎 Châu Mỹ & Đại Dương (5)
```
en-US  English (US)       English (United States)
en-AU  English (AU)       English (Australia)
en-CA  English (CA)       English (Canada)
fr-CA  Français (CA)      French (Canada)
pt-BR  Português (BR)     Portuguese (Brazil)
```

### 🌍 Trung Đông & Nam Á (3)
```
hi     हिन्दी             Hindi
ar     العربية            Arabic
ta     தமிழ்              Tamil
```

### 🇻🇳 Việt Nam (1)
```
vi     Tiếng Việt         Vietnamese
```

---

## 🚀 Quick Start

### 1. Verify Locales

```bash
# Check in database
docker-compose exec db mysql -u hotellink360_user -pStrongDBPassword2024! hotellink360_db -e "SELECT code, name, native_name FROM locales ORDER BY code;"
```

### 2. Use in API

```javascript
// Get all locales
GET /api/v1/locales/

// Get property with Chinese translation
GET /api/v1/properties/1?locale=zh-CN

// Get Korean posts
GET /api/v1/property-posts/by-locale?property_id=1&locale=ko
```

### 3. Priority Order

1. **English** (`en`) - Required
2. **Chinese Simplified** (`zh-CN`) - Largest market
3. **Korean** (`ko`) - Top 2
4. **Japanese** (`ja`) - High-end
5. **Vietnamese** (`vi`) - Domestic
6. Others - Based on target market

---

## 📁 Files Created

| File | Purpose |
|------|---------|
| `backend/scripts/add_tourism_locales.py` | Python script to add locales |
| `backend/scripts/add_tourism_locales.sql` | SQL script to add locales |
| `backend/app/core/db.py` | Updated init_db with 24 locales |
| `MULTILINGUAL_TOURISM_GUIDE.md` | Complete guide |
| `LOCALES_SUMMARY.md` | This file |

---

## 🔧 Commands

```bash
# Add locales (Python)
docker-compose exec backend python /app/scripts/add_tourism_locales.py

# Add locales (SQL)
docker-compose exec db mysql -u hotellink360_user -pStrongDBPassword2024! hotellink360_db < backend/scripts/add_tourism_locales.sql

# Restart backend
docker-compose restart backend

# Check locales count
docker-compose exec db mysql -u hotellink360_user -pStrongDBPassword2024! hotellink360_db -e "SELECT COUNT(*) as total FROM locales;"
```

---

## 📊 Statistics

- **Total Locales**: 24
- **Added**: 19 new
- **Existing**: 5 (en, vi, ja, ko, fr)
- **Coverage**: Asia (9), Europe (6), Americas (5), Middle East/South Asia (3), Vietnam (1)

---

## 💡 Next Steps

1. ✅ Locales added to database
2. ⏭️ Create translations for properties
3. ⏭️ Create translations for features
4. ⏭️ Create translations for posts
5. ⏭️ Add language switcher to frontend
6. ⏭️ Implement auto-detect user language

---

**Full Documentation**: See `MULTILINGUAL_TOURISM_GUIDE.md`

