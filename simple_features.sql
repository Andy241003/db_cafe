-- Simple seed data for demo
SET @demo_tenant_id = 1;

-- Insert sample features directly (matching actual table structure)
INSERT IGNORE INTO features (id, tenant_id, category_id, slug, icon_key, is_system, created_at) VALUES
(1, @demo_tenant_id, 4, 'wifi', 'fa-wifi', 0, NOW()),
(2, @demo_tenant_id, 6, 'swimming-pool', 'fa-swimming-pool', 0, NOW()),
(3, @demo_tenant_id, 5, 'restaurant', 'fa-utensils', 0, NOW()),
(4, @demo_tenant_id, 4, 'spa', 'fa-spa', 0, NOW()),
(5, @demo_tenant_id, 6, 'gym', 'fa-dumbbell', 0, NOW()),
(6, @demo_tenant_id, 4, 'parking', 'fa-parking', 0, NOW()),
(7, @demo_tenant_id, 4, 'concierge', 'fa-concierge-bell', 0, NOW()),
(8, @demo_tenant_id, 6, 'conference-room', 'fa-presentation', 0, NOW());

SELECT 'Sample features inserted successfully' as status;