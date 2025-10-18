-- Add original_filename column to media_files table
-- This stores the original filename when users upload files

ALTER TABLE media_files 
ADD COLUMN original_filename VARCHAR(255) NULL AFTER file_key;

-- Update existing records to use file_key as original_filename temporarily
-- Extract just the filename part (after last slash, if any)
UPDATE media_files 
SET original_filename = CASE 
    WHEN file_key LIKE '%/%' THEN SUBSTRING_INDEX(file_key, '/', -1)
    ELSE file_key
END
WHERE original_filename IS NULL;

-- Add comment to the column
ALTER TABLE media_files 
MODIFY COLUMN original_filename VARCHAR(255) NULL COMMENT 'Original filename when uploaded by user';
