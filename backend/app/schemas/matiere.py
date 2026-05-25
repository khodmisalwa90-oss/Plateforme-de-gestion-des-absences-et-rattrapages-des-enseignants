from typing import Optional
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict
from app.schemas.departement import DepartementSimple
from app.schemas.utilisateur import UtilisateurSimple

class MatiereBase(BaseModel):
    nom: str = Field(..., max_length=100)
    departement_id: int
    enseignant_id: Optional[int] = None

class MatiereCreate(MatiereBase):
    pass

class MatiereUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    departement_id: Optional[int] = None
    enseignant_id: Optional[int] = None

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
