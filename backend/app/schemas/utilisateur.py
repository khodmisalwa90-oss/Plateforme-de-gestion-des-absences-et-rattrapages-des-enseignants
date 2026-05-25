from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict
from app.schemas.enums import RoleUtilisateur

class UtilisateurBase(BaseModel):
    nom: str = Field(..., max_length=100)
    prenom: str = Field(..., max_length=100)
    email: EmailStr = Field(..., max_length=150)
    role: RoleUtilisateur
    actif: bool = True

class UtilisateurCreate(UtilisateurBase):
    mot_de_passe: str = Field(..., min_length=6, max_length=255)

class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=150)
    mot_de_passe: Optional[str] = Field(None, min_length=6, max_length=255)
    role: Optional[RoleUtilisateur] = None
    actif: Optional[bool] = None

class ProfileUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100)
    prenom: Optional[str] = Field(None, max_length=100)
    email: Optional[EmailStr] = Field(None, max_length=150)
    mot_de_passe: Optional[str] = Field(None, min_length=6, max_length=255)

class UtilisateurSimple(UtilisateurBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UtilisateurResponse(UtilisateurBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
