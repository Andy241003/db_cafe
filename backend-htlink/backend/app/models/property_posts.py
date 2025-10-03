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
    post_id: int = Field(foreign_key="property_posts.id")
    locale: str = Field(max_length=10)
    content: Optional[str] = Field(default=None)


class PropertyPostTranslation(PropertyPostTranslationBase, table=True):
    __tablename__ = "property_post_translations"
    
    created_at: Optional[datetime] = Field(default_factory=datetime.utcnow)
    updated_at: Optional[datetime] = Field(default=None)
    
    # Composite primary key
    post_id: int = Field(foreign_key="property_posts.id", primary_key=True)
    locale: str = Field(max_length=10, primary_key=True)
    
    # Relationships
    post: Optional[PropertyPost] = Relationship(back_populates="translations")


# Create/Update schemas
class PropertyPostCreate(PropertyPostBase):
    translations: List[PropertyPostTranslationBase] = []


class PropertyPostUpdate(SQLModel):
    property_id: Optional[int] = None
    status: Optional[str] = None
    translations: Optional[List[PropertyPostTranslationBase]] = None


class PropertyPostRead(PropertyPostBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    translations: List[PropertyPostTranslationBase] = []


class PropertyPostTranslationCreate(PropertyPostTranslationBase):
    pass


class PropertyPostTranslationUpdate(SQLModel):
    title: Optional[str] = None
    slug: Optional[str] = None
    short_description: Optional[str] = None
    content: Optional[str] = None
    thumbnail_url: Optional[str] = None


class PropertyPostTranslationRead(PropertyPostTranslationBase):
    created_at: Optional[datetime]
    updated_at: Optional[datetime]