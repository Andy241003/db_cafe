# VR360 Scene Sync Backend Spec

## Muc tieu

Frontend da co mot trang rieng de doc danh sach scene tu 3DVista export va gui ve backend bang API.

Trang frontend:

- slug: `/vr360-scene-sync`
- chuc nang: trich scene list tu local 3DVista assets
- action: click button `Gui ve backend`

Backend can bo sung 1 endpoint de nhan danh sach scene nay.

---

## Endpoint de xuat

### Option khuyen nghi

```http
POST /api/v1/vr360/scenes/sync
```

Frontend env:

```env
VITE_VR360_SCENE_SYNC_ENDPOINT=/vr360/scenes/sync
```

### Co the dung full URL neu can

```env
VITE_VR360_SCENE_SYNC_ENDPOINT=http://cafe-api.157.10.199.22.sslip.io/api/v1/vr360/scenes/sync
```

---

## Request format

### Method

```http
POST
```

### Headers

Frontend hien dang gui request qua `api.ts`, nen request se di kem:

- `Content-Type: application/json`
- `Authorization: Bearer <token>` (neu auth dang bat)
- `x-tenant-code: <tenant_code>` (neu frontend dang co tenant code)

Backend nen ho tro doc tenant tu:

1. header `x-tenant-code`
2. hoac body `tenant_code`

### JSON body

```json
{
  "property_id": 123,
  "tenant_code": "highland_coffee",
  "scenes": [
    {
      "id": "panorama_1F3621C0_0EE2_8F12_41A0_744398EE7BE4",
      "name": "pano-01",
      "subtitle": "VƯỜN HOA CẨM TÚ CẦU ĐÀ LẠT",
      "order": 0
    },
    {
      "id": "panorama_1C00401B_0EE1_8D35_4195_461190006BEB",
      "name": "pano-02",
      "subtitle": "VƯỜN HOA CẨM TÚ CẦU ĐÀ LẠT",
      "order": 1
    }
  ]
}
```

---

## Field definitions

### Root fields

- `property_id`: `number | null`
  - property hien tai cua frontend
  - backend nen validate neu business can gan scene vao 1 property cu the

- `tenant_code`: `string | null`
  - ma tenant hien tai
  - co the dung de xac dinh pham vi luu du lieu

- `scenes`: `array`
  - danh sach scene frontend extract duoc tu 3DVista export

### Scene item fields

- `id`: `string`
  - id duy nhat cua scene trong export 3DVista
  - vi du: `panorama_1F3621C0_0EE2_8F12_41A0_744398EE7BE4`

- `name`: `string`
  - ten hien thi cua scene
  - hien tai frontend dang lay tu `*.label` trong file locale
  - vi du: `pano-01`

- `subtitle`: `string | null`
  - mo ta bo sung cua scene neu co
  - hien tai frontend dang lay tu `*.subtitle`

- `order`: `number`
  - thu tu scene trong playlist chinh
  - frontend da sap xep truoc

---

## Backend behavior de xuat

Backend nen:

1. validate body hop le
2. xac dinh tenant/property
3. upsert scene theo cap:
   - `tenant_code`
   - `property_id`
   - `scene.id`
4. cap nhat:
   - `name`
   - `subtitle`
   - `order`
5. co the danh dau scene nao khong con ton tai trong lan sync moi

### Cach luu de xuat

Neu co bang rieng, co the luu theo model:

- `id`
- `tenant_code`
- `property_id`
- `scene_id`
- `scene_name`
- `scene_subtitle`
- `display_order`
- `is_active`
- `created_at`
- `updated_at`

### Logic sync de xuat

- scene moi: insert
- scene da ton tai: update
- scene cu khong con trong payload:
  - Option A: set `is_active = false`
  - Option B: xoa mem
  - Option C: giu nguyen, tuy business

Khuyen nghi: dung `soft deactivate` thay vi xoa cung.

---

## Validation rules de xuat

### Request-level

- `scenes` bat buoc phai co
- `scenes` phai la array
- `scenes.length >= 1`

### Scene-level

- `id` bat buoc, khong rong
- `name` bat buoc, khong rong
- `order` bat buoc, phai la so nguyen >= 0
- `subtitle` co the null hoac bo qua

---

## Response de xuat

### Success response

```json
{
  "success": true,
  "message": "Scenes synced successfully",
  "property_id": 123,
  "tenant_code": "highland_coffee",
  "count": 3,
  "created": 1,
  "updated": 2,
  "deactivated": 0
}
```

### Validation error response

```json
{
  "detail": "Invalid request body"
}
```

Hoac neu backend dang theo format validation hien co thi cu giu format do.

---

## Frontend behavior hien tai

Frontend hien dang:

1. doc scene tu 3DVista export local
2. extract tu:
   - `script_general.js`
   - `locale/en.txt`
3. preview payload tren UI
4. khi click button thi POST len endpoint duoc cau hinh trong:

```env
VITE_VR360_SCENE_SYNC_ENDPOINT=...
```

Neu endpoint chua duoc cau hinh, frontend se:

- hien warning
- disable nut gui

---

## Kiem thu nhanh backend

Sau khi backend xong, co the test bang request mau:

```bash
curl -X POST "http://cafe-api.157.10.199.22.sslip.io/api/v1/vr360/scenes/sync" ^
  -H "Content-Type: application/json" ^
  -H "x-tenant-code: highland_coffee" ^
  -d "{\"property_id\":123,\"tenant_code\":\"highland_coffee\",\"scenes\":[{\"id\":\"panorama_test_01\",\"name\":\"pano-01\",\"subtitle\":\"Scene test\",\"order\":0}]}"
```

---

## Ghi chu

- Frontend khong phu thuoc vao `VITE_VR360_CDN_URL` cho API sync nay
- API sync nay doc lap voi VR viewer hien tai
- Nhanh nhat la backend chi can lam 1 endpoint POST nhan payload va luu du lieu

---

## De nghi chot

De backend va frontend khop nhau nhanh nhat, de nghi chot path sau:

```http
POST /api/v1/vr360/scenes/sync
```

Va frontend se dung:

```env
VITE_VR360_SCENE_SYNC_ENDPOINT=/vr360/scenes/sync
```
