#!/usr/bin/env python3
"""
Create test property with tracking key for analytics testing
"""
import asyncio
from sqlmodel import Session, select
from app.core.db import engine
from app.models import Tenant, Property
import uuid

def create_test_property():
    with Session(engine) as session:
        # Get demo tenant
        demo_tenant = session.exec(
            select(Tenant).where(Tenant.code == "demo")
        ).first()
        
        if not demo_tenant:
            print("Demo tenant not found!")
            return
            
        print(f"Found tenant: {demo_tenant.name} (ID: {demo_tenant.id})")
        
        # Check if test property already exists
        existing_property = session.exec(
            select(Property).where(
                Property.tenant_id == demo_tenant.id,
                Property.property_name == "Test Hotel for Analytics"
            )
        ).first()
        
        if existing_property:
            print(f"Test property already exists: {existing_property.property_name}")
            print(f"Tracking key: {existing_property.tracking_key}")
            return existing_property.tracking_key
            
        # Create new test property
        test_property = Property(
            tenant_id=demo_tenant.id,
            property_name="Test Hotel for Analytics",
            code="test-hotel-analytics",
            tracking_key=str(uuid.uuid4())[:32].replace('-', ''),
            address="123 Test Street, Demo City",
            phone_number="+1-555-0123", 
            email="test@demo.hotel"
        )
        
        session.add(test_property)
        session.commit()
        session.refresh(test_property)
        
        print(f"Created test property: {test_property.property_name}")
        print(f"Property ID: {test_property.id}")
        print(f"Tracking key: {test_property.tracking_key}")
        
        return test_property.tracking_key

if __name__ == "__main__":
    tracking_key = create_test_property()
    print(f"\nUse this tracking key for testing: {tracking_key}")