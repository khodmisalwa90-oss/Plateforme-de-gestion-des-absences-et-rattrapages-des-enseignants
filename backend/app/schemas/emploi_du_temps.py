from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, Field, ConfigDict, field_validator
from app.schemas.groupe import GroupeSimple
from app.schemas.matiere import MatiereResponse
from app.schemas.salle import SalleResponse

class EmploiDuTempsBase(BaseModel):
    groupe_id: int = Field(..., description="Identifiant du groupe")
    matiere_id: int = Field(..., description="Identifiant de la matière")
    salle_id: int = Field(..., description="Identifiant de la salle")
    jour_semaine: int = Field(..., ge=0, le=6, description="Jour de la semaine (0=Lundi, 1=Mardi, ..., 6=Dimanche)")
    heure_debut: time = Field(..., description="Heure de début")
    heure_fin: time = Field(..., description="Heure de fin")
    
    @field_validator('jour_semaine')
    @classmethod
    def validate_jour_semaine(cls, v):
        if v < 0 or v > 6:
            raise ValueError('Le jour de la semaine doit être entre 0 (lundi) et 6 (dimanche)')
        return v

class EmploiDuTempsCreate(EmploiDuTempsBase):
    pass

class EmploiDuTempsUpdate(BaseModel):
    groupe_id: Optional[int] = Field(None, description="Identifiant du groupe")
    matiere_id: Optional[int] = Field(None, description="Identifiant de la matière")
    salle_id: Optional[int] = Field(None, description="Identifiant de la salle")
    jour_semaine: Optional[int] = Field(None, ge=0, le=6, description="Jour de la semaine (0-6)")
    heure_debut: Optional[time] = Field(None, description="Heure de début")
    heure_fin: Optional[time] = Field(None, description="Heure de fin")
    
    @field_validator('jour_semaine')
    @classmethod
    def validate_jour_semaine(cls, v):
        if v is not None and (v < 0 or v > 6):
            raise ValueError('Le jour de la semaine doit être entre 0 (lundi) et 6 (dimanche)')
        return v


class EmploiDuTempsResponse(EmploiDuTempsBase):
    id: int
    rattrapage_id: Optional[int] = None
    created_at: datetime
    updated_at: datetime
    
    groupe: Optional[GroupeSimple] = None
    matiere: Optional[MatiereResponse] = None
    salle: Optional[SalleResponse] = None
    
    model_config = ConfigDict(from_attributes=True)

class EmploiDuTempsSimple(EmploiDuTempsBase):
    id: int
    rattrapage_id: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)
