from sqlalchemy.orm import Session
from sqlalchemy import select, func
from typing import List, Optional, Tuple
from app.models.groupe import Groupe
from app.models.utilisateur import Utilisateur
from app.models.etudiant_groupe import etudiants_groupes
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.departement import Departement
from app.models.enums import RoleUtilisateur
from app.schemas.groupe import GroupeCreate, GroupeUpdate
from app.services.notification_service import NotificationService

class GroupeService:
    @staticmethod
    def get_paginated(db: Session, page: int, per_page: int, search: Optional[str] = None, departement_id: Optional[int] = None) -> Tuple[List[Groupe], int]:
        query = db.query(Groupe)
        if search:
            query = query.filter(Groupe.nom.ilike(f"%{search}%"))
        if departement_id:
            query = query.filter(Groupe.departement_id == departement_id)
        
        total = query.count()
        offset = (page - 1) * per_page
        items = query.offset(offset).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_id(db: Session, groupe_id: int) -> Optional[Groupe]:
        return db.query(Groupe).filter(Groupe.id == groupe_id).first()

    @staticmethod
    def create(db: Session, data: GroupeCreate) -> Groupe:
        db_obj = Groupe(nom=data.nom, departement_id=data.departement_id)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def update(db: Session, groupe_id: int, data: GroupeUpdate) -> Optional[Groupe]:
        db_obj = db.query(Groupe).filter(Groupe.id == groupe_id).first()
        if not db_obj:
            return None
        
        update_data = data.model_dump(exclude_unset=True)
        for key, value in update_data.items():
            setattr(db_obj, key, value)
            
        db.commit()
        db.refresh(db_obj)
        return db_obj

    @staticmethod
    def delete(db: Session, groupe_id: int) -> bool:
        db_obj = db.query(Groupe).filter(Groupe.id == groupe_id).first()
        if not db_obj:
            return False
        
        db.delete(db_obj)
        db.commit()
        return True

    @staticmethod
    def has_references(db: Session, groupe_id: int) -> bool:
        return db.query(EmploiDuTemps).filter(EmploiDuTemps.groupe_id == groupe_id).count() > 0

    @staticmethod
    def check_department_exists(db: Session, departement_id: int) -> bool:
        return db.query(Departement).filter(Departement.id == departement_id).count() > 0

    @staticmethod
    def get_student_current_group(db: Session, student_id: int) -> Optional[int]:
        res = db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == student_id).first()
        return res[0] if res else None

    @staticmethod
    def add_students(db: Session, groupe_id: int, student_ids: List[int]) -> Tuple[int, List[str], List[int]]:
        groupe = db.query(Groupe).filter(Groupe.id == groupe_id).first()
        if not groupe:
            return 0, ["Groupe non trouvé"], []
        
        added_count = 0
        errors = []
        already_in_other_group = []
        successfully_added_ids = []
        
        students = db.query(Utilisateur).filter(
            Utilisateur.id.in_(student_ids),
            Utilisateur.role == RoleUtilisateur.ETUDIANT
        ).all()
        
        valid_students_map = {s.id: s for s in students}
        
        for s_id in student_ids:
            if s_id not in valid_students_map:
                errors.append(f"ID {s_id} n'est pas un étudiant valide.")
                continue
            
            current_g_id = GroupeService.get_student_current_group(db, s_id)
            if current_g_id is not None:
                if current_g_id != groupe_id:
                    already_in_other_group.append(s_id)
                continue
            
            groupe.etudiants.append(valid_students_map[s_id])
            added_count += 1
            successfully_added_ids.append(s_id)
        
        if already_in_other_group:
            return 0, errors, already_in_other_group
            
        db.commit()

        # Notify each successfully added student
        try:
            for s_id in successfully_added_ids:
                NotificationService.create(
                    db,
                    s_id,
                    "Affectation à un groupe",
                    f'Vous avez été ajouté(e) au groupe "{groupe.nom}".'
                )
        except Exception:
            pass

        return added_count, errors, []

    @staticmethod
    def is_student_in_group(db: Session, groupe_id: int, student_id: int) -> bool:
        return db.query(etudiants_groupes).filter(
            etudiants_groupes.c.groupe_id == groupe_id,
            etudiants_groupes.c.etudiant_id == student_id
        ).count() > 0

    @staticmethod
    def remove_student(db: Session, groupe_id: int, student_id: int) -> bool:
        groupe = db.query(Groupe).filter(Groupe.id == groupe_id).first()
        if not groupe:
            return False
        
        student = next((s for s in groupe.etudiants if s.id == student_id), None)
        if not student:
            return False
        
        groupe_nom = groupe.nom
        groupe.etudiants.remove(student)
        db.commit()

        # Notify the removed student
        try:
            NotificationService.create(
                db,
                student_id,
                "Retrait d'un groupe",
                f'Vous avez été retiré(e) du groupe "{groupe_nom}".'
            )
        except Exception:
            pass

        return True

    @staticmethod
    def get_students_paginated(db: Session, groupe_id: int, page: int, per_page: int) -> Tuple[List[Utilisateur], int]:
        total = db.query(etudiants_groupes).filter(etudiants_groupes.c.groupe_id == groupe_id).count()
        offset = (page - 1) * per_page
        
        students = db.query(Utilisateur).join(
            etudiants_groupes,
            Utilisateur.id == etudiants_groupes.c.etudiant_id
        ).filter(
            etudiants_groupes.c.groupe_id == groupe_id
        ).offset(offset).limit(per_page).all()
        
        return students, total
