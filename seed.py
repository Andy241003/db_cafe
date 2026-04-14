from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    # Insert plan
    conn.execute(text("INSERT INTO plans (code, name, created_at) VALUES ('basic', 'Basic', NOW()) ON DUPLICATE KEY UPDATE name=VALUES(name)"))

    # Insert tenant
    conn.execute(text("INSERT INTO tenants (plan_id, name, code, default_locale, fallback_locale, is_active, created_at) VALUES ((SELECT id FROM plans WHERE code='basic'), 'Boton Blue Cafe', 'boton_blue', 'en', 'en', 1, NOW()) ON DUPLICATE KEY UPDATE name=VALUES(name)"))

    # Insert admin user (password: SuperSecretPass123) - no tenant_id
    conn.execute(text("INSERT INTO admin_users (email, password_hash, full_name, role, is_active, created_at) VALUES ('admin@travel.link360.vn', '$2b$12$ypRvdsGrsyBref0LoKBQAeYOHKLxOXUCeFpXc2AVBA/Q/6O9DrmHS', 'Admin User', 'OWNER', 1, NOW()) ON DUPLICATE KEY UPDATE full_name=VALUES(full_name)"))

    conn.commit()
    print('Seed data inserted successfully')