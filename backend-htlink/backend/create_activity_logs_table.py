#!/usr/bin/env python3
"""Create activity_logs and analytics_summary tables"""
import pymysql
import sys

DB_CONFIG = {
    'host': 'localhost',
    'port': 3307,
    'user': 'root',
    'password': 'VeryStrongRootPass2024!',
    'database': 'hotellink360_db',
    'charset': 'utf8mb4'
}

CREATE_ACTIVITY_LOGS = """
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    activity_type VARCHAR(50) NOT NULL DEFAULT 'system_update',
    details JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_created_at (created_at),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

CREATE_ANALYTICS_SUMMARY = """
CREATE TABLE IF NOT EXISTS analytics_summary (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    tenant_id BIGINT NOT NULL,
    date DATETIME NOT NULL,
    period_type VARCHAR(10) NOT NULL,
    total_page_views INT DEFAULT 0,
    unique_visitors INT DEFAULT 0,
    total_activities INT DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_tenant_id (tenant_id),
    INDEX idx_date (date),
    FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
"""

def main():
    try:
        print("Connecting to database...")
        conn = pymysql.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        print("Creating activity_logs table...")
        cursor.execute(CREATE_ACTIVITY_LOGS)
        print("✓ activity_logs table created/verified")
        
        print("Creating analytics_summary table...")
        cursor.execute(CREATE_ANALYTICS_SUMMARY)
        print("✓ analytics_summary table created/verified")
        
        conn.commit()
        print("\n✅ All tables created successfully!")
        
        cursor.close()
        conn.close()
        
    except Exception as e:
        print(f"❌ Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()

