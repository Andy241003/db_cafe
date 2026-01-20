# Separate Media Libraries for Travel & VR Hotel

## Overview
Hệ thống bây giờ có **2 Media Libraries riêng biệt**:
- **Travel Link Media Library** - Chỉ hiển thị ảnh từ Travel (posts)
- **VR Hotel Media Library** - Chỉ hiển thị ảnh từ VR Hotel (rooms, services, facilities, offers)

## Implementation Details

### 1. Component Updates

#### Media.tsx Component
- Thêm prop `defaultSource` để tự động filter theo source
```typescript
interface MediaLibraryProps {
  defaultSource?: 'travel' | 'vr_hotel' | '';
}

export default function MediaLibrary({ defaultSource = '' }: MediaLibraryProps)
```
- State `sourceFilter` được khởi tạo với giá trị `defaultSource`
- Khi user mở Media Library từ Travel → tự động filter `source=travel`
- Khi user mở Media Library từ VR Hotel → tự động filter `source=vr_hotel`

### 2. Route Configuration

#### Travel Link Route
**File**: `frontend/src/layouts/MainLayout.tsx`
```tsx
<Route path="/media" element={<Media defaultSource="travel" />} />
```

#### VR Hotel Route
**File**: `frontend/src/App.tsx`
```tsx
<Route path="media" element={<Media defaultSource="vr_hotel" />} />
```

### 3. Sidebar Menu Updates

#### Travel Link Sidebar
**File**: `frontend/src/components/layout/Sidebar.tsx`
- Menu item đã có sẵn: `/media` → Media Library

#### VR Hotel Sidebar
**File**: `frontend/src/components/layout/VRHotelSidebar.tsx`
- Thêm import: `faImages`
- Thêm menu item mới trong MANAGEMENT section:
```typescript
{ path: '/vr-hotel/media', icon: faImages, label: 'Media Library', visible: true }
```

## User Experience

### Travel Link Dashboard
1. User vào Travel Link Dashboard
2. Click sidebar menu **"Media Library"**
3. Tự động hiển thị **chỉ ảnh từ Travel** (posts)
4. Source filter mặc định = `📰 Travel (Posts)`
5. User vẫn có thể thay đổi filter để xem tất cả nếu muốn

### VR Hotel Dashboard
1. User vào VR Hotel Dashboard
2. Click sidebar menu **"Media Library"**
3. Tự động hiển thị **chỉ ảnh từ VR Hotel** (rooms, services, facilities, offers)
4. Source filter mặc định = `🏨 VR Hotel`
5. User vẫn có thể thay đổi filter để xem tất cả nếu muốn

## Backend Filter Support

Backend API đã hỗ trợ filter by source từ trước:
```python
GET /api/v1/media/?source=travel      # Chỉ ảnh từ Travel
GET /api/v1/media/?source=vr_hotel    # Chỉ ảnh từ VR Hotel
GET /api/v1/media/                     # Tất cả ảnh
```

## Benefits

✅ **Separation of Concerns**: Mỗi module có Media Library riêng
✅ **Auto-filtering**: Tự động filter theo context (Travel vs VR Hotel)
✅ **User-friendly**: User không thấy ảnh không liên quan
✅ **Flexible**: User vẫn có thể xem tất cả ảnh nếu cần
✅ **Clean UI**: Giảm confusion khi manage media files

## Next Steps

### To Enable Source Tracking (Optional)
Nếu chưa chạy migration, cần:
1. Run database migration:
```bash
mysql -u user -p hotellink360_db < backend/migrations/add_media_source_tracking.sql
```

2. Update existing upload handlers để tag source:
   - Rooms image upload → `source='vr_hotel'`
   - Services image upload → `source='vr_hotel'`
   - Facilities image upload → `source='vr_hotel'`
   - Offers image upload → `source='vr_hotel'`
   - Post editor image upload → `source='travel'`

3. Test uploads from both modules

### Testing Checklist
- [ ] Login to Travel Link dashboard
- [ ] Click Media Library → Should show only Travel posts media
- [ ] Switch to VR Hotel dashboard
- [ ] Click Media Library → Should show only VR Hotel media
- [ ] Upload image from Travel post editor → Should appear in Travel Media Library
- [ ] Upload image from VR Hotel room → Should appear in VR Hotel Media Library
- [ ] Verify source filter can be changed manually in both libraries

## Files Modified

1. ✅ `frontend/src/pages/Media.tsx` - Added `defaultSource` prop
2. ✅ `frontend/src/components/layout/VRHotelSidebar.tsx` - Added Media Library menu item
3. ✅ `frontend/src/App.tsx` - Added VR Hotel media route with `defaultSource="vr_hotel"`
4. ✅ `frontend/src/layouts/MainLayout.tsx` - Updated Travel media route with `defaultSource="travel"`
5. ✅ `frontend/src/pages/vr-hotel/VRHotelLayout.tsx` - Added media breadcrumb mapping

## Summary

Bây giờ hệ thống có **2 Media Libraries hoàn toàn riêng biệt**:
- Travel Link users chỉ thấy ảnh của Travel posts
- VR Hotel users chỉ thấy ảnh của VR Hotel (rooms, services, etc.)
- Mỗi library tự động filter theo source khi mở
- User experience clean và organized hơn nhiều!
