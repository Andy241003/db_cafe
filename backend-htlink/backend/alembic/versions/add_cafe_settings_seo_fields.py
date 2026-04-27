"""Add SEO and booking fields to cafe settings

Revision ID: add_cafe_settings_seo_fields
Revises: add_cafe_models
Create Date: 2026-02-09 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_cafe_settings_seo_fields'
down_revision = 'add_cafe_models'
branch_labels = None
depends_on = None


def upgrade():
    """
    Add SEO, booking, and contact fields to cafe_settings
    """
    # Add background_color
    op.add_column('cafe_settings', 
        sa.Column('background_color', sa.String(length=20), nullable=True, server_default='#ffffff')
    )
    
    # Add booking and contact URLs
    op.add_column('cafe_settings', 
        sa.Column('booking_url', sa.String(length=500), nullable=True)
    )
    op.add_column('cafe_settings', 
        sa.Column('messenger_url', sa.String(length=500), nullable=True)
    )
    op.add_column('cafe_settings', 
        sa.Column('phone_number', sa.String(length=50), nullable=True)
    )
    
    # Add SEO fields
    op.add_column('cafe_settings', 
        sa.Column('meta_title', sa.String(length=100), nullable=True)
    )
    op.add_column('cafe_settings', 
        sa.Column('meta_description', sa.String(length=500), nullable=True)
    )
    op.add_column('cafe_settings', 
        sa.Column('meta_keywords', sa.String(length=500), nullable=True)
    )
    op.add_column('cafe_settings', 
        sa.Column('meta_image_media_id', sa.Integer(), nullable=True)
    )
    
    # Add foreign key for meta_image_media_id
    op.create_foreign_key(
        'fk_cafe_settings_meta_image_media_id',
        'cafe_settings', 'media_files',
        ['meta_image_media_id'], ['id']
    )


def downgrade():
    """
    Remove SEO, booking, and contact fields from cafe_settings
    """
    op.drop_constraint('fk_cafe_settings_meta_image_media_id', 'cafe_settings', type_='foreignkey')
    
    op.drop_column('cafe_settings', 'meta_image_media_id')
    op.drop_column('cafe_settings', 'meta_keywords')
    op.drop_column('cafe_settings', 'meta_description')
    op.drop_column('cafe_settings', 'meta_title')
    op.drop_column('cafe_settings', 'phone_number')
    op.drop_column('cafe_settings', 'messenger_url')
    op.drop_column('cafe_settings', 'booking_url')
    op.drop_column('cafe_settings', 'background_color')

