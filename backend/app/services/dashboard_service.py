from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func, distinct
from datetime import date, timedelta
from app.models.utilisateur import Utilisateur
from app.models.absence import Absence
from app.models.rattrapage import Rattrapage
from app.models.salle import Salle
from app.models.matiere import Matiere
from app.models.groupe import Groupe
from app.models.emploi_du_temps import EmploiDuTemps
from app.models.enums import RoleUtilisateur, StatutAbsence, StatutRattrapage
from app.models.etudiant_groupe import etudiants_groupes

class DashboardService:
    @staticmethod
    def get_monthly_stats(db: Session, model, date_field):
        # Last 6 months - using func.to_char for PostgreSQL
        stats = db.query(
            func.to_char(date_field, 'YYYY-MM').label('month'),
            func.count(model.id).label('count')
        ).filter(
            date_field >= date.today() - timedelta(days=180)
        ).group_by('month').order_by('month').all()
        
        return [{"month": s.month, "count": s.count} for s in stats]

    @staticmethod
    def get_admin_stats(db: Session):
        users_stats = {
            "total_enseignants": db.query(Utilisateur).filter(Utilisateur.role == RoleUtilisateur.ENSEIGNANT, Utilisateur.actif == True).count(),
            "total_etudiants": db.query(Utilisateur).filter(Utilisateur.role == RoleUtilisateur.ETUDIANT, Utilisateur.actif == True).count(),
            "total_administrations": db.query(Utilisateur).filter(Utilisateur.role.in_([RoleUtilisateur.ADMINISTRATION, RoleUtilisateur.ADMIN_SYSTEME]), Utilisateur.actif == True).count(),
            "total_users": db.query(Utilisateur).filter(Utilisateur.actif == True).count()
        }
        
        absences_stats = {
            "total_absences": db.query(Absence).count(),
            "absences_en_attente": db.query(Absence).filter(Absence.statut == StatutAbsence.EN_ATTENTE).count(),
            "absences_validees": db.query(Absence).filter(Absence.statut == StatutAbsence.VALIDE).count(),
            "absences_rejetees": db.query(Absence).filter(Absence.statut == StatutAbsence.REJETE).count(),
            "absences_par_mois": DashboardService.get_monthly_stats(db, Absence, Absence.date_absence)
        }
        
        rattrapages_stats = {
            "total_rattrapages": db.query(Rattrapage).count(),
            "rattrapages_proposes": db.query(Rattrapage).filter(Rattrapage.statut == StatutRattrapage.PROPOSE).count(),
            "rattrapages_valides": db.query(Rattrapage).filter(Rattrapage.statut == StatutRattrapage.VALIDE).count(),
            "rattrapages_annules": db.query(Rattrapage).filter(Rattrapage.statut == StatutRattrapage.ANNULE).count(),
            "rattrapages_par_mois": DashboardService.get_monthly_stats(db, Rattrapage, Rattrapage.date_proposee)
        }
        
        salles_cours_stats = {
            "total_salles": db.query(Salle).count(),
            "total_matieres": db.query(Matiere).count(),
            "total_groupes": db.query(Groupe).count(),
            "total_cours_par_semaine": db.query(EmploiDuTemps).count()
        }
        
        return {
            "users": users_stats,
            "absences": absences_stats,
            "rattrapages": rattrapages_stats,
            "salles_et_cours": salles_cours_stats
        }

    @staticmethod
    def get_teacher_stats(db: Session, teacher_id: int):
        absences_stats = {
            "total_absences": db.query(Absence).filter(Absence.enseignant_id == teacher_id).count(),
            "absences_en_attente": db.query(Absence).filter(Absence.enseignant_id == teacher_id, Absence.statut == StatutAbsence.EN_ATTENTE).count(),
            "absences_validees": db.query(Absence).filter(Absence.enseignant_id == teacher_id, Absence.statut == StatutAbsence.VALIDE).count(),
            "absences_rejetees": db.query(Absence).filter(Absence.enseignant_id == teacher_id, Absence.statut == StatutAbsence.REJETE).count(),
            "absences_par_mois": [{"month": s.month, "count": s.count} for s in db.query(
                func.to_char(Absence.date_absence, 'YYYY-MM').label('month'),
                func.count(Absence.id).label('count')
            ).filter(Absence.enseignant_id == teacher_id).group_by('month').order_by('month').all()]
        }
        
        rattrapages_stats = {
            "total_rattrapages": db.query(Rattrapage).join(Absence).filter(Absence.enseignant_id == teacher_id).count(),
            "rattrapages_proposes": db.query(Rattrapage).join(Absence).filter(Absence.enseignant_id == teacher_id, Rattrapage.statut == StatutRattrapage.PROPOSE).count(),
            "rattrapages_valides": db.query(Rattrapage).join(Absence).filter(Absence.enseignant_id == teacher_id, Rattrapage.statut == StatutRattrapage.VALIDE).count(),
            "rattrapages_annules": db.query(Rattrapage).join(Absence).filter(Absence.enseignant_id == teacher_id, Rattrapage.statut == StatutRattrapage.ANNULE).count(),
            "rattrapages_par_mois": [{"month": s.month, "count": s.count} for s in db.query(
                func.to_char(Rattrapage.date_proposee, 'YYYY-MM').label('month'),
                func.count(Rattrapage.id).label('count')
            ).join(Absence).filter(Absence.enseignant_id == teacher_id).group_by('month').order_by('month').all()]
        }
        
        cours_stats = {
            "total_cours_par_semaine": db.query(EmploiDuTemps).join(Matiere).filter(Matiere.enseignant_id == teacher_id).count(),
            "groupes_enseignes": [g[0] for g in db.query(distinct(Groupe.nom)).join(EmploiDuTemps).join(Matiere).filter(Matiere.enseignant_id == teacher_id).all()]
        }
        
        return {
            "absences": absences_stats,
            "rattrapages": rattrapages_stats,
            "cours": cours_stats
        }

    @staticmethod
    def get_student_stats(db: Session, student_id: int):
        # Get student's groups
        student_group_ids = [g[0] for g in db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == student_id).all()]
        
        if not student_group_ids:
            return {
                "cours": {"total_cours_par_semaine": 0, "matieres_suivies": [], "groupes_appartenance": []},
                "absences_enseignants": {"total": 0, "en_attente": 0, "validees": 0},
                "rattrapages": {"total": 0, "proposes": 0, "valides": 0, "a_venir": 0},
                "list_rattrapages_a_venir": []
            }

        cours_stats = {
            "total_cours_par_semaine": db.query(EmploiDuTemps).filter(EmploiDuTemps.groupe_id.in_(student_group_ids)).count(),
            "matieres_suivies": [m[0] for m in db.query(distinct(Matiere.nom)).join(EmploiDuTemps).filter(EmploiDuTemps.groupe_id.in_(student_group_ids)).all()],
            "groupes_appartenance": [g[0] for g in db.query(Groupe.nom).filter(Groupe.id.in_(student_group_ids)).all()]
        }
        
        # Get matiere_ids for these groups
        student_matiere_ids = [m[0] for m in db.query(distinct(EmploiDuTemps.matiere_id)).filter(EmploiDuTemps.groupe_id.in_(student_group_ids)).all()]
        
        absences_enseignants = {
            "total": db.query(Absence).filter(Absence.matiere_id.in_(student_matiere_ids)).count(),
            "en_attente": db.query(Absence).filter(Absence.matiere_id.in_(student_matiere_ids), Absence.statut == StatutAbsence.EN_ATTENTE).count(),
            "validees": db.query(Absence).filter(Absence.matiere_id.in_(student_matiere_ids), Absence.statut == StatutAbsence.VALIDE).count(),
        }
        
        rattrapages_query = db.query(Rattrapage).join(Absence).filter(Absence.matiere_id.in_(student_matiere_ids))
        
        rattrapages_stats = {
            "total": rattrapages_query.count(),
            "proposes": rattrapages_query.filter(Rattrapage.statut == StatutRattrapage.PROPOSE).count(),
            "valides": rattrapages_query.filter(Rattrapage.statut == StatutRattrapage.VALIDE).count(),
            "a_venir": rattrapages_query.filter(Rattrapage.date_proposee >= date.today(), Rattrapage.statut == StatutRattrapage.VALIDE).count()
        }
        
        rattrapages_list = db.query(Rattrapage).options(
            joinedload(Rattrapage.absence).joinedload(Absence.matiere), 
            joinedload(Rattrapage.salle)
        ).join(Absence).filter(
            Absence.matiere_id.in_(student_matiere_ids),
            Rattrapage.date_proposee >= date.today(),
            Rattrapage.statut == StatutRattrapage.VALIDE
        ).order_by(Rattrapage.date_proposee.asc()).all()
        
        return {
            "cours": cours_stats,
            "absences_enseignants": absences_enseignants,
            "rattrapages": rattrapages_stats,
            "list_rattrapages_a_venir": [
                {
                    "id": r.id, 
                    "date": r.date_proposee.isoformat(), 
                    "matiere": r.absence.matiere.nom,
                    "heure_debut": r.heure_debut.strftime("%H:%M"),
                    "heure_fin": r.heure_fin.strftime("%H:%M"),
                    "salle": r.salle.nom
                } for r in rattrapages_list
            ]
        }
