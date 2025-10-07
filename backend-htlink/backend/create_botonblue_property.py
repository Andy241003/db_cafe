#!/usr/bin/env python3

import sys
import os
sys.path.append('/app')

from sqlmodel import Session, select
from app.core.db import engine
from app.models import Property, Tenant

def create_botonblue_property():
    with Session(engine) as session:
        # Check if property already exists
        existing = session.exec(
            select(Property).where(Property.tracking_key == 'botonblue-tracking-key')
        ).first()

        if existing:
            print(f'Property already exists: {existing.property_name} with tracking key: {existing.tracking_key}')
            return existing

        # Create new property for botonblue
        property = Property(
            tenant_id=1,  # Demo tenant
            property_name='Boton Blue Resort',
            code='BOTONBLUE',
            description='Luxury beachfront resort in Vietnam',
            website_url='https://botonblue.trip360.vn',
            tracking_key='botonblue-tracking-key',
            default_locale='en',
            timezone='Asia/Ho_Chi_Minh',
            is_active=True
        )
        session.add(property)
        session.commit()
        session.refresh(property)
        
        print(f'✅ Created property: {property.property_name}')
        print(f'   - ID: {property.id}')
        print(f'   - Tracking Key: {property.tracking_key}')
        print(f'   - Website: {property.website_url}')
        print(f'   - Tenant ID: {property.tenant_id}')
        
        return property

if __name__ == '__main__':
    create_botonblue_property()