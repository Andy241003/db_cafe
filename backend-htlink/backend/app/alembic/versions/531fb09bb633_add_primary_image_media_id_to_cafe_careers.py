"""add_primary_image_media_id_to_cafe_careers

Revision ID: 531fb09bb633
Revises: 005_add_amenities_text_to_cafe_branch_translations
Create Date: 2026-04-15 04:08:36.797516

"""
from alembic import op
import sqlalchemy as sa
import sqlmodel.sql.sqltypes


# revision identifiers, used by Alembic.
revision = '531fb09bb633'
down_revision = '005_add_amenities_text_to_cafe_branch_translations'
branch_labels = None
depends_on = None


def upgrade():
    # Add primary_image_media_id column to cafe_careers table
    op.add_column('cafe_careers', sa.Column('primary_image_media_id', sa.Integer(), nullable=True))
    op.create_foreign_key(
        'fk_cafe_careers_primary_image_media_id',
        'cafe_careers',
        'media_files',
        ['primary_image_media_id'],
        ['id']
    )


def downgrade():
    # Remove foreign key and column
    op.drop_constraint('fk_cafe_careers_primary_image_media_id', 'cafe_careers', type_='foreignkey')
    op.drop_column('cafe_careers', 'primary_image_media_id')
