-- Migration: Change cafe_menu_categories.icon from varchar to media_id reference
-- Date: 2026-02-12
-- Description: Replace text icon with media reference for better image support

-- Step 1: Add new column icon_media_id
ALTER TABLE cafe_menu_categories
ADD COLUMN icon_media_id INT NULL AFTER code;

-- Step 2: Add foreign key constraint
ALTER TABLE cafe_menu_categories
ADD CONSTRAINT fk_cafe_menu_category_icon_media
FOREIGN KEY (icon_media_id) REFERENCES media(id) ON DELETE SET NULL;

-- Step 3: Drop old icon column
ALTER TABLE cafe_menu_categories
DROP COLUMN icon;

-- Step 4: Add index for better performance
CREATE INDEX idx_cafe_menu_categories_icon_media ON cafe_menu_categories(icon_media_id);
