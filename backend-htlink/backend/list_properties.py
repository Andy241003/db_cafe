from sqlmodel import Session, select
from app.models import Property
from app.core.config import settings
from sqlmodel import create_engine

engine = create_engine(str(settings.DATABASE_URL))

with Session(engine) as session:
    props = session.exec(select(Property)).all()
    for p in props:
        print(f"ID: {p.id}, Name: {p.property_name}, Tracking Key: {p.tracking_key}")
