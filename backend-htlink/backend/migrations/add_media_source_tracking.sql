-- Add source tracking fields to media_files table
-- This allows us to distinguish between media uploaded from Travel (posts) vs VR Hotel (rooms/services/facilities/offers)

ALTER TABLE media_files
ADD COLUMN source ENUM('travel', 'vr_hotel', 'general') DEFAULT 'general' COMMENT 'Source module that uploaded this media',
ADD COLUMN entity_type VARCHAR(50) NULL COMMENT 'Type of entity: post, room, service, facility, offer, etc',
ADD COLUMN entity_id INT NULL COMMENT 'ID of the related entity',
ADD COLUMN folder VARCHAR(100) NULL COMMENT 'Logical folder/category: posts, rooms, services, facilities, offers, documents';

-- Add index for faster filtering
CREATE INDEX idx_media_source ON media_files(source);
CREATE INDEX idx_media_entity ON media_files(entity_type, entity_id);
CREATE INDEX idx_media_folder ON media_files(folder);

-- Update existing records based on file_key patterns (best effort)
UPDATE media_files 
SET source = 'vr_hotel', folder = 'rooms' 
WHERE file_key LIKE '%room%';

UPDATE media_files 
SET source = 'vr_hotel', folder = 'facilities' 
WHERE file_key LIKE '%pool%' OR file_key LIKE '%spa%' OR file_key LIKE '%facility%';

UPDATE media_files 
SET source = 'vr_hotel', folder = 'services' 
WHERE file_key LIKE '%service%';

UPDATE media_files 
SET source = 'travel', folder = 'posts'
WHERE file_key LIKE '%post%' OR id IN (SELECT DISTINCT media_id FROM post_media);
