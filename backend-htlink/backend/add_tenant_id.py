import pymysql

conn = pymysql.connect(
    host='travel.link360.vn',
    user='vrcafe_user',
    password='cafe@1234',
    database='vrcafe_db'
)
cursor = conn.cursor()

# Check if column exists
cursor.execute("""
    SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_NAME = 'admin_users' AND COLUMN_NAME = 'tenant_id'
""")

if cursor.fetchone():
    print('Column tenant_id already exists')
else:
    print('Adding column tenant_id...')
    cursor.execute("""
        ALTER TABLE admin_users 
        ADD COLUMN tenant_id BIGINT NULL DEFAULT 1 AFTER id
    """)
    print('Column added successfully')
    try:
        cursor.execute("""
            ALTER TABLE admin_users 
            ADD CONSTRAINT fk_admin_users_tenant 
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) 
            ON DELETE CASCADE
        """)
        print('Foreign key constraint added')
    except pymysql.Error as e:
        if 'Duplicate key' in str(e):
            print('Foreign key constraint already exists')
        else:
            print(f'FK error: {e}')
    
    conn.commit()

cursor.close()
conn.close()
print('Migration completed')

