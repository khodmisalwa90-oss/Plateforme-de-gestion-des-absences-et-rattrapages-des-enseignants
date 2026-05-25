from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional, List
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.schemas.emploi_du_temps import EmploiDuTempsCreate, EmploiDuTempsUpdate, EmploiDuTempsResponse
from app.schemas.common import PaginatedResponse
from app.services.emploi_du_temps_service import EmploiDuTempsService, ConflictError
from app.models.groupe import Groupe
from app.models.matiere import Matiere
from app.models.salle import Salle

router = APIRouter()

@router.get("/groupe/{groupe_id}", response_model=PaginatedResponse[EmploiDuTempsResponse])
def get_by_groupe(
    groupe_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    jour_semaine: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux administrateurs")
    
    items, total = EmploiDuTempsService.get_by_groupe(db, groupe_id, page, per_page, jour_semaine)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/etudiant", response_model=PaginatedResponse[EmploiDuTempsResponse])
def get_for_logged_in_etudiant(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    jour_semaine: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ETUDIANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux étudiants")
    
    items, total = EmploiDuTempsService.get_by_etudiant(db, current_user.id, page, per_page, jour_semaine)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/enseignant", response_model=PaginatedResponse[EmploiDuTempsResponse])
def get_for_logged_in_enseignant(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    jour_semaine: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Réservé aux enseignants")
    
    items, total = EmploiDuTempsService.get_by_enseignant(db, current_user.id, page, per_page, jour_semaine)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/salle/{salle_id}", response_model=PaginatedResponse[EmploiDuTempsResponse])
def get_by_salle(
    salle_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    jour_semaine: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    items, total = EmploiDuTempsService.get_by_salle(db, salle_id, page, per_page, jour_semaine)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/matiere/{matiere_id}", response_model=PaginatedResponse[EmploiDuTempsResponse])
def get_by_matiere(
    matiere_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    jour_semaine: Optional[int] = Query(None, ge=0, le=6),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    if current_user.role == RoleUtilisateur.ENSEIGNANT:
        from app.models.matiere import Matiere
        matiere = db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not matiere or matiere.enseignant_id != current_user.id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Vous ne pouvez voir que les emplois du temps de vos propres matières")
    
    items, total = EmploiDuTempsService.get_by_matiere(db, matiere_id, page, per_page, jour_semaine)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/conflits-planning")
def get_planning_conflicts(
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
        
    return EmploiDuTempsService.get_planning_conflicts(db)

@router.post("/", response_model=EmploiDuTempsResponse, status_code=status.HTTP_201_CREATED)
def create_emploi_du_temps(
    data: EmploiDuTempsCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")

    # Step 0: Validate that all referenced entities exist
    if not db.query(Groupe).filter(Groupe.id == data.groupe_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Groupe ID {data.groupe_id} introuvable")
    if not db.query(Matiere).filter(Matiere.id == data.matiere_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Matière ID {data.matiere_id} introuvable")
    if not db.query(Salle).filter(Salle.id == data.salle_id).first():
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Salle ID {data.salle_id} introuvable")

    if data.heure_debut >= data.heure_fin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'heure de début doit être avant l'heure de fin")

    # Step 1: Run specific slot conflict check (group, room, teacher overlap for this exact slot)
    h_debut = data.heure_debut.replace(microsecond=0)
    h_fin = data.heure_fin.replace(microsecond=0)
    slot_conflicts = EmploiDuTempsService.check_conflicts(
        db, data.groupe_id, data.salle_id, data.matiere_id,
        data.jour_semaine, h_debut, h_fin
    )
    
    if slot_conflicts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Conflit de planning détecté. Le créneau ne peut pas être créé.",
                "conflicts": slot_conflicts
            }
        )

    # Step 2: Save the new slot
    db_item = EmploiDuTempsService.create(db, data)
    return db_item

@router.put("/{id}", response_model=EmploiDuTempsResponse)
def update_emploi_du_temps(
    id: int,
    data: EmploiDuTempsUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    if data.heure_debut and data.heure_fin and data.heure_debut >= data.heure_fin:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="L'heure de début doit être avant l'heure de fin")
        
    try:
        updated = EmploiDuTempsService.update(db, id, data)
        if not updated:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Cours non trouvé")
        return updated
    except ConflictError as e:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Conflit de planning détecté. Le créneau ne peut pas être modifié.", 
                "conflicts": [c["details"] for c in e.conflicts]
            }
        )

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_emploi_du_temps(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
    
    EmploiDuTempsService.delete(db, id)
    return None
