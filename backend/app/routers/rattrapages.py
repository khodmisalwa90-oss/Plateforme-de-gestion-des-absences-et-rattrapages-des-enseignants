from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from typing import Optional, List
from datetime import date
from app.core.database import get_db
from app.core.dependencies import get_current_active_user
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur, StatutRattrapage
from app.models.rattrapage import Rattrapage
from app.models.absence import Absence
from app.schemas.rattrapage import RattrapageCreate, RattrapageResponse
from app.schemas.common import PaginatedResponse
from app.services.rattrapage_service import RattrapageService

router = APIRouter()

@router.get("/", response_model=PaginatedResponse[RattrapageResponse])
def get_rattrapages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    statut: Optional[StatutRattrapage] = None,
    absence_id: Optional[int] = None,
    date_from: Optional[date] = None,
    date_to: Optional[date] = None,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    enseignant_id = None
    if current_user.role == RoleUtilisateur.ENSEIGNANT:
        enseignant_id = current_user.id
        
    items, total = RattrapageService.list_all(
        db, page, per_page, statut, absence_id, enseignant_id, date_from, date_to
    )
    total_pages = (total + per_page - 1) // per_page
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/a-venir", response_model=PaginatedResponse[RattrapageResponse])
def get_upcoming_rattrapages(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    items, total = RattrapageService.get_upcoming(db, page, per_page, current_user.id, current_user.role)
    total_pages = (total + per_page - 1) // per_page
    return {
        "items": items,
        "total": total,
        "page": page,
        "per_page": per_page,
        "total_pages": total_pages
    }

@router.get("/{id}", response_model=RattrapageResponse)
def get_rattrapage(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    rattrapage = db.query(Rattrapage).options(
        joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
        joinedload(Rattrapage.absence).joinedload(Absence.matiere),
        joinedload(Rattrapage.salle)
    ).filter(Rattrapage.id == id).first()
    
    if not rattrapage:
        raise HTTPException(status_code=404, detail="Rattrapage non trouvé")
    
    if current_user.role == RoleUtilisateur.ENSEIGNANT and rattrapage.absence.enseignant_id != current_user.id:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
        
    return rattrapage

@router.post("/", response_model=RattrapageResponse, status_code=status.HTTP_201_CREATED)
def create_rattrapage(
    data: RattrapageCreate,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role != RoleUtilisateur.ENSEIGNANT:
        raise HTTPException(status_code=403, detail="Seuls les enseignants peuvent proposer un rattrapage")
        
    return RattrapageService.create(db, data, current_user.id)

@router.put("/{id}/valider", response_model=RattrapageResponse)
def validate_rattrapage(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
        
    return RattrapageService.validate(db, id, current_user.id)

@router.put("/{id}/annuler", response_model=RattrapageResponse)
def cancel_rattrapage(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    return RattrapageService.annuler(db, id, current_user.id, current_user.role)

@router.put("/{id}/affecter-salle", response_model=RattrapageResponse)
def change_room(
    id: int,
    data: dict, 
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    if current_user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
        raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
    
    salle_id = data.get("salle_id")
    if not salle_id:
        raise HTTPException(status_code=400, detail="salle_id est requis")
        
    return RattrapageService.affecter_salle(db, id, salle_id)

@router.delete("/{id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_rattrapage(
    id: int,
    db: Session = Depends(get_db),
    current_user: Utilisateur = Depends(get_current_active_user)
):
    RattrapageService.delete(db, id, current_user.id, current_user.role)
    return None
