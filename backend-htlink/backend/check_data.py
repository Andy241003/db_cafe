from app.models.vr_hotel import VRHotelIntroduction, VRHotelContact, VRHotelSettings, VRHotelSEO
from sqlalchemy.orm import Session
from app.core.db import engine

with Session(engine) as db:
    intro = db.query(VRHotelIntroduction).filter(VRHotelIntroduction.property_id == 1).first()
    contact = db.query(VRHotelContact).filter(VRHotelContact.property_id == 1).first()
    settings = db.query(VRHotelSettings).filter(VRHotelSettings.property_id == 1).first()
    seo = db.query(VRHotelSEO).filter(VRHotelSEO.property_id == 1).count()
    
    print(f'✅ Introduction exists: {intro is not None}')
    print(f'✅ Contact exists: {contact is not None}')
    print(f'✅ Settings exists: {settings is not None}')
    print(f'✅ SEO records: {seo}')

