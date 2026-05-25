from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from datetime import time
from typing import List, Optional, Tuple, Dict
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.matiere import Matiere
from app.models.etudiant_groupe import etudiants_groupes
from app.schemas.emploi_du_temps import EmploiDuTempsCreate, EmploiDuTempsUpdate
from fastapi import HTTPException, status

class ConflictError(Exception):
    def __init__(self, conflicts: List[dict]):
        self.conflicts = conflicts
        super().__init__("Scheduling conflict")

class EmploiDuTempsService:
    
    @staticmethod
    def get_paginated(db: Session, query, page: int, per_page: int) -> Tuple[List[EmploiDuTemps], int]:
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    @staticmethod
    def get_by_groupe(db: Session, groupe_id: int, page: int, per_page: int, jour_semaine: Optional[int] = None):
        query = db.query(EmploiDuTemps).filter(EmploiDuTemps.groupe_id == groupe_id)
        if jour_semaine is not None:
            query = query.filter(EmploiDuTemps.jour_semaine == jour_semaine)
        return EmploiDuTempsService.get_paginated(db, query, page, per_page)

    @staticmethod
    def get_by_etudiant(db: Session, etudiant_id: int, page: int, per_page: int, jour_semaine: Optional[int] = None):
        group_ids = db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == etudiant_id).subquery()
        query = db.query(EmploiDuTemps).filter(EmploiDuTemps.groupe_id.in_(group_ids))
        if jour_semaine is not None:
            query = query.filter(EmploiDuTemps.jour_semaine == jour_semaine)
        return EmploiDuTempsService.get_paginated(db, query, page, per_page)

    @staticmethod
    def get_by_enseignant(db: Session, enseignant_id: int, page: int, per_page: int, jour_semaine: Optional[int] = None):
        query = db.query(EmploiDuTemps).join(Matiere).filter(Matiere.enseignant_id == enseignant_id)
        if jour_semaine is not None:
            query = query.filter(EmploiDuTemps.jour_semaine == jour_semaine)
        return EmploiDuTempsService.get_paginated(db, query, page, per_page)

    @staticmethod
    def get_by_salle(db: Session, salle_id: int, page: int, per_page: int, jour_semaine: Optional[int] = None):
        query = db.query(EmploiDuTemps).filter(EmploiDuTemps.salle_id == salle_id)
        if jour_semaine is not None:
            query = query.filter(EmploiDuTemps.jour_semaine == jour_semaine)
        return EmploiDuTempsService.get_paginated(db, query, page, per_page)

    @staticmethod
    def get_by_matiere(db: Session, matiere_id: int, page: int, per_page: int, jour_semaine: Optional[int] = None):
        query = db.query(EmploiDuTemps).filter(EmploiDuTemps.matiere_id == matiere_id)
        if jour_semaine is not None:
            query = query.filter(EmploiDuTemps.jour_semaine == jour_semaine)
        return EmploiDuTempsService.get_paginated(db, query, page, per_page)

    @staticmethod
    def get_by_id(db: Session, id: int):
        return db.query(EmploiDuTemps).filter(EmploiDuTemps.id == id).first()

    @staticmethod
    def check_conflicts(db: Session, groupe_id: int, salle_id: int, matiere_id: int, jour_semaine: int, heure_debut: time, heure_fin: time, exclude_id: Optional[int] = None):
        conflicts = []
        
        # Edge case handling: Ensure time objects are naive and without microseconds for robust comparison
        # (Input like "18:00:28.932Z" might come with tzinfo or microseconds)
        h_debut = heure_debut.replace(tzinfo=None, microsecond=0)
        h_fin = heure_fin.replace(tzinfo=None, microsecond=0)
        
        # Get teacher ID from matiere
        matiere = db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not matiere:
            return [{"type": "error", "id": None, "details": f"Matière ID {matiere_id} introuvable."}]
        enseignant_id = matiere.enseignant_id

        # Overlap condition: existing_debut < new_fin AND new_debut < existing_fin
        # This covers ANY overlap including partial, containment, and equality.
        overlap_condition = and_(
            EmploiDuTemps.jour_semaine == jour_semaine,
            EmploiDuTemps.heure_debut < h_fin,
            h_debut < EmploiDuTemps.heure_fin
        )
        
        if exclude_id:
            overlap_condition = and_(overlap_condition, EmploiDuTemps.id != exclude_id)

        # 1. Group conflict (All matching records)
        group_conflicts = db.query(EmploiDuTemps).filter(
            EmploiDuTemps.groupe_id == groupe_id,
            overlap_condition
        ).all()
        for c in group_conflicts:
            group_name = c.groupe.nom if c.groupe else f"ID {groupe_id}"
            conflicts.append({
                "type": "group",
                "id": c.id,
                "details": f"Le groupe '{group_name}' a déjà un cours programmé de {c.heure_debut.strftime('%H:%M')} à {c.heure_fin.strftime('%H:%M')}."
            })

        # 2. Room conflict
        room_conflicts = db.query(EmploiDuTemps).filter(
            EmploiDuTemps.salle_id == salle_id,
            overlap_condition
        ).all()
        for c in room_conflicts:
            room_name = c.salle.nom if c.salle else f"ID {salle_id}"
            conflicts.append({
                "type": "room",
                "id": c.id,
                "details": f"La salle '{room_name}' est déjà réservée de {c.heure_debut.strftime('%H:%M')} à {c.heure_fin.strftime('%H:%M')}."
            })

        # 3. Teacher conflict
        teacher_conflicts = db.query(EmploiDuTemps).join(Matiere).filter(
            Matiere.enseignant_id == enseignant_id,
            overlap_condition
        ).all()
        for c in teacher_conflicts:
            teacher_name = "L'enseignant"
            if c.matiere and c.matiere.enseignant:
                teacher_name = f"Pr. {c.matiere.enseignant.prenom} {c.matiere.enseignant.nom}"
            elif matiere and matiere.enseignant:
                teacher_name = f"Pr. {matiere.enseignant.prenom} {matiere.enseignant.nom}"
            conflicts.append({
                "type": "teacher",
                "id": c.id,
                "details": f"{teacher_name} a déjà un cours prévu de {c.heure_debut.strftime('%H:%M')} à {c.heure_fin.strftime('%H:%M')}."
            })

        return conflicts

    @staticmethod
    def create(db: Session, data: EmploiDuTempsCreate):
        # We strip microseconds before processing to ensure consistency with DB storage
        h_debut = data.heure_debut.replace(microsecond=0)
        h_fin = data.heure_fin.replace(microsecond=0)
        
        conflicts = EmploiDuTempsService.check_conflicts(
            db, data.groupe_id, data.salle_id, data.matiere_id,
            data.jour_semaine, h_debut, h_fin
        )
        
        if conflicts:
            raise ConflictError(conflicts)
            
        db_item = EmploiDuTemps(
            groupe_id=data.groupe_id,
            matiere_id=data.matiere_id,
            salle_id=data.salle_id,
            jour_semaine=data.jour_semaine,
            heure_debut=h_debut,
            heure_fin=h_fin
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def update(db: Session, id: int, data: EmploiDuTempsUpdate):
        db_item = EmploiDuTempsService.get_by_id(db, id)
        if not db_item:
            return None
            
        update_data = data.model_dump(exclude_unset=True)
        
        # Strip microseconds for consistent comparison
        if "heure_debut" in update_data:
            update_data["heure_debut"] = update_data["heure_debut"].replace(microsecond=0)
        if "heure_fin" in update_data:
            update_data["heure_fin"] = update_data["heure_fin"].replace(microsecond=0)

        # Get final values for conflict check
        groupe_id = update_data.get('groupe_id', db_item.groupe_id)
        salle_id = update_data.get('salle_id', db_item.salle_id)
        matiere_id = update_data.get('matiere_id', db_item.matiere_id)
        jour_semaine = update_data.get('jour_semaine', db_item.jour_semaine)
        heure_debut = update_data.get('heure_debut', db_item.heure_debut)
        heure_fin = update_data.get('heure_fin', db_item.heure_fin)
        
        conflicts = EmploiDuTempsService.check_conflicts(
            db, groupe_id, salle_id, matiere_id,
            jour_semaine, heure_debut, heure_fin,
            exclude_id=id
        )
        
        if conflicts:
            raise ConflictError(conflicts)
            
        for key, value in update_data.items():
            setattr(db_item, key, value)
            
        db.commit()
        db.refresh(db_item)
        return db_item

    @staticmethod
    def delete(db: Session, id: int):
        db_item = EmploiDuTempsService.get_by_id(db, id)
        if not db_item:
            return False
        
        if db_item.rattrapage_id:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Impossible de supprimer ce cours : il est lié à un rattrapage"
            )

        db.delete(db_item)
        db.commit()
        return True

    @staticmethod
    def get_planning_conflicts(db: Session) -> List[Dict]:
        conflicts = []
        # Query overlaps in EmploiDuTemps
        # Overlap: same jour_semaine, same room AND overlapping time OR same teacher AND overlapping time
        
        # We need enseignant_id from Matiere
        candidates = db.query(EmploiDuTemps).options(
            joinedload(EmploiDuTemps.matiere), 
            joinedload(EmploiDuTemps.salle)
        ).all()
        
        for i in range(len(candidates)):
            for j in range(i + 1, len(candidates)):
                e1 = candidates[i]
                e2 = candidates[j]
                
                if e1.jour_semaine == e2.jour_semaine:
                    # Overlap logic: existing_debut < new_fin AND new_debut < existing_fin
                    if e1.heure_debut < e2.heure_fin and e2.heure_debut < e1.heure_fin:
                        # Conflict room
                        if e1.salle_id == e2.salle_id:
                            conflicts.append({
                                "type": "room",
                                "id1": e1.id,
                                "id2": e2.id,
                                "name1": e1.matiere.nom if e1.matiere else "?",
                                "name2": e2.matiere.nom if e2.matiere else "?",
                                "salle": e1.salle.nom if e1.salle else str(e1.salle_id),
                                "day": e1.jour_semaine,
                                "slot": f"{e1.heure_debut.strftime('%H:%M')} - {e1.heure_fin.strftime('%H:%M')} / {e2.heure_debut.strftime('%H:%M')} - {e2.heure_fin.strftime('%H:%M')}"
                            })
                        
                        # Conflict teacher
                        if e1.matiere and e2.matiere and e1.matiere.enseignant_id == e2.matiere.enseignant_id:
                            conflicts.append({
                                "type": "teacher",
                                "id1": e1.id,
                                "id2": e2.id,
                                "name1": e1.matiere.nom,
                                "name2": e2.matiere.nom,
                                "enseignant_id": e1.matiere.enseignant_id,
                                "day": e1.jour_semaine,
                                "slot": f"{e1.heure_debut.strftime('%H:%M')} - {e1.heure_fin.strftime('%H:%M')} / {e2.heure_debut.strftime('%H:%M')} - {e2.heure_fin.strftime('%H:%M')}"
                            })
                            
        return conflicts
