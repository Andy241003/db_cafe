"""Alter property color columns to support longer CSS values

Revision ID: 002_alter_property_colors
Revises: 001_linkhotel_saas_schema
Create Date: 2025-10-07 06:30:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = '002_alter_property_colors'
down_revision = '001_linkhotel_saas_schema'
branch_labels = None
depends_on = None


def upgrade():
    # Increase the length for branding color fields to support CSS gradients
    op.alter_column(
        'properties',
        'primary_color',
        existing_type=sa.String(length=10),
        type_=sa.String(length=255),
        existing_nullable=True,
    )

    op.alter_column(
        'properties',
        'secondary_color',
        existing_type=sa.String(length=10),
        type_=sa.String(length=255),
        existing_nullable=True,
    )


def downgrade():
    # Revert back to previous shorter length if needed
    op.alter_column(
        'properties',
        'primary_color',
        existing_type=sa.String(length=255),
        type_=sa.String(length=10),
        existing_nullable=True,
    )

    op.alter_column(
        'properties',
        'secondary_color',
        existing_type=sa.String(length=255),
        type_=sa.String(length=10),
        existing_nullable=True,
    )

