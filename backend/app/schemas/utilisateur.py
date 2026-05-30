from typing import Optional
from datetime import datetime
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator
from app.schemas.enums import RoleUtilisateur

class UtilisateurBase(BaseModel):
    nom: str = Field(..., max_length=100, description="Nom de famille")
    prenom: str = Field(..., max_length=100, description="Prénom")
    email: EmailStr = Field(..., max_length=150, description="Adresse email")
    role: RoleUtilisateur = Field(..., description="Rôle de l'utilisateur")
    actif: bool = Field(True, description="Compte actif")

class UtilisateurCreate(UtilisateurBase):
    mot_de_passe: str = Field(..., min_length=6, max_length=255, description="Mot de passe (minimum 6 caractères)")
    
    @field_validator('nom', 'prenom')
    @classmethod
    def validate_names(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Ce champ ne peut pas être vide')
        if len(v) > 100:
            raise ValueError('Ce champ ne peut pas dépasser 100 caractères')
        return v
    
    @field_validator('mot_de_passe')
    @classmethod
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Le mot de passe doit avoir au moins 6 caractères')
        if len(v) > 255:
            raise ValueError('Le mot de passe ne peut pas dépasser 255 caractères')
        return v

class UtilisateurUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom de famille")
    prenom: Optional[str] = Field(None, max_length=100, description="Prénom")
    email: Optional[EmailStr] = Field(None, max_length=150, description="Adresse email")
    mot_de_passe: Optional[str] = Field(None, min_length=6, max_length=255, description="Mot de passe (minimum 6 caractères)")
    role: Optional[RoleUtilisateur] = Field(None, description="Rôle de l'utilisateur")
    actif: Optional[bool] = Field(None, description="Compte actif")
    
    @field_validator('nom', 'prenom')
    @classmethod
    def validate_names(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Ce champ ne peut pas être vide')
            if len(v) > 100:
                raise ValueError('Ce champ ne peut pas dépasser 100 caractères')
        return v
    
    @field_validator('mot_de_passe')
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 6:
                raise ValueError('Le mot de passe doit avoir au moins 6 caractères')
            if len(v) > 255:
                raise ValueError('Le mot de passe ne peut pas dépasser 255 caractères')
        return v

class ProfileUpdate(BaseModel):
    nom: Optional[str] = Field(None, max_length=100, description="Nom de famille")
    prenom: Optional[str] = Field(None, max_length=100, description="Prénom")
    email: Optional[EmailStr] = Field(None, max_length=150, description="Adresse email")
    mot_de_passe: Optional[str] = Field(None, min_length=6, max_length=255, description="Mot de passe (minimum 6 caractères)")
    
    @field_validator('nom', 'prenom')
    @classmethod
    def validate_names(cls, v):
        if v is not None:
            if len(v.strip()) == 0:
                raise ValueError('Ce champ ne peut pas être vide')
            if len(v) > 100:
                raise ValueError('Ce champ ne peut pas dépasser 100 caractères')
        return v
    
    @field_validator('mot_de_passe')
    @classmethod
    def validate_password(cls, v):
        if v is not None:
            if len(v) < 6:
                raise ValueError('Le mot de passe doit avoir au moins 6 caractères')
            if len(v) > 255:
                raise ValueError('Le mot de passe ne peut pas dépasser 255 caractères')
        return v

class UtilisateurSimple(UtilisateurBase):
    id: int
    model_config = ConfigDict(from_attributes=True)

class UtilisateurResponse(UtilisateurBase):
    id: int
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
