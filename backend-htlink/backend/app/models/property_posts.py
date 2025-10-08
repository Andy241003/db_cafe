from datetime import datetime
from typing import Optional, List, TYPE_CHECKING
from sqlmodel import SQLModel, Field, Relationship

if TYPE_CHECKING:
    from app.models import Property


class PropertyPostBase(SQLModel):
    property_id: int = Field(foreign_key="properties.id")
    status: str = Field(default="draft", max_length=50)


class PropertyPost(PropertyPostBase, table=True):
    __tablename__ = "property_posts"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Relationships
    property: Optional["Property"] = Relationship()
    translations: List["PropertyPostTranslation"] = Relationship(back_populates="post")


class PropertyPostTranslationBase(SQLModel):
    # Note: DB currently has a composite primary key (post_id, locale) and may
    # not include all optional columns (title, slug, etc.). Mark fields
    # optional so the ORM won't fail when columns are missing.
    post_id: int = Field(foreign_key="property_posts.id", primary_key=True)
    locale: str = Field(max_length=10, primary_key=True)
    # Current DB schema only contains `content` (longtext) besides PK and timestamps.
    content: Optional[str] = Field(default=None)


class PropertyPostTranslation(PropertyPostTranslationBase, table=True):
    __tablename__ = "property_post_translations"

    # Keep created/updated timestamps optional to reflect existing table
    created_at: Optional[datetime] = Field(default=None)
    updated_at: Optional[datetime] = Field(default=None)

    # Relationships
    post: Optional[PropertyPost] = Relationship(back_populates="translations")


# Create/Update schemas
class PropertyPostCreate(PropertyPostBase):
    # When creating a post, translations are provided without post_id
    # (post_id will be set by the server). Use a create-specific schema
    # that doesn't require the composite PK fields.
    translations: List["PropertyPostTranslationCreate"] = []


class PropertyPostUpdate(SQLModel):
    property_id: Optional[int] = None
    status: Optional[str] = None
    # Accept a list of create-style translations (client does not provide post_id)
    translations: Optional[List["PropertyPostTranslationCreate"]] = None


class PropertyPostRead(PropertyPostBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    translations: List["PropertyPostTranslationRead"] = []


class PropertyPostTranslationCreate(SQLModel):
    """Schema used when creating a translation from client input.

    Do NOT require `post_id` here — the server will associate the
    translation with the parent post. Only `locale` and `content` are
    required/accepted from the client.
    """
    locale: str = Field(max_length=10)
    content: Optional[str] = None


class PropertyPostTranslationUpdate(SQLModel):
    content: Optional[str] = None


class PropertyPostTranslationRead(PropertyPostTranslationBase):
    created_at: Optional[datetime]
    updated_at: Optional[datetime]