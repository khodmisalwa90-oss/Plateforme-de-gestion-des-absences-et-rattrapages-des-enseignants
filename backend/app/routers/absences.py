from fastapi import APIRouter, Depends, HTTPException, Query, status, File, UploadFile, Form
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur, StatutAbsence
from app.schemas.absence import AbsenceCreate, AbsenceUpdate, AbsenceResponse
from app.schemas.common import PaginatedResponse
from app.services.absence_service import AbsenceService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[AbsenceResponse])
def get_absences(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    statut: Optional[StatutAbsence] = None,
    date_absence: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    items, total = AbsenceService.list_absences(db, current_user.role, current_user.id, page, per_page, statut, date_absence)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/en-attente", response_model=PaginatedResponse[AbsenceResponse])
def get_pending_absences(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    items, total = AbsenceService.list_absences(db, current_user.role, current_user.id, page, per_page, statut=StatutAbsence.EN_ATTENTE)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/historique", response_model=PaginatedResponse[AbsenceResponse])
def get_my_history(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux enseignants")
    
    items, total = AbsenceService.list_absences(db, current_user.role, current_user.id, page, per_page)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{id}", response_model=AbsenceResponse)
def get_absence(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    return AbsenceService.get_by_id(db, id, current_user.id, current_user.role)

@router.post("/", response_model=AbsenceResponse, status_code=status.HTTP_201_CREATED)
async def declare_absence(
    matiere_id: int = Form(...),
    date_absence: date = Form(...),
    motif: str = Form(...),
    justificatif: UploadFile = File(None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seuls les enseignants peuvent déclarer une absence")
        
    return AbsenceService.declare_absence(db, current_user.id, matiere_id, date_absence, motif, justificatif)

@router.put("/{id}", response_model=AbsenceResponse)
def update_absence(
    id: int,
    matiere_id: Optional[str] = Form(None),
    date_absence: Optional[str] = Form(None),
    motif: Optional[str] = Form(None),
    justificatif: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    # Filter only provided fields and handle empty strings from multipart/form-data
    update_data = {}
    if matiere_id is not None and matiere_id.strip() != "":
        try:
            update_data["matiere_id"] = int(matiere_id)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="matiere_id must be an integer")
            
    if date_absence is not None and date_absence.strip() != "":
        try:
            from datetime import date
            update_data["date_absence"] = date.fromisoformat(date_absence)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="date_absence must be a valid date (YYYY-MM-DD)")
            
    if motif is not None and motif.strip() != "":
        update_data["motif"] = motif
    
    data = AbsenceUpdate(**update_data)
        
    return AbsenceService.update_absence(db, id, current_user.id, data, justificatif)

@router.put("/{id}/valider", response_model=AbsenceResponse)
def validate_absence(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    return AbsenceService.set_statut(db, id, StatutAbsence.VALIDE)

@router.put("/{id}/rejeter", response_model=AbsenceResponse)
def reject_absence(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    return AbsenceService.set_statut(db, id, StatutAbsence.REJETE)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_absence(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    AbsenceService.delete_absence(db, id, current_user.id)
    return None
