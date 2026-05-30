from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict, Field
from app.schemas.enums import StatutRattrapage
from app.schemas.absence import AbsenceSimple
from app.schemas.salle import SalleSimple
from app.schemas.utilisateur import UtilisateurSimple

class RattrapageBase(BaseModel):
    absence_id: int = Field(..., description="Identifiant de l'absence")
    salle_id: int = Field(..., description="Identifiant de la salle")
    date_proposee: date = Field(..., description="Date du rattrapage")
    heure_debut: time = Field(..., description="Heure de début")
    heure_fin: time = Field(..., description="Heure de fin")

class RattrapageCreate(RattrapageBase):
    pass

class RattrapageUpdate(BaseModel):
    absence_id: Optional[int] = Field(None, description="Identifiant de l'absence")
    salle_id: Optional[int] = Field(None, description="Identifiant de la salle")
    date_proposee: Optional[date] = Field(None, description="Date du rattrapage")
    heure_debut: Optional[time] = Field(None, description="Heure de début")
    heure_fin: Optional[time] = Field(None, description="Heure de fin")
    statut: Optional[StatutRattrapage] = Field(None, description="Statut du rattrapage")
    valide_par: Optional[int] = Field(None, description="Identifiant du validateur")

class RattrapageSimple(RattrapageBase):
    id: int
    statut: StatutRattrapage
    valide_par: Optional[int] = None
    model_config = ConfigDict(from_attributes=True)

class RattrapageResponse(RattrapageBase):
    id: int
    statut: StatutRattrapage
    valide_par: Optional[int] = None
    absence: Optional[AbsenceSimple] = None
    salle: Optional[SalleSimple] = None
    validateur: Optional[UtilisateurSimple] = None
    created_at: datetime
    updated_at: datetime
    model_config = ConfigDict(from_attributes=True)
