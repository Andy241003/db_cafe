"""make_vr360_property_nullable

Revision ID: 4c3f62a9b8d3
Revises: 36ddc74b5eef
Create Date: 2026-05-14 10:45:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '4c3f62a9b8d3'
down_revision = '36ddc74b5eef'
branch_labels = None
depends_on = None


def upgrade():
    op.alter_column(
        'vr360_scenes',
        'property_id',
        existing_type=sa.Integer(),
        nullable=True,
    )


def downgrade():
    op.alter_column(
        'vr360_scenes',
        'property_id',
        existing_type=sa.Integer(),
        nullable=False,
    )
