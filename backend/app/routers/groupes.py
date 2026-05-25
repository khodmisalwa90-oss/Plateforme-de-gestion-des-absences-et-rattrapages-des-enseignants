from fastapi import APIRouter, Depends, HTTPException, status, Query, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.models.groupe import Groupe
from app.schemas.groupe import GroupeCreate, GroupeUpdate, GroupeResponse
from app.schemas.utilisateur import UtilisateurResponse
from app.schemas.common import PaginatedResponse
from app.services.groupe_service import GroupeService

router = APIRouter()

def check_enseignant_owns_group(db: Session, teacher_id: int, groupe_id: int) -> bool:
    from app.models.emploi_du_temps import EmploiDuTemps
    from app.models.matiere import Matiere
    return db.query(EmploiDuTemps).join(Matiere).filter(
        EmploiDuTemps.groupe_id == groupe_id,
        Matiere.enseignant_id == teacher_id
    ).count() > 0

@router.get("/", response_model=PaginatedResponse[GroupeResponse])
def get_groupes(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
    
    if current_user.role == RoleUtilisateur.ENSEIGNANT:
        from app.models.emploi_du_temps import EmploiDuTemps
        from app.models.matiere import Matiere
        query = db.query(Groupe).join(EmploiDuTemps).join(Matiere).filter(Matiere.enseignant_id == current_user.id)
        if search:
            query = query.filter(Groupe.nom.ilike(f"%{search}%"))
        
        total = query.distinct().count()
        offset = (page - 1) * per_page
        items = query.distinct().offset(offset).limit(per_page).all()
    else:
        items, total = GroupeService.get_paginated(db, page, per_page, search)
        
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{groupe_id}", response_model=GroupeResponse)
def get_groupe(
    groupe_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
    
    if current_user.role == RoleUtilisateur.ENSEIGNANT:
        if not check_enseignant_owns_group(db, current_user.id, groupe_id):
            raise HTTPException(status_code=403, detail="Vous n'êtes pas enseignant de ce groupe")
            
    groupe = GroupeService.get_by_id(db, groupe_id)
    if not groupe:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    return groupe

@router.post("/", response_model=GroupeResponse, status_code=status.HTTP_201_CREATED)
def create_groupe(
    data: GroupeCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=403, detail="Seuls l'admin système et l'administration peuvent créer des groupes")
    
    if not GroupeService.check_department_exists(db, data.departement_id):
        raise HTTPException(status_code=400, detail="Département inexistant")
        
    return GroupeService.create(db, data)

@router.put("/{groupe_id}", response_model=GroupeResponse)
def update_groupe(
    groupe_id: int,
    data: GroupeUpdate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=403, detail="Seuls l'admin système et l'administration peuvent modifier des groupes")
    
    groupe = GroupeService.get_by_id(db, groupe_id)
    if not groupe:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
        
    if data.departement_id is not None:
        if not GroupeService.check_department_exists(db, data.departement_id):
            raise HTTPException(status_code=400, detail="Département inexistant")
        
    updated_groupe = GroupeService.update(db, groupe_id, data)
    return updated_groupe

@router.delete("/{groupe_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_groupe(
    groupe_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ADMIN_SYSTEME:
        raise HTTPException(status_code=403, detail="Seul l'admin système peut supprimer des groupes")
    
    if GroupeService.has_references(db, groupe_id):
        raise HTTPException(status_code=400, detail="Impossible de supprimer ce groupe : il est déjà utilisé dans l'emploi du temps")
        
    if not GroupeService.delete(db, groupe_id):
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
    return None

@router.get("/departement/{departement_id}", response_model=PaginatedResponse[GroupeResponse])
def get_groupes_by_departement(
    departement_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
        
    if not GroupeService.check_department_exists(db, departement_id):
        raise HTTPException(status_code=404, detail="Département non trouvé")
        
    items, total = GroupeService.get_paginated(db, page, per_page, departement_id=departement_id)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.post("/{groupe_id}/etudiants")
def add_students_to_group(
    groupe_id: int,
    etudiants_ids: List[int] = Body(..., embed=True),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ADMINISTRATION:
        raise HTTPException(status_code=403, detail="Action réservée à l'administration")
        
    groupe = GroupeService.get_by_id(db, groupe_id)
    if not groupe:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
        
    added, errors, already_in_group = GroupeService.add_students(db, groupe_id, etudiants_ids)
    
    if already_in_group:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail={
                "message": "Certains étudiants appartiennent déjà à un autre groupe et doivent en être retirés manuellement.",
                "students": already_in_group
            }
        )
        
    if added == 0 and errors:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=", ".join(errors))
        
    return {"message": f"{added} étudiants traités avec succès", "errors": errors}

@router.delete("/{groupe_id}/etudiants/{etudiant_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_student_from_group(
    groupe_id: int,
    etudiant_id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ADMINISTRATION:
        raise HTTPException(status_code=403, detail="Action réservée à l'administration")
        
    groupe = GroupeService.get_by_id(db, groupe_id)
    if not groupe:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
        
    if not GroupeService.is_student_in_group(db, groupe_id, etudiant_id):
        raise HTTPException(status_code=404, detail="L'étudiant n'appartient pas à ce groupe")
        
    if not GroupeService.remove_student(db, groupe_id, etudiant_id):
        raise HTTPException(status_code=500, detail="Erreur lors de la suppression")
    return None

@router.get("/{groupe_id}/etudiants", response_model=PaginatedResponse[UtilisateurResponse])
def get_group_students(
    groupe_id: int,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ENSEIGNANT]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
        
    if current_user.role == RoleUtilisateur.ENSEIGNANT:
        if not check_enseignant_owns_group(db, current_user.id, groupe_id):
            raise HTTPException(status_code=403, detail="Vous n'êtes pas enseignant de ce groupe")
            
    groupe = GroupeService.get_by_id(db, groupe_id)
    if not groupe:
        raise HTTPException(status_code=404, detail="Groupe non trouvé")
        
    students, total = GroupeService.get_students_paginated(db, groupe_id, page, per_page)
    total_pages = (total + per_page - 1) // per_page
    
    return {
        "items": students,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }
