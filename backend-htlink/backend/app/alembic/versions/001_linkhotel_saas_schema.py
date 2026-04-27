"""LinkHotel SaaS Schema

Revision ID: 001_linkhotel_saas_schema
Revises: 
Create Date: 2025-09-16 15:36:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '001_linkhotel_saas_schema'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create plans table
    op.create_table('plans',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('code', sa.String(length=50), nullable=False),
    sa.Column('name', sa.String(length=120), nullable=False),
    sa.Column('features_json', sa.JSON(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code')
    )
    
    # Create tenants table
    op.create_table('tenants',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('plan_id', sa.BigInteger(), nullable=True),
    sa.Column('name', sa.String(length=200), nullable=False),
    sa.Column('code', sa.String(length=80), nullable=False),
    sa.Column('default_locale', sa.String(length=10), nullable=False),
    sa.Column('fallback_locale', sa.String(length=10), nullable=False),
    sa.Column('settings_json', sa.JSON(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['plan_id'], ['plans.id'], name='fk_tenants_plan'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('code')
    )
    
    # Create locales table
    op.create_table('locales',
    sa.Column('code', sa.String(length=10), nullable=False),
    sa.Column('name', sa.String(length=100), nullable=False),
    sa.Column('native_name', sa.String(length=100), nullable=False),
    sa.PrimaryKeyConstraint('code')
    )
    
    # Create admin_users table
    op.create_table('admin_users',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('email', sa.String(length=190), nullable=False),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('full_name', sa.String(length=180), nullable=False),
    sa.Column('role', sa.Enum('OWNER', 'ADMIN', 'EDITOR', 'VIEWER', name='userrole'), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_users_tenant', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'email', name='uq_users_email')
    )
    
    # Create properties table
    op.create_table('properties',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('property_name', sa.String(length=255), nullable=False),
    sa.Column('code', sa.String(length=100), nullable=False),
    sa.Column('slogan', sa.String(length=255), nullable=True),
    sa.Column('description', sa.TEXT(), nullable=True),
    sa.Column('logo_url', sa.String(length=255), nullable=True),
    sa.Column('banner_images', sa.JSON(), nullable=True),
    sa.Column('intro_video_url', sa.String(length=255), nullable=True),
    sa.Column('vr360_url', sa.String(length=255), nullable=True),
    sa.Column('address', sa.String(length=255), nullable=True),
    sa.Column('district', sa.String(length=100), nullable=True),
    sa.Column('city', sa.String(length=100), nullable=True),
    sa.Column('country', sa.String(length=100), nullable=True),
    sa.Column('postal_code', sa.String(length=20), nullable=True),
    sa.Column('phone_number', sa.String(length=50), nullable=True),
    sa.Column('email', sa.String(length=100), nullable=True),
    sa.Column('website_url', sa.String(length=255), nullable=True),
    sa.Column('zalo_oa_id', sa.String(length=50), nullable=True),
    sa.Column('facebook_url', sa.String(length=255), nullable=True),
    sa.Column('youtube_url', sa.String(length=255), nullable=True),
    sa.Column('tiktok_url', sa.String(length=255), nullable=True),
    sa.Column('instagram_url', sa.String(length=255), nullable=True),
    sa.Column('google_map_url', sa.String(length=512), nullable=True),
    sa.Column('latitude', sa.DECIMAL(precision=10, scale=8), nullable=True),
    sa.Column('longitude', sa.DECIMAL(precision=11, scale=8), nullable=True),
    sa.Column('primary_color', sa.String(length=255), nullable=True),
    sa.Column('secondary_color', sa.String(length=255), nullable=True),
    sa.Column('copyright_text', sa.String(length=255), nullable=True),
    sa.Column('terms_url', sa.String(length=255), nullable=True),
    sa.Column('privacy_url', sa.String(length=255), nullable=True),
    sa.Column('timezone', sa.String(length=60), nullable=True),
    sa.Column('default_locale', sa.String(length=10), nullable=False),
    sa.Column('settings_json', sa.JSON(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_properties_tenant', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'code', name='uq_properties_code'),
    sa.Index('idx_properties_tenant', 'tenant_id')
    )
    
    # Create feature_categories table
    op.create_table('feature_categories',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('slug', sa.String(length=100), nullable=False),
    sa.Column('icon_key', sa.String(length=120), nullable=True),
    sa.Column('is_system', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'slug', name='uq_cat_slug')
    )
    
    # Create feature_category_translations table
    op.create_table('feature_category_translations',
    sa.Column('category_id', sa.BigInteger(), nullable=False),
    sa.Column('locale', sa.String(length=10), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('short_desc', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['category_id'], ['feature_categories.id'], name='fk_cat_tr_cat', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['locale'], ['locales.code'], name='fk_cat_tr_locale'),
    sa.PrimaryKeyConstraint('category_id', 'locale')
    )
    
    # Create features table
    op.create_table('features',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('category_id', sa.BigInteger(), nullable=False),
    sa.Column('slug', sa.String(length=120), nullable=False),
    sa.Column('icon_key', sa.String(length=120), nullable=True),
    sa.Column('is_system', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['category_id'], ['feature_categories.id'], name='fk_features_category', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'slug', name='uq_feature_slug'),
    sa.Index('idx_feature_category', 'category_id')
    )
    
    # Create feature_translations table
    op.create_table('feature_translations',
    sa.Column('feature_id', sa.BigInteger(), nullable=False),
    sa.Column('locale', sa.String(length=10), nullable=False),
    sa.Column('title', sa.String(length=200), nullable=False),
    sa.Column('short_desc', sa.String(length=500), nullable=True),
    sa.ForeignKeyConstraint(['feature_id'], ['features.id'], name='fk_feat_tr_feature', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['locale'], ['locales.code'], name='fk_feat_tr_locale'),
    sa.PrimaryKeyConstraint('feature_id', 'locale')
    )
    
    # Create property_categories table
    op.create_table('property_categories',
    sa.Column('property_id', sa.BigInteger(), nullable=False),
    sa.Column('category_id', sa.BigInteger(), nullable=False),
    sa.Column('is_enabled', sa.Boolean(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='fk_prop_cat_property', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['category_id'], ['feature_categories.id'], name='fk_prop_cat_category', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('property_id', 'category_id')
    )
    
    # Create property_features table
    op.create_table('property_features',
    sa.Column('property_id', sa.BigInteger(), nullable=False),
    sa.Column('feature_id', sa.BigInteger(), nullable=False),
    sa.Column('is_enabled', sa.Boolean(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='fk_prop_feat_property', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['feature_id'], ['features.id'], name='fk_prop_feat_feature', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('property_id', 'feature_id')
    )
    
    # Create posts table
    op.create_table('posts',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('property_id', sa.BigInteger(), nullable=False),
    sa.Column('feature_id', sa.BigInteger(), nullable=False),
    sa.Column('slug', sa.String(length=160), nullable=False),
    sa.Column('status', sa.Enum('draft', 'published', 'archived', name='poststatus'), nullable=False),
    sa.Column('pinned', sa.Boolean(), nullable=False),
    sa.Column('cover_media_id', sa.BigInteger(), nullable=True),
    sa.Column('published_at', sa.DateTime(), nullable=True),
    sa.Column('created_by', sa.BigInteger(), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.Column('updated_at', sa.DateTime(), nullable=True),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_posts_tenant', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='fk_posts_property', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['feature_id'], ['features.id'], name='fk_posts_feature', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'property_id', 'feature_id', 'slug', name='uq_post_slug'),
    sa.Index('idx_post_lookup', 'tenant_id', 'property_id', 'feature_id', 'status', 'pinned')
    )
    
    # Create post_translations table
    op.create_table('post_translations',
    sa.Column('post_id', sa.BigInteger(), nullable=False),
    sa.Column('locale', sa.String(length=10), nullable=False),
    sa.Column('title', sa.String(length=250), nullable=False),
    sa.Column('subtitle', sa.String(length=300), nullable=True),
    sa.Column('content_html', mysql.MEDIUMTEXT(), nullable=False),
    sa.Column('seo_title', sa.String(length=250), nullable=True),
    sa.Column('seo_desc', sa.String(length=300), nullable=True),
    sa.Column('og_image_id', sa.BigInteger(), nullable=True),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name='fk_pt_post', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['locale'], ['locales.code'], name='fk_pt_locale'),
    sa.PrimaryKeyConstraint('post_id', 'locale')
    )
    
    # Create media_files table
    op.create_table('media_files',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('uploader_id', sa.BigInteger(), nullable=True),
    sa.Column('kind', sa.Enum('image', 'video', 'file', 'icon', name='mediakind'), nullable=False),
    sa.Column('mime_type', sa.String(length=120), nullable=True),
    sa.Column('file_key', sa.String(length=255), nullable=False),
    sa.Column('width', sa.Integer(), nullable=True),
    sa.Column('height', sa.Integer(), nullable=True),
    sa.Column('size_bytes', sa.BigInteger(), nullable=True),
    sa.Column('alt_text', sa.String(length=300), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_media_tenant', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id'),
    sa.Index('idx_media_tenant', 'tenant_id', 'kind')
    )
    
    # Create post_media table
    op.create_table('post_media',
    sa.Column('post_id', sa.BigInteger(), nullable=False),
    sa.Column('media_id', sa.BigInteger(), nullable=False),
    sa.Column('sort_order', sa.Integer(), nullable=False),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name='fk_pm_post', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['media_id'], ['media_files.id'], name='fk_pm_media', ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('post_id', 'media_id')
    )
    
    # Create events table
    op.create_table('events',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('property_id', sa.BigInteger(), nullable=False),
    sa.Column('category_id', sa.BigInteger(), nullable=True),
    sa.Column('feature_id', sa.BigInteger(), nullable=True),
    sa.Column('post_id', sa.BigInteger(), nullable=True),
    sa.Column('locale', sa.String(length=10), nullable=True),
    sa.Column('event_type', sa.Enum('page_view', 'click', 'share', name='eventtype'), nullable=False),
    sa.Column('device', sa.Enum('desktop', 'tablet', 'mobile', name='devicetype'), nullable=True),
    sa.Column('user_agent', sa.String(length=255), nullable=True),
    sa.Column('ip_hash', sa.String(length=64), nullable=True),
    sa.Column('created_at', sa.DateTime(), nullable=False),
    sa.ForeignKeyConstraint(['tenant_id'], ['tenants.id'], name='fk_ev_tenant', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['property_id'], ['properties.id'], name='fk_ev_property', ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['category_id'], ['feature_categories.id'], name='fk_ev_category', ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['feature_id'], ['features.id'], name='fk_ev_feature', ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['post_id'], ['posts.id'], name='fk_ev_post', ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('id'),
    sa.Index('idx_events', 'tenant_id', 'property_id', 'event_type', 'created_at')
    )
    
    # Create settings table
    op.create_table('settings',
    sa.Column('id', sa.BigInteger(), autoincrement=True, nullable=False),
    sa.Column('tenant_id', sa.BigInteger(), nullable=False),
    sa.Column('property_id', sa.BigInteger(), nullable=False),
    sa.Column('key_name', sa.String(length=160), nullable=False),
    sa.Column('value_json', sa.JSON(), nullable=True),
    sa.PrimaryKeyConstraint('id'),
    sa.UniqueConstraint('tenant_id', 'property_id', 'key_name', name='uq_settings2')
    )


def downgrade():
    op.drop_table('settings')
    op.drop_table('events')
    op.drop_table('post_media')
    op.drop_table('media_files')
    op.drop_table('post_translations')
    op.drop_table('posts')
    op.drop_table('property_features')
    op.drop_table('property_categories')
    op.drop_table('feature_translations')
    op.drop_table('features')
    op.drop_table('feature_category_translations')
    op.drop_table('feature_categories')
    op.drop_table('properties')
    op.drop_table('admin_users')
    op.drop_table('locales')
    op.drop_table('tenants')
    op.drop_table('plans')
