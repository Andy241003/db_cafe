-- Fix meta_image_media_id type to BIGINT

ALTER TABLE cafe_settings 
MODIFY COLUMN meta_image_media_id BIGINT NULL;

ALTER TABLE cafe_settings 
ADD CONSTRAINT fk_cafe_settings_meta_image_media_id 
FOREIGN KEY (meta_image_media_id) REFERENCES media_files(id);
