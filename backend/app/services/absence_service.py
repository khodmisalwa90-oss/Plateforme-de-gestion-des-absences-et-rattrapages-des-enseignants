from sqlalchemy.orm import Session, joinedload
from datetime import date, datetime
from typing import List, Optional, Tuple
from app.models.absence import Absence
from app.models.matiere import Matiere
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.utilisateur import Utilisateur
from app.models.enums import StatutAbsence, RoleUtilisateur
from app.schemas.absence import AbsenceCreate, AbsenceUpdate
from fastapi import HTTPException, status, UploadFile
from app.utils.upload import save_upload_file
from app.services.notification_service import NotificationService
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.etudiant_groupe import etudiants_groupes
from app.utils.email import send_email

def _get_admin_users(db: Session) -> List[Utilisateur]:
    """Return all administration and admin_systeme users."""
    return db.query(Utilisateur).filter(
        Utilisateur.role.in_([RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ADMIN_SYSTEME])
    ).all()


def _notify_admins(db: Session, titre: str, message: str):
    """Send a notification to all admin/administration users."""
    try:
        for admin in _get_admin_users(db):
            NotificationService.create(db, admin.id, titre, message)
    except Exception:
        pass  # Never break the main transaction


class AbsenceService:
    @staticmethod
    def get_paginated(db: Session, query, page: int, per_page: int) -> Tuple[List[Absence], int]:
        total = query.count()
        items = query.offset((page - 1) * per_page).limit(per_page).all()
        return items, total

    @staticmethod
    def _teacher_owns_matiere(db: Session, enseignant_id: int, matiere_id: int):
        matiere = db.query(Matiere).filter(Matiere.id == matiere_id).first()
        if not matiere or matiere.enseignant_id != enseignant_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cette matière ne vous appartient pas ou n'existe pas"
            )
        return matiere

    @staticmethod
    def _teacher_has_course_on_date(db: Session, enseignant_id: int, date_absence: date):
        # Python weekday: Mon=0, Sun=6
        day_index = date_absence.weekday()
        # Join with Matiere because EmploiDuTemps doesn't have indirect enseignant_id FK (it's through Matiere)
        has_course = db.query(EmploiDuTemps).join(Matiere).filter(
            Matiere.enseignant_id == enseignant_id,
            EmploiDuTemps.jour_semaine == day_index
        ).first() is not None
        
        if not has_course:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous n'avez aucun cours prévu pour ce jour, vous ne pouvez pas déclarer d'absence"
            )
        return True

    @staticmethod
    def list_absences(db: Session, role: RoleUtilisateur, user_id: int, page: int, per_page: int, statut: Optional[StatutAbsence] = None, date_absence: Optional[date] = None):
        query = db.query(Absence).options(joinedload(Absence.enseignant), joinedload(Absence.matiere))
        
        if role == RoleUtilisateur.ENSEIGNANT:
            query = query.filter(Absence.enseignant_id == user_id)
        
        if statut:
            query = query.filter(Absence.statut == statut)
        if date_absence:
            query = query.filter(Absence.date_absence == date_absence)
            
        return AbsenceService.get_paginated(db, query.order_by(Absence.created_at.desc()), page, per_page)

    @staticmethod
    def get_by_id(db: Session, id: int, user_id: int, role: RoleUtilisateur):
        absence = db.query(Absence).options(joinedload(Absence.enseignant), joinedload(Absence.matiere)).filter(Absence.id == id).first()
        if not absence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence non trouvée")
        
        if role == RoleUtilisateur.ENSEIGNANT and absence.enseignant_id != user_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Pas assez d'autorisations")
            
        return absence

    @staticmethod
    def declare_absence(
        db: Session,
        enseignant_id: int,
        matiere_id: int,
        date_absence: date,
        motif: str,
        justificatif_file: Optional[UploadFile] = None,
        justificatif_path: Optional[str] = None
    ):
        # 1. Ownership check
        matiere = AbsenceService._teacher_owns_matiere(db, enseignant_id, matiere_id)
        # 2. Daily schedule check
        AbsenceService._teacher_has_course_on_date(db, enseignant_id, date_absence)
        
        # 3. Past date validation
        if date_absence < date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous ne pouvez pas déclarer une absence pour une date passée"
            )
        
        # 4. Duplicate absence check
        existing = db.query(Absence).filter(
            Absence.enseignant_id == enseignant_id,
            Absence.matiere_id == matiere_id,
            Absence.date_absence == date_absence,
            Absence.statut != StatutAbsence.REJETE
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Vous avez déjà déclaré une absence pour cette matière à cette date"
            )
        
        # 5. File upload
        final_justificatif_path = justificatif_path
        if justificatif_file:
            final_justificatif_path = save_upload_file(justificatif_file, subdir="")
            
        # 6. Create record
        db_item = Absence(
            enseignant_id=enseignant_id,
            matiere_id=matiere_id,
            date_absence=date_absence,
            motif=motif,
            justificatif=final_justificatif_path,
            statut=StatutAbsence.EN_ATTENTE
        )
        db.add(db_item)
        db.commit()
        db.refresh(db_item)

        # 7. Notify admins
        enseignant = db.query(Utilisateur).filter(Utilisateur.id == enseignant_id).first()
        enseignant_nom = f"{enseignant.nom} {enseignant.prenom}" if enseignant else f"ID {enseignant_id}"
        _notify_admins(
            db,
            titre="Nouvelle absence déclarée",
            message=(
                f"L'enseignant {enseignant_nom} a déclaré une absence pour le {date_absence} "
                f"(matière: {matiere.nom}). En attente de validation."
            )
        )

        return db_item

    @staticmethod
    def update_absence(db: Session, id: int, enseignant_id: int, data: AbsenceUpdate, justificatif: Optional[UploadFile] = None):
        absence = db.query(Absence).options(joinedload(Absence.matiere)).filter(Absence.id == id).first()
        if not absence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence non trouvée")
        
        if absence.enseignant_id != enseignant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Propriétaire uniquement")
            
        if absence.statut != StatutAbsence.EN_ATTENTE:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Impossible de modifier une absence déjà validée ou rejetée"
            )
        
        update_data = data.model_dump(exclude_unset=True)
        
        # Re-validate if critical fields change
        if "matiere_id" in update_data:
            AbsenceService._teacher_owns_matiere(db, enseignant_id, update_data["matiere_id"])
        
        if "date_absence" in update_data:
            AbsenceService._teacher_has_course_on_date(db, enseignant_id, update_data["date_absence"])
            
        for key, value in update_data.items():
            setattr(absence, key, value)
            
        # Handle file upload if provided
        if justificatif:
            justificatif_path = save_upload_file(justificatif, subdir="")
            absence.justificatif = justificatif_path
            
        db.commit()
        db.refresh(absence)

        # Notify admins of modification
        enseignant = db.query(Utilisateur).filter(Utilisateur.id == enseignant_id).first()
        enseignant_nom = enseignant.nom if enseignant else f"ID {enseignant_id}"
        _notify_admins(
            db,
            titre="Absence modifiée",
            message=f"L'enseignant {enseignant_nom} a modifié son absence du {absence.date_absence}."
        )

        return absence

    @staticmethod
    def delete_absence(db: Session, id: int, enseignant_id: int):
        absence = db.query(Absence).options(joinedload(Absence.enseignant)).filter(Absence.id == id).first()
        if not absence:
             raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence non trouvée")
        
        if absence.enseignant_id != enseignant_id:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Propriétaire uniquement")
            
        if absence.statut != StatutAbsence.EN_ATTENTE:
             raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Impossible de supprimer une absence déjà validée ou rejetée"
            )

        # Capture info before deletion
        enseignant = absence.enseignant
        enseignant_nom = f"{enseignant.nom} {enseignant.prenom}" if enseignant else f"ID {enseignant_id}"
        date_absence = absence.date_absence
            
        db.delete(absence)
        db.commit()

        # Notify admins of withdrawal
        _notify_admins(
            db,
            titre="Absence annulée",
            message=f"L'enseignant {enseignant_nom} a annulé sa déclaration d'absence du {date_absence}."
        )

        return True

    @staticmethod
    def set_statut(db: Session, id: int, statut: StatutAbsence):
        absence = db.query(Absence).options(joinedload(Absence.enseignant), joinedload(Absence.matiere)).filter(Absence.id == id).first()
        if not absence:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Absence non trouvée")
            
        absence.statut = statut
        db.commit()
        db.refresh(absence)

        # Notify the teacher
        try:
            if statut == StatutAbsence.VALIDE:
                NotificationService.create(
                    db,
                    absence.enseignant_id,
                    "Absence validée",
                    f"Votre absence du {absence.date_absence} a été validée. Vous pouvez maintenant proposer un rattrapage."
                )
                # Get unique group IDs for the subject
                group_rows = db.query(EmploiDuTemps.groupe_id).filter(EmploiDuTemps.matiere_id == absence.matiere_id).distinct().all()
                group_ids = [row[0] for row in group_rows]
                student_ids_set = set()
                for gid in group_ids:
                    student_rows = db.query(etudiants_groupes.c.etudiant_id).filter(etudiants_groupes.c.groupe_id == gid).all()
                    student_ids_set.update([r[0] for r in student_rows])
                # Send notifications and emails to each student
                for sid in student_ids_set:
                    try:
                        NotificationService.create(
                            db,
                            sid,
                            "Absence validée",
                            f"L'absence du {absence.date_absence} pour la matière {absence.matiere.nom} a été validée. Consultez le planning du rattrapage."
                        )
                        student = db.query(Utilisateur).filter(Utilisateur.id == sid).first()
                        if student and getattr(student, 'email', None):
                            send_email(
                                student.email,
                                "Absence validée",
                                f"Une absence a été validée le {absence.date_absence} pour la matière {absence.matiere.nom}. Consultez le planning."
                            )
                    except Exception:
                        pass
            elif statut == StatutAbsence.REJETE:
                motif_txt = absence.motif if absence.motif else "non spécifié"
                NotificationService.create(
                    db,
                    absence.enseignant_id,
                    "Absence rejetée",
                    f"Votre absence du {absence.date_absence} a été rejetée. Motif: {motif_txt}."
                )
        except Exception:
            pass

        return absence
