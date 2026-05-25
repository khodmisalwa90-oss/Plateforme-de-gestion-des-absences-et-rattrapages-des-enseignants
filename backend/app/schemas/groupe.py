from typing import Optional, List
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.departement import DepartementSimple
from app.schemas.utilisateur import UtilisateurSimple

class GroupeBase(BaseModel):
    nom: str = Field(..., max_length=100)
    departement_id: int

class GroupeCreate(GroupeBase):
    pass

class GroupeUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    departement_id: Optional[int] = None

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
