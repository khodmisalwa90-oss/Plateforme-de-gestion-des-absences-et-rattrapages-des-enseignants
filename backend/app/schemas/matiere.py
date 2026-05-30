from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.schemas.departement import DepartementSimple
from app.schemas.utilisateur import UtilisateurSimple

class MatiereBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom de la matière")
    departement_id: int = Field(..., description="Identifiant du département")
    enseignant_id: Optional[int] = Field(None, description="Identifiant de l'enseignant")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Le nom de la matière ne peut pas être vide')
        if len(v) > 100:
            raise ValueError('Le nom de la matière ne peut pas dépasser 100 caractères')
        return v

class MatiereCreate(MatiereBase):
    pass

class MatiereUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom de la matière")
    departement_id: Optional[int] = Field(None, description="Identifiant du département")
    enseignant_id: Optional[int] = Field(None, description="Identifiant de l'enseignant")
    
    @field_validator('nom')
    @classmethod
    def validate_nom(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Le nom de la matière ne peut pas être vide')
            if len(v) > 100:
                raise ValueError('Le nom de la matière ne peut pas dépasser 100 caractères')
        return v

class MatiereSimple(MatiereBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class MatiereResponse(MatiereBase):
    id: int
    departement: Optional[DepartementSimple] = None
    enseignant: Optional[UtilisateurSimple] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
