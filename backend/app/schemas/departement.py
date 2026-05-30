from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

class DepartementBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom du département")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Le nom du département ne peut pas être vide')
        if len(v) > 100:
            raise ValueError('Le nom du département ne peut pas dépasser 100 caractères')
        return v

class DepartementCreate(DepartementBase):
    pass

class DepartementUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom du département")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Le nom du département ne peut pas être vide')
            if len(v) > 100:
                raise ValueError('Le nom du département ne peut pas dépasser 100 caractères')
        return v

class DepartementSimple(DepartementBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class DepartementResponse(DepartementBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
