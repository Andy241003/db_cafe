-- Migration: Add meta_image_media_id column to vr_hotel_seo
-- Date: 2026-02-05
-- Description: Add meta image field for SEO (Open Graph, Twitter Card)

-- Add meta_image_media_id column
ALTER TABLE `vr_hotel_seo`
ADD COLUMN `meta_image_media_id` bigint DEFAULT NULL COMMENT 'Meta image for social sharing (Open Graph, Twitter Card)'
AFTER `meta_keywords`;

-- Add foreign key constraint
ALTER TABLE `vr_hotel_seo`
ADD KEY `fk_vr_seo_meta_image` (`meta_image_media_id`),
ADD CONSTRAINT `fk_vr_seo_meta_image` FOREIGN KEY (`meta_image_media_id`) REFERENCES `media_files` (`id`) ON DELETE SET NULL;

-- Verify the change
SELECT id, tenant_id, property_id, locale, meta_title, meta_image_media_id 
FROM vr_hotel_seo 
LIMIT 5;
