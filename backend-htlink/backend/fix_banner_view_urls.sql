-- Fix banner URLs: Convert /download to /view for public access
-- This SQL updates all properties' banner_images JSON

-- Step 1: Show current banner URLs
SELECT 
    id, 
    property_name, 
    banner_images 
FROM properties 
WHERE banner_images IS NOT NULL 
AND banner_images != '[]'
AND banner_images LIKE '%/download%';

-- Step 2: Update /download to /view
UPDATE properties 
SET banner_images = REPLACE(banner_images, '/download', '/view')
WHERE banner_images IS NOT NULL 
AND banner_images != '[]'
AND banner_images LIKE '%/download%';

-- Step 3: Verify the changes
SELECT 
    id, 
    property_name, 
    banner_images 
FROM properties 
WHERE banner_images IS NOT NULL 
AND banner_images != '[]';
