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
    demo_tenant = session.exec(
        select(Tenant).where(Tenant.code == "demo")
    ).first()
    if not demo_tenant:
        demo_tenant = Tenant(
            plan_id=plan.id,
            name="Demo Hotel Chain",
            code="demo",
            default_locale="en",
            fallback_locale="en",
            settings_json={"theme": "default"},
            is_active=True
        )
        session.add(demo_tenant)
        session.commit()

    # 3b. Create production tenant
    prod_tenant = session.exec(
        select(Tenant).where(Tenant.code == "premier_admin")
    ).first()
    if not prod_tenant:
        prod_tenant = Tenant(
            plan_id=plan.id,
            name="Premier Hotel Admin",
            code="premier_admin",
            default_locale="en",
            fallback_locale="en",
            settings_json={"theme": "default"},
            is_active=True
        )
        session.add(prod_tenant)
        session.commit()

    # Use demo tenant as default for initial setup
    tenant = demo_tenant

    # 4. Create admin users for both tenants
    # Demo tenant admin
    demo_user = session.exec(
        select(AdminUser).where(
            AdminUser.email == settings.FIRST_SUPERUSER,
            AdminUser.tenant_id == demo_tenant.id
        )
    ).first()
    if not demo_user:
        user_in = AdminUserCreate(
            tenant_id=demo_tenant.id,
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="System Administrator",
            role="OWNER"
        )
        demo_user = crud.create_admin_user(session=session, user_create=user_in)

    # Production tenant admin
    prod_user = session.exec(
        select(AdminUser).where(
            AdminUser.email == settings.FIRST_SUPERUSER,
            AdminUser.tenant_id == prod_tenant.id
        )
    ).first()
    if not prod_user:
        user_in = AdminUserCreate(
            tenant_id=prod_tenant.id,
            email=settings.FIRST_SUPERUSER,
            password=settings.FIRST_SUPERUSER_PASSWORD,
            full_name="Premier Admin",
            role="OWNER"
        )
        prod_user = crud.create_admin_user(session=session, user_create=user_in)

    # Use demo user as default reference
    user = demo_user

    # 5. Create sample feature categories and features
    from app.models import FeatureCategory, Feature
    
    # Create feature categories
    categories_data = [
        {"slug": "services", "icon_key": "fa-concierge-bell", "is_system": True},
        {"slug": "dining", "icon_key": "fa-utensils", "is_system": True},
        {"slug": "facilities", "icon_key": "fa-swimming-pool", "is_system": True},
        {"slug": "accommodation", "icon_key": "fa-bed", "is_system": True}
    ]
    
    for cat_data in categories_data:
        existing_cat = session.exec(
            select(FeatureCategory).where(FeatureCategory.slug == cat_data["slug"])
        ).first()
        if not existing_cat:
            category = FeatureCategory(tenant_id=0, **cat_data)
            session.add(category)
    
    session.commit()
    
    # Get category IDs for features
    services_cat = session.exec(select(FeatureCategory).where(FeatureCategory.slug == "services")).first()
    dining_cat = session.exec(select(FeatureCategory).where(FeatureCategory.slug == "dining")).first()
    
    if services_cat and dining_cat:
        # Create sample features
        features_data = [
            {"slug": "check-in-process", "category_id": services_cat.id, "icon_key": "fa-sign-in-alt", "is_system": True},
            {"slug": "restaurant-dining", "category_id": dining_cat.id, "icon_key": "fa-utensils", "is_system": True},
            {"slug": "vip-butler-service", "category_id": services_cat.id, "icon_key": "fa-crown", "is_system": True}
        ]
        
        for feature_data in features_data:
            existing_feature = session.exec(
                select(Feature).where(Feature.slug == feature_data["slug"])
            ).first()
            if not existing_feature:
                feature = Feature(tenant_id=0, **feature_data)
                session.add(feature)
