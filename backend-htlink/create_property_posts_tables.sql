-- Create property_posts table
CREATE TABLE property_posts (
    id INT AUTO_INCREMENT PRIMARY KEY,
    property_id INT NOT NULL,
    status VARCHAR(50) DEFAULT 'draft',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
);

-- Create property_post_translations table  
CREATE TABLE property_post_translations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    post_id INT NOT NULL,
    locale VARCHAR(10) NOT NULL,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    short_description VARCHAR(512),
    content TEXT,
    thumbnail_url VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES property_posts(id) ON DELETE CASCADE,
    UNIQUE KEY unique_post_locale (post_id, locale)
);