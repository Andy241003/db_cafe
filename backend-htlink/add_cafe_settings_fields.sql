-- Add missing fields to cafe_settings table

ALTER TABLE cafe_settings 
ADD COLUMN background_color VARCHAR(20) DEFAULT '#ffffff' AFTER secondary_color;

ALTER TABLE cafe_settings 
ADD COLUMN booking_url VARCHAR(500) NULL AFTER website;

ALTER TABLE cafe_settings 
ADD COLUMN messenger_url VARCHAR(500) NULL AFTER booking_url;

ALTER TABLE cafe_settings 
ADD COLUMN phone_number VARCHAR(50) NULL AFTER messenger_url;

ALTER TABLE cafe_settings 
ADD COLUMN meta_title VARCHAR(100) NULL AFTER settings_json;

ALTER TABLE cafe_settings 
ADD COLUMN meta_description VARCHAR(500) NULL AFTER meta_title;

ALTER TABLE cafe_settings 
ADD COLUMN meta_keywords VARCHAR(500) NULL AFTER meta_description;

ALTER TABLE cafe_settings 
ADD COLUMN meta_image_media_id BIGINT NULL AFTER meta_keywords;

ALTER TABLE cafe_settings 
ADD CONSTRAINT fk_cafe_settings_meta_image_media_id 
FOREIGN KEY (meta_image_media_id) REFERENCES media_files(id);
