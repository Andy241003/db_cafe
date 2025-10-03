CREATE TABLE `property_posts` (
    -- Khóa chính
    `id` BIGINT NOT NULL AUTO_INCREMENT PRIMARY KEY,
    
    -- Khóa ngoại: Liên kết đến bảng properties (BIGINT signed)
    `property_id` BIGINT NOT NULL,
    
    -- Trạng thái
    `status` VARCHAR(50) NOT NULL DEFAULT 'draft', -- Ví dụ: 'draft', 'published', 'archived'
    
    -- Thời gian
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    -- Khóa ngoại
    CONSTRAINT `fk_property_posts_property`
        FOREIGN KEY (`property_id`) 
        REFERENCES `properties`(`id`) 
        ON DELETE CASCADE
        ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
CREATE TABLE `property_post_translations` (
    -- Khóa ngoại: Liên kết đến bảng property_posts
    `post_id` BIGINT NOT NULL,
    
    -- Khóa chính & Ngôn ngữ
    `locale` VARCHAR(10) NOT NULL, -- Mã ngôn ngữ
    
    -- Nội dung dịch thuật
    `title` VARCHAR(255) NOT NULL,
    `slug` VARCHAR(255) NOT NULL, 
    `short_description` VARCHAR(512) NULL,
    `content` LONGTEXT NULL, 
    `thumbnail_url` VARCHAR(255) NULL, 
    
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
    
    -- Khóa chính kép
    PRIMARY KEY (`post_id`, `locale`),

    -- Thiết lập Khóa ngoại
    CONSTRAINT `fk_post_translations_post`
        FOREIGN KEY (`post_id`) 
        REFERENCES `property_posts`(`id`) 
        ON DELETE CASCADE, 
        
    -- Đảm bảo SLUG duy nhất trong mỗi ngôn ngữ
    UNIQUE KEY `uk_post_translations_slug_locale` (`slug`, `locale`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;