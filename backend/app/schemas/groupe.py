from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.schemas.departement import DepartementSimple
from app.schemas.utilisateur import UtilisateurSimple

class GroupeBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom du groupe")
    departement_id: int = Field(..., description="Identifiant du département")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Le nom du groupe ne peut pas être vide')
        if len(v) > 100:
            raise ValueError('Le nom du groupe ne peut pas dépasser 100 caractères')
        return v

class GroupeCreate(GroupeBase):
    pass

class GroupeUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom du groupe")
    departement_id: Optional[int] = Field(None, description="Identifiant du département")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Le nom du groupe ne peut pas être vide')
            if len(v) > 100:
                raise ValueError('Le nom du groupe ne peut pas dépasser 100 caractères')
        return v

class GroupeSimple(GroupeBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class GroupeResponse(GroupeBase):
    id: int
    departement: Optional[DepartementSimple] = None
    etudiants: Optional[List[UtilisateurSimple]] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
