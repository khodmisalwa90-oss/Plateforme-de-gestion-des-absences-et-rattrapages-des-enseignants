from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional, Tuple
from app.models.matiere import Matiere
from app.models.departement import Departement
from app.models.utilisateur import Utilisateur
from app.models.enums import RoleUtilisateur
from app.schemas.matiere import MatiereCreate, MatiereUpdate

class MatiereService:
    @staticmethod
    def get_paginated(db: Session, page: int, per_page: int, search: Optional[str] = None) -> Tuple[List[Matiere], int]:
        query = db.query(Matiere)
        if search:
            query = query.filter(Matiere.nom.ilike(f"%{search}%"))
        
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, matiere_id: int) -> Optional[Matiere]:
        return db.query(Matiere).filter(Matiere.id == matiere_id).first()

    @staticmethod
    def get_by_enseignant_paginated(db: Session, enseignant_id: int, page: int, per_page: int) -> Tuple[List[Matiere], int]:
        query = db.query(Matiere).filter(Matiere.enseignant_id == enseignant_id)
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def create(db: Session, data: MatiereCreate) -> Matiere:
        db_obj = Matiere(
            nom=data.nom,
            departement_id=data.departement_id,
            enseignant_id=data.enseignant_id
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, matiere_id: int, data: MatiereUpdate) -> Optional[Matiere]:
        db_obj = db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, matiere_id: int) -> bool:
        db_obj = db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def department_exists(db: Session, dep_id: int) -> bool:
        return db.query(Departement).filter(Departement.id == dep_id).count() > 0

    @staticmethod
    def teacher_exists(db: Session, teacher_id: int) -> bool:
        if teacher_id is None:
            return True
        user = db.query(Utilisateur).filter(Utilisateur.id == teacher_id).first()
        return user is not None and user.role == RoleUtilisateur.ENSEIGNANT
