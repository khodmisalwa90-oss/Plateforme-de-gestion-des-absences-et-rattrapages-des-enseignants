from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from datetime import date, time
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.schemas.salle import SalleCreate, SalleUpdate, SalleResponse
from app.schemas.common import PaginatedResponse
from app.services.salle_service import SalleService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[SalleResponse])
def get_salles(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT, RoleUtilisateur.ETUDIANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    items, total = SalleService.get_paginated(db, page, per_page, search)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/disponibles", response_model=PaginatedResponse[SalleResponse])
def get_available_rooms(
    date_cours: date = Query(..., alias="date", description="Date de la recherche (YYYY-MM-DD)"),
    heure_debut: time = Query(..., description="Heure de début (HH:MM)"),
    heure_fin: time = Query(..., description="Heure de fin (HH:MM)"),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT, RoleUtilisateur.ETUDIANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    if heure_debut >= heure_fin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'heure de début doit être avant l'heure de fin")
        
    items, total = SalleService.check_availability(db, date_cours, heure_debut, heure_fin, page, per_page)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{salle_id}", response_model=SalleResponse)
def get_salle(
    salle_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT, RoleUtilisateur.ETUDIANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    salle = SalleService.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salle non trouvée")
    return salle

@router.post("/", response_model=SalleResponse, status_code=status.HTTP_201_CREATED)
def create_salle(
    data: SalleCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    return SalleService.create(db, data)

@router.put("/{salle_id}", response_model=SalleResponse)
def update_salle(
    salle_id: int,
    data: SalleUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    salle = SalleService.get_by_id(db, salle_id)
    if not salle:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salle non trouvée")
        
    return SalleService.update(db, salle_id, data)

@router.delete("/{salle_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_salle(
    salle_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ADMIN_SYSTEME:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    if SalleService.has_future_bookings(db, salle_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Impossible de supprimer cette salle : elle a des réservations futures")
        
    if not SalleService.delete(db, salle_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Salle non trouvée")
    return None
