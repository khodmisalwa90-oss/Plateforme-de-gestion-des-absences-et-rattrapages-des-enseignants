from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.schemas.utilisateur import UtilisateurCreate, UtilisateurUpdate, UtilisateurResponse
from app.schemas.common import PaginatedResponse
from app.services.utilisateur_service import UtilisateurService
from app.models.enums import RoleUtilisateur

router = APIRouter()

def check_admin_permission(current_user: Utilisateur):
    if current_user.role != RoleUtilisateur.ADMIN_SYSTEME:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")

@router.get("/", response_model=PaginatedResponse[UtilisateurResponse])
def get_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    role: Optional[RoleUtilisateur] = Query(None),
    actif: Optional[bool] = None,
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role == RoleUtilisateur.ADMIN_SYSTEME:
        pass
    elif current_user.role == RoleUtilisateur.ADMINISTRATION:
        if role not in [RoleUtilisateur.ETUDIANT, RoleUtilisateur.ENSEIGNANT]:
            raise HTTPException(
                status_code=403, 
                detail="L'administration n'est autorisée qu'à lister les étudiants et les enseignants."
            )
    else:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")

    items, total = UtilisateurService.get_paginated(db, page=page, per_page=per_page, role=role, actif=actif, search=search)
    total_pages = (total + per_page - 1) // per_page
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{user_id}", response_model=UtilisateurResponse)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    user = UtilisateurService.get_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.post("/", response_model=UtilisateurResponse, status_code=status.HTTP_201_CREATED)
def create_user(
    user_data: UtilisateurCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    existing = UtilisateurService.get_by_email(db, user_data.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà enregistré")
    return UtilisateurService.create(db, user_data)

@router.put("/{user_id}", response_model=UtilisateurResponse)
def update_user(
    user_id: int,
    user_data: UtilisateurUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier votre propre compte")
    user = UtilisateurService.update(db, user_id, user_data)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier votre propre compte")
    success = UtilisateurService.delete(db, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return None

@router.put("/{user_id}/activer", response_model=UtilisateurResponse)
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier votre propre compte")
    user = UtilisateurService.activate(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user

@router.put("/{user_id}/desactiver", response_model=UtilisateurResponse)
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    check_admin_permission(current_user)
    if current_user.id == user_id:
        raise HTTPException(status_code=403, detail="Vous ne pouvez pas modifier votre propre compte")
    user = UtilisateurService.deactivate(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    return user
