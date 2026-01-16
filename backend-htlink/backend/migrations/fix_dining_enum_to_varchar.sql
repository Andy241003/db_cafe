-- Fix dining status enum issue by converting to VARCHAR
-- This avoids SQLAlchemy enum caching problems

USE linkhotel360_saas;

-- Change status column from ENUM to VARCHAR
ALTER TABLE vr_dining 
MODIFY COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add constraint to ensure only valid values
ALTER TABLE vr_dining 
ADD CONSTRAINT chk_dining_status 
CHECK (status IN ('active', 'inactive', 'closed'));

-- Verify the change
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT, IS_NULLABLE
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'linkhotel360_saas'
AND TABLE_NAME = 'vr_dining'
AND COLUMN_NAME = 'status';
