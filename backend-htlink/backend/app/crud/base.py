from typing import TypeVar, Generic, Type, Optional, List, Dict, Any, Union
from pydantic import BaseModel
from sqlmodel import SQLModel, Session, select, func
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException

ModelType = TypeVar("ModelType", bound=SQLModel)
CreateSchemaType = TypeVar("CreateSchemaType", bound=BaseModel)
UpdateSchemaType = TypeVar("UpdateSchemaType", bound=BaseModel)


class CRUDBase(Generic[ModelType, CreateSchemaType, UpdateSchemaType]):
    def __init__(self, model: Type[ModelType]):
        """
        CRUD object with default methods to Create, Read, Update, Delete (CRUD).
        
        **Parameters**
        
        * `model`: A SQLModel model class
        * `schema`: A Pydantic model (schema) class
        """
        self.model = model

    def get(self, db: Session, id: Any) -> Optional[ModelType]:
        """Get a record by id"""
        return db.exec(select(self.model).where(self.model.id == id)).first()

    def get_multi(
        self, 
        db: Session, 
        *, 
        skip: int = 0, 
        limit: int = 100,
        tenant_id: Optional[int] = None
    ) -> List[ModelType]:
        """Get multiple records with optional tenant filtering"""
        query = select(self.model)
        
        # Add tenant filtering if the model has tenant_id field
        if tenant_id is not None and hasattr(self.model, 'tenant_id'):
            query = query.where(self.model.tenant_id == tenant_id)
        
        query = query.offset(skip).limit(limit)
        return db.exec(query).all()

    def get_count(self, db: Session, tenant_id: Optional[int] = None) -> int:
        """Get total count of records with optional tenant filtering"""
        query = select(func.count()).select_from(self.model)
        
        # Add tenant filtering if the model has tenant_id field
        if tenant_id is not None and hasattr(self.model, 'tenant_id'):
            query = query.where(self.model.tenant_id == tenant_id)
            
        return db.exec(query).first()

    def create(self, db: Session, *, obj_in: CreateSchemaType) -> ModelType:
        """Create a new record"""
        obj_in_data = obj_in.dict()
        db_obj = self.model(**obj_in_data)
        db.add(db_obj)
        try:
            db.commit()
            db.refresh(db_obj)
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Database integrity error: {str(e)}"
            )

    def update(
        self,
        db: Session,
        *,
        db_obj: ModelType,
        obj_in: Union[UpdateSchemaType, Dict[str, Any]]
    ) -> ModelType:
        """Update an existing record"""
        obj_data = db_obj.dict()
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)
        
        print(f"CRUD UPDATE - Before update: {obj_data}")
        print(f"CRUD UPDATE - Update data: {update_data}")
        
        for field in obj_data:
            if field in update_data:
                setattr(db_obj, field, update_data[field])
        
        db.add(db_obj)
        try:
            db.commit()
            db.refresh(db_obj)
            
            print(f"CRUD UPDATE - After refresh: {db_obj.dict()}")
            
            return db_obj
        except IntegrityError as e:
            db.rollback()
            raise HTTPException(
                status_code=400,
                detail=f"Database integrity error: {str(e)}"
            )

    def remove(self, db: Session, *, id: int) -> ModelType:
        """Delete a record by id"""
        obj = db.exec(select(self.model).where(self.model.id == id)).first()
        if not obj:
            raise HTTPException(status_code=404, detail="Item not found")
        
        db.delete(obj)
        db.commit()
        return obj

    def get_by_field(self, db: Session, field_name: str, value: Any, tenant_id: Optional[int] = None) -> Optional[ModelType]:
        """Get a record by a specific field value"""
        query = select(self.model).where(getattr(self.model, field_name) == value)
        
        # Add tenant filtering if the model has tenant_id field
        if tenant_id is not None and hasattr(self.model, 'tenant_id'):
            query = query.where(self.model.tenant_id == tenant_id)
            
        return db.exec(query).first()

    def get_multi_by_field(
        self, 
        db: Session, 
        field_name: str, 
        value: Any, 
        tenant_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[ModelType]:
        """Get multiple records by a specific field value"""
        query = select(self.model).where(getattr(self.model, field_name) == value)
        
        # Add tenant filtering if the model has tenant_id field
        if tenant_id is not None and hasattr(self.model, 'tenant_id'):
            query = query.where(self.model.tenant_id == tenant_id)
        
        query = query.offset(skip).limit(limit)
        return db.exec(query).all()
