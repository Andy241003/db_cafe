"""Add messenger_url and phone_number to vr_hotel_settings

Revision ID: add_messenger_phone_vr_settings
Revises: add_booking_url_vr_settings
Create Date: 2026-01-28 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision = 'add_messenger_phone_vr_settings'
down_revision = 'add_booking_url_vr_settings'
branch_labels = None
depends_on = None


def upgrade():
    # Add messenger_url column
    op.add_column('vr_hotel_settings', 
        sa.Column('messenger_url', sa.String(length=500), nullable=True)
    )
    
    # Add phone_number column (for Zalo OA ID / Phone Number)
    op.add_column('vr_hotel_settings', 
        sa.Column('phone_number', sa.String(length=50), nullable=True)
    )


def downgrade():
    # Remove columns
    op.drop_column('vr_hotel_settings', 'phone_number')
    op.drop_column('vr_hotel_settings', 'messenger_url')

