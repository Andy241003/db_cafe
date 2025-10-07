You are working on a FastAPI + SQLModel + MySQL 8 backend for a multi-tenant hotel SaaS system.

The system already has authentication, tenants, properties, and admin_users tables.
You only need to implement the **analytics tracking module**.

---

## 🌍 Domain structure

- Root dashboard domain (admin portal): `https://travel.link360.vn`
- Each tenant (hotel chain) has a base domain: e.g. `trip360.vn`
- Each property (hotel website) automatically gets a subdomain:
  - Example: `https://botonblue.trip360.vn`
- Each property has a unique `tracking_key` generated when created.
- Every subdomain embeds a tracking.js script that sends data to: https://travel.link360.vn/api/v1/analytics/track

---

## 🗄️ Database tables (map fields exactly)

### tenants
- id bigint PK
- code varchar(80)
- name varchar(200)
- created_at datetime
- updated_at datetime

### properties
- id bigint PK
- tenant_id bigint FK → tenants.id
- property_name varchar(255)
- code varchar(100)
- website_url varchar(255)  ← full subdomain (e.g. https://botonblue.trip360.vn)
- tracking_key varchar(64)  ← unique per property
- created_at datetime

### activity_logs
- id int AI PK
- tenant_id int NOT NULL
- activity_type varchar(50)
- details JSON
- created_at timestamp DEFAULT CURRENT_TIMESTAMP

### analytics_summary
- id int AI PK
- tenant_id int NOT NULL
- date date
- period_type varchar(10)
- total_page_views int DEFAULT 0
- unique_visitors int DEFAULT 0
- total_activities int DEFAULT 0
- created_at timestamp DEFAULT CURRENT_TIMESTAMP
- updated_at timestamp DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

### events
- id bigint AI PK
- tenant_id bigint
- property_id bigint
- event_type ENUM('page_view','click','share')
- device ENUM('desktop','tablet','mobile')
- user_agent varchar(255)
- ip_hash varchar(64)
- created_at datetime

### admin_users
- id bigint
- tenant_id bigint
- email varchar(190)
- password_hash varchar(255)
- role ENUM('OWNER','ADMIN','EDITOR','VIEWER')
- is_active tinyint(1)
- created_at datetime
- updated_at datetime

---

## 🎯 Objectives

Implement a **complete FastAPI module** that handles:
1. Receiving analytics events from hotel websites.
2. Recording data into `events`, `activity_logs`, and updating `analytics_summary`.
3. Broadcasting realtime updates via Redis → WebSocket.
4. Enforcing tenant isolation & role-based access for dashboard queries.

---

## ⚙️ Functional Requirements

### 1️⃣ Endpoint: POST `/api/v1/analytics/track`
- Accepts anonymous JSON payloads (no JWT required):
```json
{
  "tracking_key": "string",
  "event_type": "page_view",
  "device": "mobile",
  "user_agent": "Mozilla/5.0 ...",
  "url": "https://botonblue.trip360.vn/",
  "referrer": "https://google.com/"
}
