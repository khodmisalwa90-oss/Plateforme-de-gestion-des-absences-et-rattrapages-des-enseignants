from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.schemas.dashboard import AdminStatsResponse, TeacherStatsResponse, StudentStatsResponse
from app.services.dashboard_service import DashboardService

router = APIRouter()

@router.get("/admin/stats", response_model=AdminStatsResponse)
def get_admin_stats(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ADMIN_SYSTEME]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé à l'administration")
    return DashboardService.get_admin_stats(db)

@router.get("/enseignant/stats", response_model=TeacherStatsResponse)
def get_teacher_stats(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux enseignants")
    return DashboardService.get_teacher_stats(db, current_user.id)

@router.get("/etudiant/stats", response_model=StudentStatsResponse)
def get_student_stats(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ETUDIANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès réservé aux étudiants")
    return DashboardService.get_student_stats(db, current_user.id)
