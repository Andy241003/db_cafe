-- Migration: Add priority column to feature_categories table
-- Date: 2025-10-20
-- Description: Add priority field for sorting categories. Higher priority = appears first.

-- Add priority column (default 0)
ALTER TABLE feature_categories 
ADD COLUMN priority INT NOT NULL DEFAULT 0 COMMENT 'Higher number = higher priority for sorting';

-- Add index for faster sorting
CREATE INDEX idx_feature_categories_priority ON feature_categories(priority DESC, created_at DESC);

-- Optional: Set initial priorities based on created_at (oldest = highest priority)
-- Uncomment if you want to assign priorities automatically
-- UPDATE feature_categories 
-- SET priority = (
--     SELECT COUNT(*) 
--     FROM (SELECT id, created_at FROM feature_categories) AS t 
--     WHERE t.created_at <= feature_categories.created_at
-- );
