🚀 **FULL PROMPT — Activity Tracking & Analytics (FastAPI + SQLModel + MySQL)**

You are an expert backend engineer specializing in FastAPI + SQLModel + MySQL architecture.

I already have a multi-tenant FastAPI backend (each tenant is a hotel) using SQLModel ORM and JWT authentication. Each tenant is isolated by `tenant_id` (foreign key to tenants.id).

Now I want to implement a **complete Activity Tracking & Analytics system** for my Admin Dashboard (“Recent Activity”) and future analytics.

---

### ✅ Requirements

Generate a full working implementation that includes the following:

---

#### 1️⃣ Models — `ActivityType` and `ActivityLog`

Use the following enum and model:

```python
class ActivityType(str, enum.Enum):
    LOGIN = "login"
    LOGOUT = "logout"

    CREATE_CATEGORY = "create_category"
    UPDATE_CATEGORY = "update_category"
    DELETE_CATEGORY = "delete_category"

    CREATE_FEATURE = "create_feature"
    UPDATE_FEATURE = "update_feature"
    DELETE_FEATURE = "delete_feature"

    UPLOAD_MEDIA = "upload_media"
    DELETE_MEDIA = "delete_media"

    CREATE_USER = "create_user"
    UPDATE_USER = "update_user"
    DELETE_USER = "delete_user"

    CREATE_POST = "create_post"
    UPDATE_POST = "update_post"
    DELETE_POST = "delete_post"

    CREATE_PROPERTY = "create_property"
    UPDATE_PROPERTY = "update_property"
    DELETE_PROPERTY = "delete_property"

    USER_CREATE_SETTINGS = "user_create_settings"
    USER_UPDATE_SETTINGS = "user_update_settings"
    USER_DELETE_SETTINGS = "user_delete_settings"

    SYSTEM_UPDATE = "system_update"
```

```python
class ActivityLog(SQLModel, table=True):
    __tablename__ = "activity_logs"

    id: Optional[int] = Field(default=None, primary_key=True)
    tenant_id: int = Field(foreign_key="tenants.id", index=True)
    activity_type: ActivityType = Field(default=ActivityType.SYSTEM_UPDATE)
    details: Optional[Dict[str, Any]] = Field(default=None, sa_column=Column(JSON))
    created_at: datetime = Field(default_factory=lambda: datetime.utcnow())
```

---

#### 2️⃣ `app/utils/activity_logger.py`

Create a helper function:
```python
def log_activity(db: Session, tenant_id: int, activity_type: ActivityType, details: dict)
```
- Inserts a new ActivityLog record.
- Wrapped safely in try/except.
- Returns the log object.

---

#### 3️⃣ `app/utils/decorators/track_activity.py`

Create a reusable FastAPI decorator:
```python
@track_activity(ActivityType.CREATE_FEATURE, message_template="Feature '{name}' created by {user}")
```

✅ Behavior:
- Wraps any FastAPI route (sync or async).
- After successful execution (2xx), automatically logs to `activity_logs`.
- Uses:
  - `tenant_id` from `current_user.tenant_id`
  - `username` from `current_user.username`
- Supports placeholders in `message_template` (like `{name}`, `{user}`).
- Defaults to `"activity_type performed by username"` if no template.
- Runs safely without breaking main logic if logging fails.

---

#### 4️⃣ `app/api/v1/endpoints/activity_logs.py`

Create an endpoint:
```python
GET /api/v1/activity-logs?tenant_id={id}&limit={limit}
```
- Returns the most recent logs (ordered by `created_at DESC`).
- Supports optional filtering by `activity_type` or date range.

---

#### 5️⃣ Example usage in CRUD endpoints

Show examples in `features.py`:

```python
@router.post("/features", response_model=FeatureRead)
@track_activity(ActivityType.CREATE_FEATURE, message_template="Feature '{name}' created by {user}")
async def create_feature(data: FeatureCreate, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    feature = Feature(**data.dict(), tenant_id=current_user.tenant_id)
    db.add(feature)
    db.commit()
    db.refresh(feature)
    return feature
```

Also include:
- `update_feature`
- `delete_feature`

---

#### 6️⃣ Authentication events

When a user logs in → log `ActivityType.LOGIN`  
When a user logs out → log `ActivityType.LOGOUT`

Integrate this logic inside the existing auth endpoints.

---

#### 7️⃣ Analytics foundation (optional)

Add a base structure for `Event` model or analytics tracking for page views and API usage (sharing tenant_id + user_id).

---

#### 8️⃣ Folder structure

The generated code must fit this layout:

```
app/
 ├── models/activity_log.py
 ├── utils/activity_logger.py
 ├── utils/decorators/track_activity.py
 ├── api/v1/endpoints/activity_logs.py
 ├── api/v1/endpoints/features.py
 ├── api/v1/endpoints/categories.py
```

All imports should resolve correctly (no placeholders).  
Ensure compatibility with SQLModel + MySQL JSON.  
Everything should be runnable immediately.

---

#### 9️⃣ Frontend context (for reference only)

Frontend calls `GET /api/v1/activity-logs?tenant_id=1` and displays:

```
+ Feature 'WiFi Info' created by admin  (2 hours ago)
✎ Category 'Services' updated by admin  (4 hours ago)
🗑 Post 'Summer Deals' deleted  (1 day ago)
```

So `details["message"]` must contain a human-readable description.

---

Generate **complete runnable Python code** for all these files — models, utils, decorators, endpoints, and CRUD examples — with no placeholders.
