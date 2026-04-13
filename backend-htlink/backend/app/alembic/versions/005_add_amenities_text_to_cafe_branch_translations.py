"""Add amenities_text to cafe_branch_translations

Revision ID: 005_add_amenities_text_to_cafe_branch_translations
Revises: 004_add_opening_hours_to_cafe_branches
Create Date: 2026-04-13 03:55:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


revision = "005_add_amenities_text_to_cafe_branch_translations"
down_revision = "004_add_opening_hours_to_cafe_branches"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("cafe_branch_translations")}

    if "amenities_text" not in existing_columns:
        op.add_column(
            "cafe_branch_translations",
            sa.Column("amenities_text", sa.Text(), nullable=True),
        )


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("cafe_branch_translations")}

    if "amenities_text" in existing_columns:
        op.drop_column("cafe_branch_translations", "amenities_text")
