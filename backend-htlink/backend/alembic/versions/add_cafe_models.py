"""Add Cafe Management Models

Revision ID: add_cafe_models
Revises: add_messenger_phone_to_vr_settings
Create Date: 2026-02-09 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = 'add_cafe_models'
down_revision = '003_alter_property_colors_to_text'
branch_labels = None
depends_on = None


def upgrade():
    """
    Create all Cafe Management tables
    """
    
    # Cafe Settings
    op.create_table('cafe_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('cafe_name', sa.String(length=255), nullable=False),
        sa.Column('slogan', sa.String(length=500), nullable=True),
        sa.Column('primary_color', sa.String(length=20), nullable=False, server_default='#6f4e37'),
        sa.Column('secondary_color', sa.String(length=20), nullable=False, server_default='#d4a574'),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('website', sa.String(length=255), nullable=True),
        sa.Column('facebook_url', sa.String(length=255), nullable=True),
        sa.Column('instagram_url', sa.String(length=255), nullable=True),
        sa.Column('youtube_url', sa.String(length=255), nullable=True),
        sa.Column('tiktok_url', sa.String(length=255), nullable=True),
        sa.Column('logo_media_id', sa.Integer(), nullable=True),
        sa.Column('favicon_media_id', sa.Integer(), nullable=True),
        sa.Column('cover_image_media_id', sa.Integer(), nullable=True),
        sa.Column('business_hours', mysql.JSON(), nullable=True),
        sa.Column('settings_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['logo_media_id'], ['media_files.id'], ),
        sa.ForeignKeyConstraint(['favicon_media_id'], ['media_files.id'], ),
        sa.ForeignKeyConstraint(['cover_image_media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_settings_tenant_id'), 'cafe_settings', ['tenant_id'], unique=False)
    
    # Cafe Page Settings
    op.create_table('cafe_page_settings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('page_code', sa.String(length=50), nullable=False),
        sa.Column('is_displaying', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('vr360_link', sa.String(length=1000), nullable=True),
        sa.Column('vr_title', sa.String(length=255), nullable=True),
        sa.Column('settings_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_page_settings_tenant_id'), 'cafe_page_settings', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_page_settings_page_code'), 'cafe_page_settings', ['page_code'], unique=False)
    
    # Cafe Branches
    op.create_table('cafe_branches',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('email', sa.String(length=100), nullable=True),
        sa.Column('latitude', sa.Float(), nullable=True),
        sa.Column('longitude', sa.Float(), nullable=True),
        sa.Column('google_maps_url', sa.String(length=1000), nullable=True),
        sa.Column('primary_image_media_id', sa.Integer(), nullable=True),
        sa.Column('vr360_link', sa.String(length=1000), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attributes_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['primary_image_media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_branches_tenant_id'), 'cafe_branches', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_branches_code'), 'cafe_branches', ['code'], unique=False)
    
    # Cafe Branch Translations
    op.create_table('cafe_branch_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('branch_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('address', sa.String(length=500), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['cafe_branches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_branch_translations_branch_id'), 'cafe_branch_translations', ['branch_id'], unique=False)
    op.create_index(op.f('ix_cafe_branch_translations_locale'), 'cafe_branch_translations', ['locale'], unique=False)
    
    # Cafe Branch Media
    op.create_table('cafe_branch_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('branch_id', sa.Integer(), nullable=False),
        sa.Column('media_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['branch_id'], ['cafe_branches.id'], ),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_branch_media_branch_id'), 'cafe_branch_media', ['branch_id'], unique=False)
    op.create_index(op.f('ix_cafe_branch_media_media_id'), 'cafe_branch_media', ['media_id'], unique=False)
    
    # Cafe Menu Categories
    op.create_table('cafe_menu_categories',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('icon', sa.String(length=100), nullable=True),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_menu_categories_tenant_id'), 'cafe_menu_categories', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_categories_code'), 'cafe_menu_categories', ['code'], unique=False)
    
    # Cafe Menu Category Translations
    op.create_table('cafe_menu_category_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.String(length=500), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['category_id'], ['cafe_menu_categories.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_menu_category_translations_category_id'), 'cafe_menu_category_translations', ['category_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_category_translations_locale'), 'cafe_menu_category_translations', ['locale'], unique=False)
    
    # Cafe Menu Items
    op.create_table('cafe_menu_items',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('category_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('price', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('original_price', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='available'),
        sa.Column('sizes', mysql.JSON(), nullable=True),
        sa.Column('tags', mysql.JSON(), nullable=True),
        sa.Column('calories', sa.Integer(), nullable=True),
        sa.Column('primary_image_media_id', sa.Integer(), nullable=True),
        sa.Column('is_bestseller', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_new', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('is_seasonal', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attributes_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['category_id'], ['cafe_menu_categories.id'], ),
        sa.ForeignKeyConstraint(['primary_image_media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_menu_items_tenant_id'), 'cafe_menu_items', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_items_category_id'), 'cafe_menu_items', ['category_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_items_code'), 'cafe_menu_items', ['code'], unique=False)
    
    # Cafe Menu Item Translations
    op.create_table('cafe_menu_item_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('ingredients', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['cafe_menu_items.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_menu_item_translations_item_id'), 'cafe_menu_item_translations', ['item_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_item_translations_locale'), 'cafe_menu_item_translations', ['locale'], unique=False)
    
    # Cafe Menu Item Media
    op.create_table('cafe_menu_item_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('item_id', sa.Integer(), nullable=False),
        sa.Column('media_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['item_id'], ['cafe_menu_items.id'], ),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_menu_item_media_item_id'), 'cafe_menu_item_media', ['item_id'], unique=False)
    op.create_index(op.f('ix_cafe_menu_item_media_media_id'), 'cafe_menu_item_media', ['media_id'], unique=False)
    
    # Cafe Events
    op.create_table('cafe_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('start_time', sa.String(length=10), nullable=True),
        sa.Column('end_time', sa.String(length=10), nullable=True),
        sa.Column('branch_id', sa.Integer(), nullable=True),
        sa.Column('location_text', sa.String(length=500), nullable=True),
        sa.Column('registration_url', sa.String(length=1000), nullable=True),
        sa.Column('max_participants', sa.Integer(), nullable=True),
        sa.Column('primary_image_media_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='upcoming'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attributes_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['branch_id'], ['cafe_branches.id'], ),
        sa.ForeignKeyConstraint(['primary_image_media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_events_tenant_id'), 'cafe_events', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_events_code'), 'cafe_events', ['code'], unique=False)
    
    # Cafe Event Translations
    op.create_table('cafe_event_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('details', mysql.LONGTEXT(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['cafe_events.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_event_translations_event_id'), 'cafe_event_translations', ['event_id'], unique=False)
    op.create_index(op.f('ix_cafe_event_translations_locale'), 'cafe_event_translations', ['locale'], unique=False)
    
    # Cafe Event Media
    op.create_table('cafe_event_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('event_id', sa.Integer(), nullable=False),
        sa.Column('media_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['event_id'], ['cafe_events.id'], ),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_event_media_event_id'), 'cafe_event_media', ['event_id'], unique=False)
    op.create_index(op.f('ix_cafe_event_media_media_id'), 'cafe_event_media', ['media_id'], unique=False)
    
    # Cafe Careers
    op.create_table('cafe_careers',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('job_type', sa.String(length=50), nullable=True),
        sa.Column('experience_required', sa.String(length=100), nullable=True),
        sa.Column('salary_min', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('salary_max', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('salary_text', sa.String(length=100), nullable=True),
        sa.Column('deadline', sa.Date(), nullable=True),
        sa.Column('contact_email', sa.String(length=100), nullable=True),
        sa.Column('contact_phone', sa.String(length=50), nullable=True),
        sa.Column('application_url', sa.String(length=1000), nullable=True),
        sa.Column('branch_id', sa.Integer(), nullable=True),
        sa.Column('status', sa.String(length=20), nullable=False, server_default='open'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('is_urgent', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('attributes_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['branch_id'], ['cafe_branches.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_careers_tenant_id'), 'cafe_careers', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_careers_code'), 'cafe_careers', ['code'], unique=False)
    
    # Cafe Career Translations
    op.create_table('cafe_career_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('career_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('requirements', sa.Text(), nullable=True),
        sa.Column('benefits', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['career_id'], ['cafe_careers.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_career_translations_career_id'), 'cafe_career_translations', ['career_id'], unique=False)
    op.create_index(op.f('ix_cafe_career_translations_locale'), 'cafe_career_translations', ['locale'], unique=False)
    
    # Cafe Promotions
    op.create_table('cafe_promotions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('tenant_id', sa.Integer(), nullable=False),
        sa.Column('code', sa.String(length=50), nullable=False, unique=True),
        sa.Column('promotion_type', sa.String(length=20), nullable=False, server_default='percentage'),
        sa.Column('discount_value', sa.DECIMAL(10, 2), nullable=True),
        sa.Column('start_date', sa.Date(), nullable=True),
        sa.Column('end_date', sa.Date(), nullable=True),
        sa.Column('applicable_menu_items', mysql.JSON(), nullable=True),
        sa.Column('applicable_categories', mysql.JSON(), nullable=True),
        sa.Column('applicable_branches', mysql.JSON(), nullable=True),
        sa.Column('min_purchase_amount', sa.DECIMAL(12, 2), nullable=True),
        sa.Column('primary_image_media_id', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='1'),
        sa.Column('is_featured', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('display_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('attributes_json', mysql.JSON(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], ),
        sa.ForeignKeyConstraint(['primary_image_media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_promotions_tenant_id'), 'cafe_promotions', ['tenant_id'], unique=False)
    op.create_index(op.f('ix_cafe_promotions_code'), 'cafe_promotions', ['code'], unique=False)
    
    # Cafe Promotion Translations
    op.create_table('cafe_promotion_translations',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('promotion_id', sa.Integer(), nullable=False),
        sa.Column('locale', sa.String(length=10), nullable=False),
        sa.Column('title', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('terms_and_conditions', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['promotion_id'], ['cafe_promotions.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_promotion_translations_promotion_id'), 'cafe_promotion_translations', ['promotion_id'], unique=False)
    op.create_index(op.f('ix_cafe_promotion_translations_locale'), 'cafe_promotion_translations', ['locale'], unique=False)
    
    # Cafe Promotion Media
    op.create_table('cafe_promotion_media',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('promotion_id', sa.Integer(), nullable=False),
        sa.Column('media_id', sa.Integer(), nullable=False),
        sa.Column('is_primary', sa.Boolean(), nullable=False, server_default='0'),
        sa.Column('sort_order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['promotion_id'], ['cafe_promotions.id'], ),
        sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_cafe_promotion_media_promotion_id'), 'cafe_promotion_media', ['promotion_id'], unique=False)
    op.create_index(op.f('ix_cafe_promotion_media_media_id'), 'cafe_promotion_media', ['media_id'], unique=False)


def downgrade():
    """
    Drop all Cafe Management tables
    """
    op.drop_table('cafe_promotion_media')
    op.drop_table('cafe_promotion_translations')
    op.drop_table('cafe_promotions')
    op.drop_table('cafe_career_translations')
    op.drop_table('cafe_careers')
    op.drop_table('cafe_event_media')
    op.drop_table('cafe_event_translations')
    op.drop_table('cafe_events')
    op.drop_table('cafe_menu_item_media')
    op.drop_table('cafe_menu_item_translations')
    op.drop_table('cafe_menu_items')
    op.drop_table('cafe_menu_category_translations')
    op.drop_table('cafe_menu_categories')
    op.drop_table('cafe_branch_media')
    op.drop_table('cafe_branch_translations')
    op.drop_table('cafe_branches')
    op.drop_table('cafe_page_settings')
    op.drop_table('cafe_settings')

