-- Add messenger_url and phone_number columns to vr_hotel_settings
-- Run this SQL in your MySQL database

USE hotellink360_db;

-- Add messenger_url column
ALTER TABLE vr_hotel_settings 
ADD COLUMN messenger_url VARCHAR(500) NULL 
COMMENT 'Facebook Messenger link (m.me/yourpage)';

-- Add phone_number column (for Zalo OA ID / Phone Number)
ALTER TABLE vr_hotel_settings 
ADD COLUMN phone_number VARCHAR(50) NULL 
COMMENT 'Phone number or Zalo Official Account ID';

-- Verify the changes
DESCRIBE vr_hotel_settings;
