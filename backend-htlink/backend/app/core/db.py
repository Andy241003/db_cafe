from sqlmodel import Session, create_engine, select
from datetime import datetime

from app import crud
from app.core.config import settings
from app.models import AdminUser, AdminUserCreate

# Sync engine for MySQL with pymysql
engine = create_engine(str(settings.SQLALCHEMY_DATABASE_URI), echo=True)


def get_db() -> Session:
    """Get database session"""
    with Session(engine) as session:
        yield session


# make sure all SQLModel models are imported (app.models) before initializing DB
# otherwise, SQLModel might fail to initialize relationships properly
# for more details: https://github.com/fastapi/full-stack-fastapi-template/issues/28


def init_db(session: Session) -> None:
    # Tables should be created with Alembic migrations
    # But if you don't want to use migrations, create
    # the tables un-commenting the next lines
    # from sqlmodel import SQLModel

    # This works because the models are already imported and registered from app.models
    # SQLModel.metadata.create_all(engine)

    # Import the models we need for seeding
    from app.models import Plan, Tenant, Locale
    
    # 1. Create basic locales first
    locales_data = [
        {"code": "en", "name": "English", "native_name": "English"},
        {"code": "vi", "name": "Vietnamese", "native_name": "Tiếng Việt"},
        {"code": "ja", "name": "Japanese", "native_name": "日本語"},
        {"code": "ko", "name": "Korean", "native_name": "한국어"}
    ]
    
    for locale_data in locales_data:
        existing_locale = session.exec(
            select(Locale).where(Locale.code == locale_data["code"])
        ).first()
        if not existing_locale:
            locale = Locale(**locale_data)
            session.add(locale)
    
    session.commit()
    
    # 2. Create basic plan
    plan = session.exec(
        select(Plan).where(Plan.name == "Basic Plan")
    ).first()
    if not plan:
        plan = Plan(
            name="Basic Plan",
            code="basic",
            features_json={"core": True, "analytics": False}
        )
        session.add(plan)
        session.commit()
    
    # 3. Create demo tenant
    tenant = session.exec(
        select(Tenant).where(Tenant.code == "demo")
    ).first()
    if not tenant:
        tenant = Tenant(
            plan_id=plan.id,
            name="Demo Hotel Chain",
            code="demo",
            default_locale="en",
            fallback_locale="en",
            settings_json={"theme": "default"},
            is_active=True
        )
        session.add(tenant)
        session.commit()

    # 4. Create admin user
    user = session.exec(
        select(AdminUser).where(AdminUser.email == settings.FIRST_SUPERUSER)
    ).first()
    if not user:
        user_in = AdminUserCreate(
            tenant_id=tenant.id,
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="System Administrator",
            role="OWNER"
        )
        user = crud.create_admin_user(session=session, user_create=user_in)
