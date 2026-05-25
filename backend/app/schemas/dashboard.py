from typing import List, Dict, Any, Optional
from pydantic import BaseModel

class MonthlyStat(BaseModel):
    month: str
    count: int

class AdminStatsResponse(BaseModel):
    users: Dict[str, int]
    absences: Dict[str, Any]
    rattrapages: Dict[str, Any]
    salles_et_cours: Dict[str, int]

class TeacherStatsResponse(BaseModel):
    absences: Dict[str, Any]
    rattrapages: Dict[str, Any]
    cours: Dict[str, Any]

class StudentStatsResponse(BaseModel):
    cours: Dict[str, Any]
    absences_enseignants: Dict[str, Any]
    rattrapages: Dict[str, Any]
    list_rattrapages_a_venir: List[Dict[str, Any]]
