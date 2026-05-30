from typing import Optional
from datetime import date, datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.models.enums import StatutAbsence
from app.schemas.matiere import MatiereSimple
from app.schemas.utilisateur import UtilisateurSimple

class AbsenceBase(BaseModel):
    matiere_id: int = Field(..., description="Identifiant de la matière")
    date_absence: date = Field(..., description="Date de l'absence")
    motif: str = Field(..., min_length=1, description="Motif de l'absence")
    
    @field_validator('motif')
    @classmethod
    def validate_motif(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Le motif de l\'absence ne peut pas être vide')
        return v

class AbsenceCreate(AbsenceBase):
    pass

class AbsenceUpdate(BaseModel):
    matiere_id: Optional[int] = None
    date_absence: Optional[date] = None
    motif: Optional[str] = None

class AbsenceSimple(AbsenceBase):
    id: int
    enseignant_id: int
    enseignant: Optional[UtilisateurSimple] = None
    matiere: Optional[MatiereSimple] = None
    justificatif: Optional[str] = None
    statut: StatutAbsence
    model_config = ConfigDict(from_attributes=True)

class AbsenceResponse(AbsenceBase):
    id: int
    enseignant_id: int
    enseignant: Optional[UtilisateurSimple] = None
    matiere: Optional[MatiereSimple] = None
    justificatif: Optional[str] = None
    statut: StatutAbsence
    created_at: datetime
    updated_at: datetime
    
    model_config = ConfigDict(from_attributes=True)
