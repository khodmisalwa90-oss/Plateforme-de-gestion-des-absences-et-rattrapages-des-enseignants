from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.schemas.matiere import MatiereCreate, MatiereUpdate, MatiereResponse
from app.schemas.common import PaginatedResponse
from app.services.matiere_service import MatiereService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[MatiereResponse])
def get_matieres(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    items, total = MatiereService.get_paginated(db, page, per_page, search)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{matiere_id}", response_model=MatiereResponse)
def get_matiere(
    matiere_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    matiere = MatiereService.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matière non trouvée")
        
    if current_user.role == RoleUtilisateur.ENSEIGNANT and matiere.enseignant_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Accès refusé à cette matière")
        
    return matiere

@router.post("/", response_model=MatiereResponse, status_code=status.HTTP_201_CREATED)
def create_matiere(
    data: MatiereCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    if not MatiereService.department_exists(db, data.departement_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inexistant")

    if data.enseignant_id and not MatiereService.teacher_exists(db, data.enseignant_id) or data.enseignant_id == 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enseignant invalide ou inexistant")
        
    return MatiereService.create(db, data)

@router.put("/{matiere_id}", response_model=MatiereResponse)
def update_matiere(
    matiere_id: int,
    data: MatiereUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    matiere = MatiereService.get_by_id(db, matiere_id)
    if not matiere:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matière non trouvée")
    
    if data.departement_id is not None and not MatiereService.department_exists(db, data.departement_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Département inexistant")
        
    if data.enseignant_id is not None and not MatiereService.teacher_exists(db, data.enseignant_id):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enseignant invalide ou inexistant")
        
    return MatiereService.update(db, matiere_id, data)

@router.delete("/{matiere_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_matiere(
    matiere_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ADMIN_SYSTEME:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    success = MatiereService.delete(db, matiere_id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Matière non trouvée")
    return None

@router.get("/enseignant/{enseignant_id}", response_model=PaginatedResponse[MatiereResponse])
def get_matieres_by_enseignant(
    enseignant_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    if not MatiereService.teacher_exists(db, enseignant_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Enseignant non trouvé")
        
    items, total = MatiereService.get_by_enseignant_paginated(db, enseignant_id, page, per_page)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
