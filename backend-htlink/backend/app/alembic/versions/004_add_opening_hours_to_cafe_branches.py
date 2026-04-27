"""Add opening_hours to cafe_branches

Revision ID: 004_add_opening_hours_to_cafe_branches
Revises: 003_alter_property_colors_to_text
Create Date: 2026-04-13 03:45:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy import inspect


# revision identifiers, used by Alembic.
revision = "004_add_opening_hours_to_cafe_branches"
down_revision = "003_alter_property_colors_to_text"
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("cafe_branches")}

    if "opening_hours" not in existing_columns:
        op.add_column(
            "cafe_branches",
            sa.Column("opening_hours", sa.String(length=255), nullable=True),
        )


def downgrade():
    bind = op.get_bind()
    inspector = inspect(bind)
    existing_columns = {column["name"] for column in inspector.get_columns("cafe_branches")}

    if "opening_hours" in existing_columns:
        op.drop_column("cafe_branches", "opening_hours")

