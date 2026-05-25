from typing import Optional
from datetime import date, time, datetime
from pydantic import BaseModel, ConfigDict
from app.schemas.enums import StatutRattrapage
from app.schemas.absence import AbsenceSimple
from app.schemas.salle import SalleSimple
from app.schemas.utilisateur import UtilisateurSimple

class RattrapageBase(BaseModel):
    absence_id: int
    salle_id: int
    date_proposee: date
    heure_debut: time
    heure_fin: time

class RattrapageCreate(RattrapageBase):
    pass

class RattrapageUpdate(BaseModel):
    absence_id: Optional[int] = None
    salle_id: Optional[int] = None
    date_proposee: Optional[date] = None
    heure_debut: Optional[time] = None
    heure_fin: Optional[time] = None
    statut: Optional[StatutRattrapage] = None
    valide_par: Optional[int] = None

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
