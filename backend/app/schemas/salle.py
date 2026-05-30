from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator

class SalleBase(BaseModel):
    nom: str = Field(..., max_length=50, description="Nom de la salle")
    capacite: int = Field(..., gt=0, description="Capacité (nombre de places)")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Le nom de la salle ne peut pas être vide')
        if len(v) > 50:
            raise ValueError('Le nom de la salle ne peut pas dépasser 50 caractères')
        return v
    
    @field_validator('capacite')
    @classmethod
    def validate_capacite(cls, v):
        if v <= 0:
            raise ValueError('La capacité doit être supérieure à 0')
        return v

class SalleCreate(SalleBase):
    pass

class SalleUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=50, description="Nom de la salle")
    capacite: Optional[int] = Field(None, gt=0, description="Capacité (nombre de places)")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Le nom de la salle ne peut pas être vide')
            if len(v) > 50:
                raise ValueError('Le nom de la salle ne peut pas dépasser 50 caractères')
        return v
    
    @field_validator('capacite')
    @classmethod
    def validate_capacite(cls, v):
        if v is not None and v <= 0:
            raise ValueError('La capacité doit être supérieure à 0')
        return v

class SalleSimple(SalleBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class SalleResponse(SalleBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
