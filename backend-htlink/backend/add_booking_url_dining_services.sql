-- Migration: Add booking_url column to vr_dining and vr_services tables
-- Date: 2026-01-26
-- Description: Adds booking_url field to store reservation/booking links for dining and services

-- Add booking_url to vr_dining table
ALTER TABLE vr_dining
ADD COLUMN booking_url VARCHAR(500) NULL
AFTER vr_link;

-- Add booking_url to vr_services table
ALTER TABLE vr_services
ADD COLUMN booking_url VARCHAR(500) NULL
AFTER vr_link;

-- Verify the columns were added
DESCRIBE vr_dining;
DESCRIBE vr_services;
