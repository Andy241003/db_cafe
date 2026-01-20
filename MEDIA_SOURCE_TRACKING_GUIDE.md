# Media Source Tracking Guide

## 📚 Overview
Hệ thống tracking để phân biệt media files được upload từ Travel module hay VR Hotel module, giúp dễ quản lý và filter.

## 🗂️ Database Schema

### Fields mới trong `media_files` table:
```sql
source VARCHAR(20)        -- 'travel', 'vr_hotel', 'general'
entity_type VARCHAR(50)   -- 'post', 'room', 'service', 'facility', 'offer'
entity_id INT            -- ID của entity liên quan
folder VARCHAR(100)      -- 'posts', 'rooms', 'services', 'facilities', 'offers'
```

## 🔧 Migration

Chạy migration để thêm fields mới:
```bash
# Trên VPS
cd /var/www/hotel-link/backend-htlink/backend
mysql -u hotellink360_user -p hotellink360_db < migrations/add_media_source_tracking.sql
```

## 📤 Upload với Source Tracking

### 1. Upload từ Travel (Posts)
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('kind', 'image');
formData.append('source', 'travel');
formData.append('entity_type', 'post');
formData.append('entity_id', postId.toString());
formData.append('folder', 'posts');

await axios.post('/api/v1/media/upload', formData);
```

### 2. Upload từ VR Hotel (Rooms)
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('kind', 'image');
formData.append('source', 'vr_hotel');
formData.append('entity_type', 'room');
formData.append('entity_id', roomId.toString());
formData.append('folder', 'rooms');

await axios.post('/api/v1/media/upload', formData);
```

### 3. Upload từ Media Library (General)
```typescript
const formData = new FormData();
formData.append('file', file);
formData.append('kind', 'image');
formData.append('source', 'general');
// entity_type, entity_id, folder để null

await axios.post('/api/v1/media/upload', formData);
```

## 🔍 Filter Media Files

### Backend API
```python
# Get all VR Hotel media
GET /api/v1/media/?source=vr_hotel

# Get all room images
GET /api/v1/media/?source=vr_hotel&folder=rooms

# Get all service images
GET /api/v1/media/?source=vr_hotel&entity_type=service

# Get all travel posts media
GET /api/v1/media/?source=travel&folder=posts
```

### Frontend
```typescript
// Load VR Hotel media only
const vrHotelMedia = await mediaApi.getMediaFiles({ 
  source: 'vr_hotel' 
});

// Load room images only
const roomMedia = await mediaApi.getMediaFiles({ 
  source: 'vr_hotel',
  folder: 'rooms'
});

// Load travel posts media
const travelMedia = await mediaApi.getMediaFiles({ 
  source: 'travel' 
});
```

## 🎨 UI Implementation

### Media Library có dropdown filter:
- **All Sources** - Tất cả media
- **📰 Travel (Posts)** - Chỉ media từ Travel posts/events
- **🏨 VR Hotel** - Chỉ media từ Rooms/Services/Facilities/Offers
- **📁 General** - Media upload trực tiếp từ Media Library

### Folder sub-filter (khi chọn source):
**VR Hotel:**
- Rooms
- Services
- Facilities
- Offers

**Travel:**
- Posts
- Events

## 📝 Update Existing Components

### 1. VR Hotel Rooms Upload
```typescript
// In Rooms.tsx - handleImageUpload
const uploadImage = async (file: File, roomId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', 'image');
  formData.append('source', 'vr_hotel');
  formData.append('entity_type', 'room');
  formData.append('entity_id', roomId.toString());
  formData.append('folder', 'rooms');
  
  const response = await mediaApi.uploadFile(file, 'image', {
    source: 'vr_hotel',
    entity_type: 'room',
    entity_id: roomId,
    folder: 'rooms'
  });
};
```

### 2. Post Image Upload (Quill Editor)
```typescript
// In EditPostModal.tsx - imageHandler
const uploadImageToPost = async (file: File, postId: number) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('kind', 'image');
  formData.append('source', 'travel');
  formData.append('entity_type', 'post');
  formData.append('entity_id', postId.toString());
  formData.append('folder', 'posts');
  
  const response = await fetch(`${apiBaseUrl}/media/upload`, {
    method: 'POST',
    body: formData,
    headers: { 'Authorization': `Bearer ${token}` }
  });
};
```

## 🎯 Benefits

1. **Phân biệt rõ nguồn**: Biết media nào từ Travel, VR Hotel, hay upload trực tiếp
2. **Filter nhanh**: Dễ tìm media theo module cụ thể
3. **Cleanup dễ dàng**: Xóa media theo source/entity khi không cần
4. **Tracking relationship**: Biết media nào thuộc room/service/post nào
5. **Audit trail**: Track được media upload từ đâu

## 🚀 Deployment Checklist

- [ ] Run migration SQL
- [ ] Restart backend Docker container
- [ ] Verify API returns new fields
- [ ] Test upload from VR Hotel
- [ ] Test upload from Travel
- [ ] Test filter in Media Library
- [ ] Update existing upload code to include source params
