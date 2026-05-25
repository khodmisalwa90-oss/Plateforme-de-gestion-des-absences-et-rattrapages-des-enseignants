from sqlalchemy.orm import Session
from typing import List, Optional
from app.models.departement import Departement
from app.models.groupe import Groupe
from app.models.matiere import Matiere
from app.schemas.departement import DepartementCreate, DepartementUpdate

class DepartementService:
    @staticmethod
    def get_paginated(db: Session, page: int, per_page: int, search: Optional[str] = None):
        query = db.query(Departement)
        if search:
            query = query.filter(Departement.nom.ilike(f"%{search}%"))
        
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, departement_id: int) -> Optional[Departement]:
        return db.query(Departement).filter(Departement.id == departement_id).first()

    @staticmethod
    def create(db: Session, data: DepartementCreate) -> Departement:
        db_obj = Departement(nom=data.nom)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, departement_id: int, data: DepartementUpdate) -> Optional[Departement]:
        db_obj = db.query(Departement).filter(Departement.id == departement_id).first()
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, departement_id: int) -> bool:
        db_obj = db.query(Departement).filter(Departement.id == departement_id).first()
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def has_references(db: Session, departement_id: int) -> bool:
        groupes_count = db.query(Groupe).filter(Groupe.departement_id == departement_id).count()
        matieres_count = db.query(Matiere).filter(Matiere.departement_id == departement_id).count()
        return (groupes_count > 0 or matieres_count > 0)
