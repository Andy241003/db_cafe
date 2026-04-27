"""Add booking_url to vr_hotel_settings

Revision ID: add_booking_url_vr_settings
Revises: add_ip_location_to_activity_logs
Create Date: 2025-01-10 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_booking_url_vr_settings'
down_revision = 'add_ip_location_to_activity_logs'
branch_labels = None
depends_on = None


def upgrade():
    # Add booking_url column to vr_hotel_settings
    op.add_column('vr_hotel_settings', 
        sa.Column('booking_url', sa.String(length=500), nullable=True)
    )


def downgrade():
    # Remove booking_url column from vr_hotel_settings
    op.drop_column('vr_hotel_settings', 'booking_url')

