#!/usr/bin/env python3
"""
Script to add tracking_key to existing properties
"""
import uuid
import sys
from pathlib import Path

# Add the parent directory to the Python path
sys.path.append(str(Path(__file__).parent.parent))

from sqlmodel import Session, select
from app.core.db import engine
from app.models import Property

def generate_tracking_key():
    """Generate a unique tracking key"""
    return str(uuid.uuid4()).replace('-', '')

def add_tracking_keys():
    """Add tracking keys to properties that don't have them"""
    with Session(engine) as session:
        # Get all properties without tracking keys
        properties = session.exec(
            select(Property).where(Property.tracking_key.is_(None))
        ).all()
        
        print(f"Found {len(properties)} properties without tracking keys")
        
        for property_obj in properties:
            tracking_key = generate_tracking_key()
            property_obj.tracking_key = tracking_key
            print(f"Added tracking key '{tracking_key}' to property '{property_obj.property_name}'")
        
        session.commit()
        print(f"Successfully added tracking keys to {len(properties)} properties")

if __name__ == "__main__":
    add_tracking_keys()
