from sqlalchemy.orm import Session, joinedload
from datetime import date, time, datetime
from typing import List, Optional, Tuple
from app.models.rattrapage import Rattrapage
from app.models.absence import Absence
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.matiere import Matiere
from app.models.salle import Salle
from app.models.utilisateur import Utilisateur
from app.models.etudiant_groupe import etudiants_groupes
from app.models.groupe import Groupe
from app.models.enums import StatutRattrapage, RoleUtilisateur, StatutAbsence
from app.schemas.rattrapage import RattrapageCreate
from fastapi import HTTPException, status
from app.services.notification_service import NotificationService


def _get_admin_users(db: Session) -> List[Utilisateur]:
    return db.query(Utilisateur).filter(
        Utilisateur.role.in_([RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ADMIN_SYSTEME])
    ).all()


def _notify_admins(db: Session, titre: str, message: str):
    try:
        for admin in _get_admin_users(db):
            NotificationService.create(db, admin.id, titre, message)
    except Exception:
        pass


def _get_affected_student_ids(db: Session, matiere_id: int, jour_semaine: int) -> List[int]:
    """Return student IDs in groups that have this matiere on the given weekday."""
    groupe_ids = db.query(EmploiDuTemps.groupe_id).filter(
        EmploiDuTemps.matiere_id == matiere_id,
        EmploiDuTemps.jour_semaine == jour_semaine
    ).distinct().all()
    groupe_ids = [g[0] for g in groupe_ids]

    if not groupe_ids:
        return []

    student_ids = db.query(etudiants_groupes.c.etudiant_id).filter(
        etudiants_groupes.c.groupe_id.in_(groupe_ids)
    ).distinct().all()
    return [s[0] for s in student_ids]


class RattrapageService:
    @staticmethod
    def get_paginated(db: Session, query, page: int, per_page: int) -> Tuple[List[Rattrapage], int]:
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    @staticmethod
    def list_all(db: Session, page: int, per_page: int, statut: Optional[StatutRattrapage] = None, 
                 absence_id: Optional[int] = None, enseignant_id: Optional[int] = None,
                 date_from: Optional[date] = None, date_to: Optional[date] = None):
        query = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
            joinedload(Rattrapage.absence).joinedload(Absence.matiere),
            joinedload(Rattrapage.salle)
        )
        
        if statut:
            query = query.filter(Rattrapage.statut == statut)
        if absence_id:
            query = query.filter(Rattrapage.absence_id == absence_id)
        if enseignant_id:
            query = query.join(Absence).filter(Absence.enseignant_id == enseignant_id)
        if date_from:
            query = query.filter(Rattrapage.date_proposee >= date_from)
        if date_to:
            query = query.filter(Rattrapage.date_proposee <= date_to)
            
        return RattrapageService.get_paginated(db, query.order_by(Rattrapage.date_proposee.desc()), page, per_page)

    @staticmethod
    def get_upcoming(db: Session, page: int, per_page: int, user_id: Optional[int] = None, role: Optional[RoleUtilisateur] = None):
        today = date.today()
        query = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
            joinedload(Rattrapage.absence).joinedload(Absence.matiere),
            joinedload(Rattrapage.salle)
        ).filter(Rattrapage.date_proposee >= today, Rattrapage.statut != StatutRattrapage.ANNULE)
        
        if role == RoleUtilisateur.ENSEIGNANT:
            query = query.join(Absence).filter(Absence.enseignant_id == user_id)
        elif role == RoleUtilisateur.ETUDIANT:
            query = query.filter(Rattrapage.statut == StatutRattrapage.VALIDE)
            
        return RattrapageService.get_paginated(db, query.order_by(Rattrapage.date_proposee.asc()), page, per_page)

    @staticmethod
    def check_conflicts(db: Session, salle_id: int, enseignant_id: int, 
                        date_proposee: date, heure_debut: time, heure_fin: time, 
                        exclude_id: Optional[int] = None):
        # 1. Room conflicts
        # a) Weekly schedule
        day_index = date_proposee.weekday()
        room_weekly_conflict = db.query(EmploiDuTemps).filter(
            EmploiDuTemps.salle_id == salle_id,
            EmploiDuTemps.jour_semaine == day_index,
            EmploiDuTemps.heure_debut < heure_fin,
            EmploiDuTemps.heure_fin > heure_debut
        ).first()
        if room_weekly_conflict:
            return f"La salle est déjà occupée par un cours hebdomadaire ({room_weekly_conflict.heure_debut}-{room_weekly_conflict.heure_fin})"
            
        # b) Other rattrapages
        room_rattrapage_conflict = db.query(Rattrapage).filter(
            Rattrapage.salle_id == salle_id,
            Rattrapage.date_proposee == date_proposee,
            Rattrapage.statut != StatutRattrapage.ANNULE,
            Rattrapage.heure_debut < heure_fin,
            Rattrapage.heure_fin > heure_debut
        )
        if exclude_id:
            room_rattrapage_conflict = room_rattrapage_conflict.filter(Rattrapage.id != exclude_id)
        
        conflict = room_rattrapage_conflict.first()
        if conflict:
            return f"La salle est déjà réservée pour un autre rattrapage ({conflict.heure_debut}-{conflict.heure_fin})"

        # 2. Teacher conflicts
        # a) Weekly schedule
        teacher_weekly_conflict = db.query(EmploiDuTemps).join(Matiere).filter(
            Matiere.enseignant_id == enseignant_id,
            EmploiDuTemps.jour_semaine == day_index,
            EmploiDuTemps.heure_debut < heure_fin,
            EmploiDuTemps.heure_fin > heure_debut
        ).first()
        if teacher_weekly_conflict:
             return f"L'enseignant a déjà un cours prévu à cet horaire ({teacher_weekly_conflict.heure_debut}-{teacher_weekly_conflict.heure_fin})"
             
        # b) Other rattrapages
        teacher_rattrapage_conflict = db.query(Rattrapage).join(Absence).filter(
            Absence.enseignant_id == enseignant_id,
            Rattrapage.date_proposee == date_proposee,
            Rattrapage.statut != StatutRattrapage.ANNULE,
            Rattrapage.heure_debut < heure_fin,
            Rattrapage.heure_fin > heure_debut
        )
        if exclude_id:
            teacher_rattrapage_conflict = teacher_rattrapage_conflict.filter(Rattrapage.id != exclude_id)
            
        conflict = teacher_rattrapage_conflict.first()
        if conflict:
            return f"L'enseignant a déjà un autre rattrapage à cet horaire ({conflict.heure_debut}-{conflict.heure_fin})"
            
        return None

    @staticmethod
    def create(db: Session, data: RattrapageCreate, current_user_id: int):
        # Check if salle exists
        salle = db.query(Salle).filter(Salle.id == data.salle_id).first()
        if not salle:
            raise HTTPException(status_code=404, detail="Salle non trouvée")

        absence = db.query(Absence).options(
            joinedload(Absence.enseignant), joinedload(Absence.matiere)
        ).filter(Absence.id == data.absence_id).first()
        if not absence:
            raise HTTPException(status_code=404, detail="Absence non trouvée")
        
        if absence.enseignant_id != current_user_id:
            raise HTTPException(status_code=403, detail="Vous n'êtes pas le propriétaire de cette absence")
            
        if absence.statut != StatutAbsence.VALIDE:
            raise HTTPException(status_code=400, detail="L'absence doit être validée avant de proposer un rattrapage")
            
        if data.heure_debut >= data.heure_fin:
            raise HTTPException(status_code=400, detail="L'heure de début doit être avant l'heure de fin")
            
        if data.date_proposee <= absence.date_absence:
             raise HTTPException(status_code=400, detail="La date de rattrapage doit être après la date de l'absence")

        existing = db.query(Rattrapage).filter(
            Rattrapage.absence_id == data.absence_id,
            Rattrapage.statut != StatutRattrapage.ANNULE
        ).first()
        if existing:
            raise HTTPException(status_code=400, detail="Un rattrapage est déjà programmé pour cette absence")

        conflict_msg = RattrapageService.check_conflicts(
            db, data.salle_id, absence.enseignant_id, data.date_proposee, data.heure_debut, data.heure_fin
        )
        if conflict_msg:
            raise HTTPException(status_code=400, detail=conflict_msg)
            
        db_item = Rattrapage(**data.model_dump())
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # Notify admins of the new proposal
        enseignant = absence.enseignant
        enseignant_nom = f"{enseignant.nom} {enseignant.prenom}" if enseignant else f"ID {absence.enseignant_id}"
        matiere_nom = absence.matiere.nom if absence.matiere else "?"
        _notify_admins(
            db,
            titre="Proposition de rattrapage",
            message=(
                f"Un rattrapage a été proposé pour l'absence du {absence.date_absence} "
                f"(enseignant: {enseignant_nom}). Le {data.date_proposee} de {data.heure_debut} "
                f"à {data.heure_fin} en salle {salle.nom}."
            )
        )

        return db_item

    @staticmethod
    def validate(db: Session, id: int, admin_id: int):
        rattrapage = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
            joinedload(Rattrapage.absence).joinedload(Absence.matiere),
            joinedload(Rattrapage.salle)
        ).filter(Rattrapage.id == id).first()
        if not rattrapage:
            raise HTTPException(status_code=404, detail="Rattrapage non trouvé")
        
        if rattrapage.statut == StatutRattrapage.VALIDE:
             return rattrapage
             
        rattrapage.statut = StatutRattrapage.VALIDE
        rattrapage.valide_par = admin_id
        db.commit()
        db.refresh(rattrapage)

        # Notify teacher
        try:
            NotificationService.create(
                db,
                rattrapage.absence.enseignant_id,
                "Rattrapage validé",
                f"Votre proposition de rattrapage du {rattrapage.date_proposee} a été validée."
            )
        except Exception:
            pass

        # Notify affected students
        try:
            absence = rattrapage.absence
            matiere = absence.matiere if absence else None
            salle = rattrapage.salle
            if matiere:
                jour_semaine = absence.date_absence.weekday()
                student_ids = _get_affected_student_ids(db, matiere.id, jour_semaine)
                salle_nom = salle.nom if salle else "?"
                matiere_nom = matiere.nom
                for student_id in student_ids:
                    NotificationService.create(
                        db,
                        student_id,
                        "Séance de rattrapage programmée",
                        (
                            f"Un rattrapage pour le cours {matiere_nom} aura lieu le "
                            f"{rattrapage.date_proposee} de {rattrapage.heure_debut} "
                            f"à {rattrapage.heure_fin} en salle {salle_nom}."
                        )
                    )
        except Exception:
            pass

        return rattrapage

    @staticmethod
    def annuler(db: Session, id: int, user_id: int, user_role: RoleUtilisateur):
        rattrapage = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
            joinedload(Rattrapage.absence).joinedload(Absence.matiere),
            joinedload(Rattrapage.salle)
        ).filter(Rattrapage.id == id).first()
        if not rattrapage:
            raise HTTPException(status_code=404, detail="Rattrapage non trouvé")
            
        is_owner = rattrapage.absence.enseignant_id == user_id
        is_admin = user_role in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]
        
        if not is_owner and not is_admin:
            raise HTTPException(status_code=403, detail="Pas assez d'autorisations")

        was_validated = rattrapage.statut == StatutRattrapage.VALIDE
        date_proposee = rattrapage.date_proposee
        enseignant_id = rattrapage.absence.enseignant_id
        absence = rattrapage.absence
        matiere = absence.matiere if absence else None
            
        rattrapage.statut = StatutRattrapage.ANNULE
        db.commit()
        db.refresh(rattrapage)

        # Notify teacher (if an admin cancelled)
        try:
            NotificationService.create(
                db,
                enseignant_id,
                "Rattrapage annulé",
                f"Le rattrapage prévu le {date_proposee} a été annulé."
            )
        except Exception:
            pass

        # If it was validated, also notify affected students
        if was_validated and matiere:
            try:
                jour_semaine = absence.date_absence.weekday()
                student_ids = _get_affected_student_ids(db, matiere.id, jour_semaine)
                for student_id in student_ids:
                    NotificationService.create(
                        db,
                        student_id,
                        "Rattrapage annulé",
                        f"Le rattrapage prévu le {date_proposee} a été annulé."
                    )
            except Exception:
                pass

        return rattrapage

    @staticmethod
    def affecter_salle(db: Session, id: int, salle_id: int):
        # Check if new salle exists
        salle = db.query(Salle).filter(Salle.id == salle_id).first()
        if not salle:
            raise HTTPException(status_code=404, detail="Salle non trouvée")
            
        rattrapage = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
            joinedload(Rattrapage.absence).joinedload(Absence.matiere)
        ).filter(Rattrapage.id == id).first()
        if not rattrapage:
            raise HTTPException(status_code=404, detail="Rattrapage non trouvé")
            
        conflict_msg = RattrapageService.check_conflicts(
            db, salle_id, rattrapage.absence.enseignant_id, 
            rattrapage.date_proposee, rattrapage.heure_debut, rattrapage.heure_fin,
            exclude_id=id
        )
        if conflict_msg:
            raise HTTPException(status_code=400, detail=conflict_msg)

        was_validated = rattrapage.statut == StatutRattrapage.VALIDE
        date_proposee = rattrapage.date_proposee
        enseignant_id = rattrapage.absence.enseignant_id
        absence = rattrapage.absence
        matiere = absence.matiere if absence else None
            
        rattrapage.salle_id = salle_id
        db.commit()
        db.refresh(rattrapage)

        # Notify teacher
        try:
            NotificationService.create(
                db,
                enseignant_id,
                "Salle de rattrapage modifiée",
                f"La salle du rattrapage du {date_proposee} a été changée pour {salle.nom}."
            )
        except Exception:
            pass

        # Notify affected students if already validated
        if was_validated and matiere:
            try:
                jour_semaine = absence.date_absence.weekday()
                student_ids = _get_affected_student_ids(db, matiere.id, jour_semaine)
                for student_id in student_ids:
                    NotificationService.create(
                        db,
                        student_id,
                        "Salle de rattrapage modifiée",
                        f"La salle du rattrapage du {date_proposee} a été changée pour {salle.nom}."
                    )
            except Exception:
                pass

        return rattrapage

    @staticmethod
    def delete(db: Session, id: int, user_id: int, user_role: RoleUtilisateur):
        rattrapage = db.query(Rattrapage).options(joinedload(Rattrapage.absence)).filter(Rattrapage.id == id).first()
        if not rattrapage:
            raise HTTPException(status_code=404, detail="Rattrapage non trouvé")
            
        if rattrapage.statut == StatutRattrapage.VALIDE:
            raise HTTPException(status_code=400, detail="Impossible de supprimer un rattrapage déjà validé")
            
        is_owner = rattrapage.absence.enseignant_id == user_id
        is_admin = user_role in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]
        
        if not is_owner and not is_admin:
            raise HTTPException(status_code=403, detail="Pas assez d'autorisations")
            
        db.delete(rattrapage)
        db.commit()
        return True
