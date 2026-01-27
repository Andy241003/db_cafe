# Property Export/Import Feature - Test Guide

## 🎯 Tính Năng

Chức năng Export/Import cho phép sao chép toàn bộ nội dung từ một property (khách sạn) mẫu sang property mới, giúp:
- **Tiết kiệm thời gian**: Không cần nhập lại dữ liệu từ đầu
- **Đồng nhất nội dung**: Dùng template chuẩn cho chuỗi khách sạn
- **Dễ quản lý**: Import 70% nội dung tự động, chỉ cần cập nhật 30% thông tin đặc thù

## 📦 Dữ Liệu Được Export

### Nội dung đầy đủ:
1. **Rooms** (Phòng)
   - Thông tin phòng (loại, diện tích, giá, sức chứa)
   - Translations (tên, mô tả ở mọi ngôn ngữ)
   - Images (hình ảnh phòng)
   
2. **Dining** (Nhà hàng/Bar)
   - Thông tin venue (loại, sức chứa)
   - Translations
   - Images
   
3. **Services** (Dịch vụ)
   - Thông tin service (loại, availability)
   - Translations
   - Images
   
4. **Facilities** (Tiện ích)
   - Thông tin facility (loại, giờ mở cửa)
   - Translations
   - Images
   
5. **Locales** (Ngôn ngữ)
   - Danh sách ngôn ngữ được hỗ trợ

### Format file:
- **ZIP file** chứa:
  - `metadata.json`: Thông tin export
  - `data.json`: Toàn bộ nội dung
  - `images/`: Thư mục chứa hình ảnh (trong phiên bản tương lai)
  - `README.txt`: Hướng dẫn import

## 🔄 Cách Property ID Được Xử Lý

### Vấn đề:
Tất cả dữ liệu trong database đều chứa `property_id` để phân biệt giữa các khách sạn.

### Giải pháp:
1. **Export**: Property_id được ghi lại để tham khảo, nhưng không dùng khi import
2. **Import**: Sử dụng property_id của khách sạn ĐÍCH (nơi import vào)
3. **Symbolic IDs**: Dùng IDs tượng trưng (`room_1`, `dining_2`) để quản lý references
4. **Auto-remapping**: Backend tự động tạo IDs mới và map lại foreign keys

### Ví dụ:
```
Khách sạn nguồn (Export):     property_id = 5
Khách sạn đích (Import):      property_id = 10

Khi import → Tất cả records mới sẽ có property_id = 10
```

## 🧪 Hướng Dẫn Test

### Bước 1: Chuẩn Bị

1. **Tạo Property Nguồn** (có đầy đủ dữ liệu):
   - Thêm 3-5 rooms với translations và hình ảnh
   - Thêm 2-3 dining venues
   - Thêm 4-5 services
   - Thêm 3-4 facilities
   - Đảm bảo có ít nhất 2 ngôn ngữ

2. **Tạo Property Đích** (trống):
   - Tạo property mới
   - Chưa có dữ liệu gì

### Bước 2: Export Từ Property Nguồn

1. Chọn Property nguồn trong dropdown
2. Vào menu: **Settings → Export / Import**
3. Click **"Export Property Template"**
4. File ZIP sẽ tự động download: `property-export-PROPERTYCODE-YYYYMMDD.zip`
5. Kiểm tra file đã download

### Bước 3: Import Vào Property Đích

1. Chọn Property đích (property trống)
2. Vào menu: **Settings → Export / Import**
3. Click vào khung "Click to select a ZIP file"
4. Chọn file ZIP vừa export
5. Click **"Preview"** để xem trước

### Bước 4: Review Preview

Kiểm tra thông tin preview:
- ✅ Source Property name
- ✅ Export date
- ✅ Số lượng items: Locales, Rooms, Dining, Services, Facilities, Images
- ⚠️ Warnings về những gì cần update sau khi import

### Bước 5: Confirm Import

1. Click **"Confirm Import"**
2. Đợi quá trình import (có thể mất vài giây)
3. Xem kết quả:
   - Số lượng items đã import
   - Next steps (các bước cần làm tiếp)

### Bước 6: Verify Data

Kiểm tra các trang để confirm data đã được import:

1. **Rooms** (`/vr-hotel/rooms`):
   - ✅ Danh sách rooms đã xuất hiện
   - ✅ Translations đầy đủ
   - ⚠️ Booking URLs = null (cần update)
   - ⚠️ Images chưa có (phiên bản tương lai)

2. **Dining** (`/vr-hotel/dining`):
   - ✅ Danh sách dining venues
   - ✅ Translations
   - ⚠️ Booking URLs cần update

3. **Services** (`/vr-hotel/services`):
   - ✅ Danh sách services
   - ✅ Translations
   - ⚠️ Booking URLs cần update

4. **Facilities** (`/vr-hotel/facilities`):
   - ✅ Danh sách facilities
   - ✅ Translations

### Bước 7: Update Dữ Liệu Đặc Thù

Sau import, cần update:
1. **Booking URLs**: Update cho rooms, dining, services
2. **Contact Info**: Update ở trang Contact
3. **Prices**: Review và adjust giá phòng nếu cần
4. **VR Links**: Update links nếu khác

## ✅ Test Cases

### Test Case 1: Export Thành Công
- **Input**: Property có đầy đủ dữ liệu
- **Expected**: Download file ZIP thành công
- **Verify**: File size > 0, có thể unzip được

### Test Case 2: Import Preview
- **Input**: Upload file ZIP đã export
- **Expected**: Hiện preview với đầy đủ thông tin
- **Verify**: 
  - Số lượng items chính xác
  - Source property name đúng
  - Có warnings

### Test Case 3: Import Thành Công
- **Input**: Confirm import từ preview
- **Expected**: Import thành công
- **Verify**:
  - Success message
  - Summary có số lượng đúng
  - Next steps hiển thị

### Test Case 4: Verify Property ID Remapping
- **Input**: Import vào property khác
- **Expected**: Tất cả records có property_id của property đích
- **Verify**: Check database:
```sql
-- Kiểm tra rooms
SELECT id, property_id, room_code 
FROM vr_rooms 
WHERE property_id = <property_dich_id>;

-- Kiểm tra dining
SELECT id, property_id 
FROM vr_dining 
WHERE property_id = <property_dich_id>;
```

### Test Case 5: Import Vào Property Đã Có Dữ Liệu
- **Input**: Import vào property đã có một số rooms/dining
- **Expected**: Dữ liệu mới được thêm vào (không xóa dữ liệu cũ)
- **Verify**: Cả dữ liệu cũ và mới đều tồn tại

### Test Case 6: Upload File Sai Format
- **Input**: Upload file không phải ZIP hoặc ZIP không đúng structure
- **Expected**: Error message rõ ràng
- **Verify**: "Invalid ZIP file: ..."

### Test Case 7: Export Property Trống
- **Input**: Export property chưa có dữ liệu
- **Expected**: Vẫn export được (với arrays rỗng)
- **Verify**: File ZIP có metadata và data.json với empty arrays

## 🐛 Các Lỗi Có Thể Gặp

### Backend Errors:

1. **"No property selected"**
   - Nguyên nhân: Chưa chọn property
   - Fix: Chọn property trong dropdown header

2. **"Property not found"**
   - Nguyên nhân: Property không tồn tại hoặc không thuộc tenant
   - Fix: Kiểm tra quyền access

3. **"Invalid ZIP file"**
   - Nguyên nhân: File upload không đúng format
   - Fix: Đảm bảo upload file ZIP được export từ hệ thống

4. **"Import failed: ..."**
   - Nguyên nhân: Lỗi database hoặc data không hợp lệ
   - Fix: Xem chi tiết error message, kiểm tra logs

### Frontend Errors:

1. **"Export failed"**
   - Check: Network tab trong DevTools
   - Check: Backend có chạy không

2. **"Preview failed"**
   - Check: File có bị corrupt không
   - Check: File size có quá lớn không

## 📊 Expected Results

Sau khi import thành công vào property mới:

| Feature | Imported | Needs Update |
|---------|----------|--------------|
| Rooms | ✅ Structure, translations | ⚠️ Booking URLs, prices |
| Dining | ✅ Structure, translations | ⚠️ Booking URLs |
| Services | ✅ Structure, translations | ⚠️ Booking URLs |
| Facilities | ✅ Structure, translations | ✅ Complete |
| Images | ⏳ Future version | ⏳ Future version |
| Locales | ✅ Complete | ✅ Complete |

## 🔮 Future Enhancements

Version 2.0 sẽ bao gồm:
1. ✨ Import/Export hình ảnh thực tế
2. ✨ Import Offers (khuyến mãi)
3. ✨ Import Introduction, Policies, Rules
4. ✨ Selective import (chọn chỉ import rooms, hoặc chỉ dining, etc.)
5. ✨ Import preview với thumbnail hình ảnh
6. ✨ Export/Import settings và configurations
7. ✨ Batch import cho nhiều properties cùng lúc

## 📞 Support

Nếu gặp vấn đề, check:
1. Browser Console (F12) → Console tab
2. Network tab → Xem API calls
3. Backend logs
4. Database tables: `vr_rooms`, `vr_dining`, `vr_services`, `vr_facilities`

---

**Created**: 2025-01-27  
**Version**: 1.0  
**Status**: Ready for Testing 🚀
