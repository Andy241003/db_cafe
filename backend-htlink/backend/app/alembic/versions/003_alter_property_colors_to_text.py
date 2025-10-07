"""Alter property color columns to TEXT to support long CSS values

Revision ID: 003_alter_property_colors_to_text
Revises: 002_alter_property_colors
Create Date: 2025-10-07 13:30:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import mysql

# revision identifiers, used by Alembic.
revision = '003_alter_property_colors_to_text'
down_revision = '002_alter_property_colors'
branch_labels = None
depends_on = None


def upgrade():
    # Convert branding color fields to TEXT to support CSS gradients or long values
    op.alter_column(
        'properties',
        'primary_color',
        existing_type=sa.String(length=255),
        type_=mysql.TEXT(),
        existing_nullable=True,
    )

    op.alter_column(
        'properties',
        'secondary_color',
        existing_type=sa.String(length=255),
        type_=mysql.TEXT(),
        existing_nullable=True,
    )


def downgrade():
    # Revert back to previous VARCHAR(255) if needed
    op.alter_column(
        'properties',
        'primary_color',
        existing_type=mysql.TEXT(),
        type_=sa.String(length=255),
        existing_nullable=True,
    )

    op.alter_column(
        'properties',
        'secondary_color',
        existing_type=mysql.TEXT(),
        type_=sa.String(length=255),
        existing_nullable=True,
    )
