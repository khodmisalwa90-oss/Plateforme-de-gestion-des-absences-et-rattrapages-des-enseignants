from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class MonthlyStat(BaseModel):
    month: str = Field(..., description="Mois")
    count: int = Field(..., description="Nombre")


class AdminStatsResponse(BaseModel):
    users: Dict[str, int] = Field(..., description="Statistiques des utilisateurs")
    absences: Dict[str, Any] = Field(..., description="Statistiques des absences")
    rattrapages: Dict[str, Any] = Field(..., description="Statistiques des rattrapages")
    salles_et_cours: Dict[str, int] = Field(..., description="Statistiques des salles et cours")

class TeacherStatsResponse(BaseModel):
    absences: Dict[str, Any] = Field(..., description="Statistiques des absences")
    rattrapages: Dict[str, Any] = Field(..., description="Statistiques des rattrapages")
    cours: Dict[str, Any] = Field(..., description="Statistiques des cours")

class StudentStatsResponse(BaseModel):
    cours: Dict[str, Any] = Field(..., description="Statistiques des cours")
    absences_enseignants: Dict[str, Any] = Field(..., description="Absences des enseignants")
    rattrapages: Dict[str, Any] = Field(..., description="Statistiques des rattrapages")
    list_rattrapages_a_venir: List[Dict[str, Any]] = Field(..., description="Liste des rattrapages à venir")
