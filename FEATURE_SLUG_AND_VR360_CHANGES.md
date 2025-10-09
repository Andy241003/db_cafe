# Feature Slug và VR360 URL Changes

## Tóm tắt yêu cầu

1. **Khi tạo feature lần đầu**: Slug được tạo ra từ feature name
2. **Khi tạo post cho feature đó**: Slug của feature sẽ được dùng luôn cho post và không cho user đổi nữa (readonly)
3. **Thêm trường VR360 Tour Link vào Post**: Cho phép user nhập link VR360 tour cho mỗi post

## Các thay đổi đã thực hiện

### Backend Changes

#### 1. Model Post (`backend-htlink\backend\app\models\__init__.py`)
- Thêm trường `vr360_url` vào Post model:
```python
class Post(SQLModel, table=True):
    __tablename__ = "posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id")
    property_id: int = Field(foreign_key="properties.id")
    feature_id: int = Field(foreign_key="features.id")
    slug: str = Field(max_length=160)
    vr360_url: Optional[str] = Field(default=None, max_length=255)  # ✅ NEW
    status: PostStatus = Field(default=PostStatus.DRAFT)
    pinned: bool = Field(default=True)
    # ... other fields
```

#### 2. Schema PostBase, PostCreate, PostUpdate (`backend-htlink\backend\app\schemas\content.py`)
- Thêm `vr360_url` vào tất cả các schema:
```python
class PostBase(BaseModel):
    slug: str = Field(max_length=160)
    vr360_url: Optional[str] = Field(None, max_length=255)  # ✅ NEW
    status: PostStatus = PostStatus.DRAFT
    # ... other fields

class PostCreate(PostBase):
    # Inherits vr360_url from PostBase
    # ... other fields

class PostUpdate(BaseModel):
    slug: Optional[str] = Field(None, max_length=160)
    vr360_url: Optional[str] = Field(None, max_length=255)  # ✅ NEW
    # ... other fields
```

### Frontend Changes

#### 1. API Types (`backend-htlink\frontend\src\services\api.ts`)
- Thêm `vr360_url` vào interface Post:
```typescript
export interface Post {
  id: number;
  tenant_id: number;
  property_id: number;
  feature_id: number;
  slug: string;
  vr360_url?: string;  // ✅ NEW
  status: 'draft' | 'published' | 'archived';
  // ... other fields
}
```

#### 2. Posts API (`backend-htlink\frontend\src\services\postsApi.ts`)
- Thêm `vr360_url` vào ApiPostCreate và ApiPostUpdate:
```typescript
export interface ApiPostCreate {
  property_id: number;
  feature_id: number;
  slug: string;
  vr360_url?: string;  // ✅ NEW
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  // ... other fields
}

export interface ApiPostUpdate {
  property_id?: number;
  feature_id?: number;
  slug?: string;
  vr360_url?: string;  // ✅ NEW
  // ... other fields
}
```

#### 3. Features Page (`backend-htlink\frontend\src\pages\Features.tsx`)

**a. Khi tạo post mới - lấy slug từ feature:**
```typescript
const addPost = (featureId: number) => {
  // Find the feature to get its slug
  const feature = apiFeatures.find(f => f.id === featureId);
  const featureSlug = feature?.slug || '';  // ✅ NEW
  
  const newPost = {
    id: 0,
    tenant_id: 1,
    property_id: 1,
    feature_id: featureId,
    slug: featureSlug,  // ✅ Use feature's slug instead of empty string
    status: 'draft' as const,
    // ... other fields
  };
  
  setSelectedPost(newPost);
  setIsEditPostModalOpen(true);
};
```

**b. Khi save post - gửi vr360_url:**
```typescript
const handleSavePost = async (postData: any) => {
  const postPayload = {
    tenant_id: tenantId,
    property_id: propertyId,
    feature_id: selectedPost?.feature_id || selectedPost?.id || 1,
    slug: postData.slug || postData.title.toLowerCase().replace(/\s+/g, '-'),
    vr360_url: postData.vrLink || null,  // ✅ NEW
    status: (postData.status || 'draft').toUpperCase(),
    pinned: true,
    title: postData.title,
    content_html: postData.content || '',
    locale: postData.locale || 'en'
  };
  // ... save logic
};
```

#### 4. EditPostModal (`backend-htlink\frontend\src\components\features\EditPostModal.tsx`)

**a. Load vr360_url từ post:**
```typescript
useEffect(() => {
  if (post) {
    setPostForm({
      locale: post.locale || 'en',
      title: post.title || '',
      slug: post.slug || '',
      target: 'self',
      content: post.content || 'No content available. Start writing here...',
      status: (post.status as 'draft' | 'published' | 'archived') || 'draft',
      vrLink: post.vr360_url || post.vrLink || ''  // ✅ Load from vr360_url
    });
  }
}, [post]);
```

**b. Không auto-generate slug từ title:**
```typescript
<input
  type="text"
  value={postForm.title}
  onChange={(e) => {
    const newTitle = e.target.value;
    // ✅ Don't auto-generate slug anymore - it comes from feature
    setPostForm(prev => ({ ...prev, title: newTitle }));
  }}
  required
/>
```

**c. Slug field là readonly:**
```typescript
<div className="mb-4">
  <label>Slug (URL-friendly identifier)</label>
  <input
    type="text"
    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg text-sm bg-gray-100 cursor-not-allowed"
    value={postForm.slug}
    readOnly
    disabled
  />
  <small>
    <FontAwesomeIcon icon={faInfoCircle} /> Inherited from feature - cannot be changed
  </small>
</div>
```

#### 5. EditPostModalSimple (`backend-htlink\frontend\src\components\features\EditPostModalSimple.tsx`)
- Tương tự như EditPostModal:
  - Load `vr360_url` từ post
  - Slug field là readonly với message "Inherited from feature - cannot be changed"

## Database Schema

Trường `vr360_url` đã tồn tại trong database (bảng `posts`):
```sql
CREATE TABLE `posts` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `tenant_id` bigint NOT NULL,
  `property_id` bigint NOT NULL,
  `vr360_url` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `feature_id` bigint NOT NULL,
  `slug` varchar(160) COLLATE utf8mb4_unicode_ci NOT NULL,
  -- ... other fields
);
```

## Testing

1. **Tạo feature mới:**
   - Nhập feature name (ví dụ: "Swimming Pool")
   - Slug sẽ được tạo tự động (ví dụ: "swimming-pool")

2. **Tạo post cho feature:**
   - Click "Add Post" cho feature
   - Slug sẽ tự động lấy từ feature ("swimming-pool")
   - Slug field là readonly, không thể thay đổi
   - Có thể nhập VR360 Tour Link (optional)

3. **Edit post:**
   - Slug vẫn là readonly
   - VR360 Tour Link có thể edit
   - Title có thể edit nhưng không ảnh hưởng đến slug

## Notes

- Slug của post luôn giống với slug của feature mà nó thuộc về
- User không thể thay đổi slug của post sau khi tạo
- VR360 URL là optional field, có thể để trống
- Backend đã restart thành công và không có lỗi

