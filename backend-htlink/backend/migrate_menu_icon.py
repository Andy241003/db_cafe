#!/usr/bin/env python3
"""
Migration script: Change cafe_menu_categories.icon to icon_media_id
"""
import pymysql
import os
import sys

def main():
    # Get DB credentials from environment
    db_host = os.getenv('DATABASE_HOST', 'db')
    db_name = os.getenv('DATABASE_NAME', 'hotellink_db')
    db_user = os.getenv('DATABASE_USER', 'hotellink_user')
    db_pass = os.getenv('DATABASE_PASSWORD', 'hotellink_pass')

    print(f'🔌 Connecting to {db_host}/{db_name} as {db_user}...')

    try:
        conn = pymysql.connect(
            host=db_host,
            user=db_user,
            password=db_pass,
            database=db_name,
            charset='utf8mb4'
        )
        cursor = conn.cursor()
        
        print('✅ Connected successfully!\n')
        
        # Check current structure
        print('📋 Checking current table structure...')
        cursor.execute("SHOW COLUMNS FROM cafe_menu_categories WHERE Field IN ('icon', 'icon_media_id')")
        columns = cursor.fetchall()
        if columns:
            print('Current icon-related columns:')
            for col in columns:
                print(f'  - {col[0]}: {col[1]}')
        else:
            print('  No icon columns found')
        print()
        
        # Run migrations
        print('🚀 Running migrations...\n')
        
        # Step 1: Add icon_media_id column
        print('1. Adding icon_media_id column...')
        try:
            cursor.execute('ALTER TABLE cafe_menu_categories ADD COLUMN icon_media_id INT NULL AFTER code')
            print('   ✅ Column added')
        except Exception as e:
            if 'Duplicate column' in str(e):
                print('   ⚠️  Column already exists')
            else:
                print(f'   ❌ Error: {e}')
        
        # Step 2: Add index
        print('2. Adding index...')
        try:
            cursor.execute('CREATE INDEX idx_cafe_menu_categories_icon_media ON cafe_menu_categories(icon_media_id)')
            print('   ✅ Index added')
        except Exception as e:
            if 'Duplicate key' in str(e):
                print('   ⚠️  Index already exists')
            else:
                print(f'   ❌ Error: {e}')
        
        # Step 3: Add FK constraint
        print('3. Adding foreign key constraint...')
        try:
            cursor.execute('ALTER TABLE cafe_menu_categories ADD CONSTRAINT fk_cafe_menu_category_icon_media FOREIGN KEY (icon_media_id) REFERENCES media(id) ON DELETE SET NULL')
            print('   ✅ Foreign key added')
        except Exception as e:
            if 'Duplicate' in str(e) or 'already exists' in str(e):
                print('   ⚠️  Foreign key already exists')
            else:
                print(f'   ❌ Error: {e}')
        
        # Step 4: Drop old icon column
        print('4. Dropping old icon column...')
        try:
            cursor.execute('ALTER TABLE cafe_menu_categories DROP COLUMN icon')
            print('   ✅ Column dropped')
        except Exception as e:
            if "Can't DROP" in str(e) or 'check that' in str(e):
                print('   ⚠️  Column already dropped')
            else:
                print(f'   ❌ Error: {e}')
        
        conn.commit()
        print('\n📊 Verifying final structure...')
        cursor.execute('DESCRIBE cafe_menu_categories')
        print('\nFinal table structure:')
        print(f'{"Field":<25} {"Type":<20} {"Null":<5} {"Key":<5} {"Default":<10}')
        print('-' * 70)
        for col in cursor.fetchall():
            print(f'{col[0]:<25} {col[1]:<20} {col[2]:<5} {col[3]:<5} {str(col[4]):<10}')
        
        cursor.close()
        conn.close()
        print('\n🎉 Migration completed successfully!')
        return 0
        
    except Exception as e:
        print(f'\n❌ Migration failed: {e}')
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())

