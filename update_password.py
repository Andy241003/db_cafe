from app.core.db import engine
from sqlalchemy import text

with engine.connect() as conn:
    conn.execute(text("UPDATE admin_users SET password_hash = '$2b$12$ypRvdsGrsyBref0LoKBQAeYOHKLxOXUCeFpXc2AVBA/Q/6O9DrmHS' WHERE email = 'admin@travel.link360.vn'"))
    conn.commit()
    print('Password hash updated')