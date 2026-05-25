import os
import json
from datetime import date, time, datetime
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, and_, select, distinct
from groq import Groq

from app.models import (
    Utilisateur, Absence, Rattrapage, EmploiDuTemps,
    Matiere, Salle, RoleUtilisateur, StatutAbsence, StatutRattrapage,
    Groupe, etudiants_groupes
)
from app.services.absence_service import AbsenceService
from app.services.rattrapage_service import RattrapageService
from app.services.salle_service import SalleService
from app.services.emploi_du_temps_service import EmploiDuTempsService
from app.schemas.rattrapage import RattrapageCreate
from app.core.config import settings

# Retrieve Groq API Key from settings
GROQ_API_KEY = settings.GROQ_API_KEY or settings.AI_API_KEY

client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

TOOLS = [
    {
        "type": "function",
        "function": {
            "name": "get_my_absences",
            "description": "Récupère les absences. Pour un enseignant, renvoie ses propres absences déclarées. Pour un étudiant, renvoie les absences des enseignants pour ses matières. Pour un administrateur, renvoie toutes les absences du système.",
            "parameters": {
                "type": "object",
                "properties": {
                    "status": {
                        "type": "string",
                        "enum": ["en_attente", "valide", "rejete"],
                        "description": "Filtrer par statut de l'absence."
                    },
                    "date_from": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de début au format YYYY-MM-DD"
                    },
                    "date_to": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de fin au format YYYY-MM-DD"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_upcoming_rattrapages",
            "description": "Récupère les séances de rattrapage à venir ou programmées.",
            "parameters": {
                "type": "object",
                "properties": {}
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_timetable",
            "description": "Récupère l'emploi du temps hebdomadaire récurrent selon plusieurs critères : pour soi-même ('self'), un enseignant, un étudiant, un groupe, une salle ou une matière. Les permissions d'accès sont vérifiées automatiquement.",
            "parameters": {
                "type": "object",
                "properties": {
                    "target_type": {
                        "type": "string",
                        "enum": ["self", "enseignant", "etudiant", "groupe", "salle", "matiere"],
                        "description": "La cible de l'emploi du temps à consulter : 'self' (soi-même), 'enseignant', 'etudiant', 'groupe', 'salle' ou 'matiere'."
                    },
                    "search_query": {
                        "type": "string",
                        "description": "Le nom, prénom, email, ou identifiant de l'enseignant, étudiant, groupe, salle ou matière recherché."
                    },
                    "jour_semaine": {
                        "type": "integer",
                        "description": "Indice du jour de la semaine (0 pour Lundi, 1 pour Mardi, ..., 6 pour Dimanche) optionnel."
                    }
                },
                "required": ["target_type"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_available_rooms",
            "description": "Recherche les salles de cours disponibles pour une date et une plage horaire données.",
            "parameters": {
                "type": "object",
                "properties": {
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de la recherche au format YYYY-MM-DD"
                    },
                    "heure_debut": {
                        "type": "string",
                        "description": "Heure de début au format HH:MM (ex: 08:30)"
                    },
                    "heure_fin": {
                        "type": "string",
                        "description": "Heure de fin au format HH:MM (ex: 10:30)"
                    }
                },
                "required": ["date", "heure_debut", "heure_fin"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "declare_absence",
            "description": "Déclare une absence pour l'enseignant connecté. Cette action nécessite une confirmation de l'utilisateur.",
            "parameters": {
                "type": "object",
                "properties": {
                    "matiere_nom": {
                        "type": "string",
                        "description": "Nom de la matière ou du cours (ex: Algorithmique, Algèbre)"
                    },
                    "date": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de l'absence au format YYYY-MM-DD"
                    },
                    "motif": {
                        "type": "string",
                        "description": "Motif de l'absence"
                    }
                },
                "required": ["matiere_nom", "date", "motif"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "propose_rattrapage",
            "description": "Propose une séance de rattrapage pour une absence validée de l'enseignant. Cette action nécessite une confirmation de l'utilisateur.",
            "parameters": {
                "type": "object",
                "properties": {
                    "absence_id": {
                        "type": "integer",
                        "description": "Identifiant de l'absence à rattraper si connu."
                    },
                    "date_absence": {
                        "type": "string",
                        "format": "date",
                        "description": "Date de l'absence à rattraper au format YYYY-MM-DD (si ID inconnu)"
                    },
                    "matiere_nom": {
                        "type": "string",
                        "description": "Nom de la matière de l'absence à rattraper (si ID inconnu)"
                    },
                    "date_proposee": {
                        "type": "string",
                        "format": "date",
                        "description": "Date du rattrapage proposé au format YYYY-MM-DD"
                    },
                    "heure_debut": {
                        "type": "string",
                        "description": "Heure de début au format HH:MM (ex: 14:00)"
                    },
                    "heure_fin": {
                        "type": "string",
                        "description": "Heure de fin au format HH:MM (ex: 16:00)"
                    },
                    "salle_nom": {
                        "type": "string",
                        "description": "Nom de la salle proposée (ex: Salle 101, Amphi A)"
                    }
                },
                "required": ["date_proposee", "heure_debut", "heure_fin", "salle_nom"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "update_my_profile",
            "description": "Met à jour les informations de profil de l'utilisateur connecté (nom, prénom, email, mot de passe). Cette action nécessite une confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "nom": {
                        "type": "string",
                        "description": "Nouveau nom de famille"
                    },
                    "prenom": {
                        "type": "string",
                        "description": "Nouveau prénom"
                    },
                    "email": {
                        "type": "string",
                        "description": "Nouvelle adresse email"
                    },
                    "mot_de_passe": {
                        "type": "string",
                        "description": "Nouveau mot de passe (min 6 caractères)"
                    }
                }
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "annuler_rattrapage",
            "description": "Annule une séance de rattrapage programmée ou proposée. Action disponible pour l'enseignant concerné ou l'administration. Nécessite une confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "rattrapage_id": {
                        "type": "integer",
                        "description": "Identifiant unique du rattrapage à annuler."
                    }
                },
                "required": ["rattrapage_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "valider_absence",
            "description": "Valide une absence déclarée par un enseignant. Cette action est réservée exclusivement aux Administrateurs et nécessite une confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "absence_id": {
                        "type": "integer",
                        "description": "Identifiant unique de l'absence à valider."
                    }
                },
                "required": ["absence_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "rejeter_absence",
            "description": "Rejette une absence déclarée par un enseignant. Cette action est réservée exclusivement aux Administrateurs et nécessite une confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "absence_id": {
                        "type": "integer",
                        "description": "Identifiant unique de l'absence à rejeter."
                    }
                },
                "required": ["absence_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "valider_rattrapage",
            "description": "Valide une proposition de rattrapage. Cette action est réservée exclusivement aux Administrateurs et nécessite une confirmation.",
            "parameters": {
                "type": "object",
                "properties": {
                    "rattrapage_id": {
                        "type": "integer",
                        "description": "Identifiant unique du rattrapage à valider."
                    }
                },
                "required": ["rattrapage_id"]
            }
        }
    }
]

DAY_NAMES = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]

class ChatbotService:
    @staticmethod
    def get_system_prompt(user: Utilisateur) -> str:
        today_str = date.today().strftime("%Y-%m-%d")
        role_label = {
            RoleUtilisateur.ADMIN_SYSTEME: "Administrateur Système",
            RoleUtilisateur.ADMINISTRATION: "Administrateur",
            RoleUtilisateur.ENSEIGNANT: "Enseignant (Professeur)",
            RoleUtilisateur.ETUDIANT: "Étudiant"
        }.get(user.role, "Utilisateur")

        prompt = (
            f"Tu es l'assistant virtuel intelligent de la plateforme de gestion des absences et rattrapages des enseignants.\n"
            f"Tu interagis avec {user.prenom} {user.nom}, qui est connecté avec le rôle : {role_label}.\n"
            f"La date d'aujourd'hui est le {today_str}.\n\n"
            f"Règles importantes :\n"
            f"1. Reste poli, clair et concis. Réponds en français.\n"
            f"2. Utilise les outils/fonctions mis à ta disposition pour interroger la base de données ou initier des actions.\n"
            f"3. Pour toute action d'écriture, appelle l'outil correspondant — le backend demandera toujours une confirmation à l'utilisateur avant d'exécuter. Tu n'as pas besoin de répéter que tu as appelé l'outil.\n"
            f"4. Actions disponibles selon le rôle :\n"
            f"   - TOUS LES RÔLES : \n"
            f"     * update_my_profile (mettre à jour son propre profil)\n"
            f"     * get_timetable (consulter l'emploi du temps récurrent : soi-même, un enseignant, un étudiant, un groupe, une salle ou une matière).\n"
            f"       Remarque sur l'emploi du temps : Les administrateurs ont accès à TOUT. Les enseignants peuvent voir leur planning et celui de leurs cours/groupes/étudiants. Les étudiants peuvent voir leur planning et celui de leurs enseignants.\n"
            f"   - ENSEIGNANT : declare_absence (déclarer une absence), propose_rattrapage (proposer un rattrapage), annuler_rattrapage (annuler son propre rattrapage)\n"
            f"   - ADMINISTRATEUR : valider_absence, rejeter_absence, valider_rattrapage, annuler_rattrapage (pour n'importe quel rattrapage)\n"
            f"   - ÉTUDIANT : peut interroger ses cours, ses enseignants, rattrapages prévus et absences de ses enseignants (lecture seule)\n"
            f"5. Si des informations requises sont manquantes (ex: la matière, l'ID d'une absence), demande poliment ces précisions à l'utilisateur.\n"
            f"6. Ne génère JAMAIS de texte au format XML ou HTML avec des balises comme <function> pour appeler les outils. Utilise exclusivement l'appel d'outil natif de l'API.\n"
            f"7. Ne propose JAMAIS une action non autorisée pour le rôle en cours. Si quelqu'un demande une action réservée à un autre rôle, explique-le poliment.\n"
        )
        return prompt

    @staticmethod
    def execute_query_tool(db: Session, user: Utilisateur, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes read-only query tools.
        Returns a dictionary representing the results.
        """
        try:
            if name == "get_my_absences":
                status_filter = None
                if args.get("status"):
                    from app.models.enums import StatutAbsence
                    status_filter = {
                        "en_attente": StatutAbsence.EN_ATTENTE,
                        "valide": StatutAbsence.VALIDE,
                        "rejete": StatutAbsence.REJETE
                    }.get(args["status"])

                date_from = None
                if args.get("date_from"):
                    date_from = date.fromisoformat(args["date_from"])

                date_to = None
                if args.get("date_to"):
                    date_to = date.fromisoformat(args["date_to"])

                # Query based on role
                if user.role in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    # Admin lists all absences
                    query = db.query(Absence).options(
                        joinedload(Absence.enseignant),
                        joinedload(Absence.matiere)
                    )
                    if status_filter:
                        query = query.filter(Absence.statut == status_filter)
                    if date_from:
                        query = query.filter(Absence.date_absence >= date_from)
                    if date_to:
                        query = query.filter(Absence.date_absence <= date_to)
                    absences = query.order_by(Absence.date_absence.desc()).limit(30).all()
                elif user.role == RoleUtilisateur.ENSEIGNANT:
                    # Teacher lists their own absences
                    query = db.query(Absence).options(joinedload(Absence.matiere)).filter(Absence.enseignant_id == user.id)
                    if status_filter:
                        query = query.filter(Absence.statut == status_filter)
                    if date_from:
                        query = query.filter(Absence.date_absence >= date_from)
                    if date_to:
                        query = query.filter(Absence.date_absence <= date_to)
                    absences = query.order_by(Absence.date_absence.desc()).limit(30).all()
                elif user.role == RoleUtilisateur.ETUDIANT:
                    # Student lists teachers absences in their groups
                    student_group_ids = [g[0] for g in db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == user.id).all()]
                    if not student_group_ids:
                        return {"absences": [], "message": "Vous n'êtes inscrit dans aucun groupe."}
                    student_matiere_ids = [m[0] for m in db.query(distinct(EmploiDuTemps.matiere_id)).filter(EmploiDuTemps.groupe_id.in_(student_group_ids)).all()]
                    
                    query = db.query(Absence).options(
                        joinedload(Absence.enseignant),
                        joinedload(Absence.matiere)
                    ).filter(Absence.matiere_id.in_(student_matiere_ids))
                    if status_filter:
                        query = query.filter(Absence.statut == status_filter)
                    if date_from:
                        query = query.filter(Absence.date_absence >= date_from)
                    if date_to:
                        query = query.filter(Absence.date_absence <= date_to)
                    absences = query.order_by(Absence.date_absence.desc()).limit(30).all()
                else:
                    absences = []

                res_list = []
                for ab in absences:
                    teacher_name = f"{ab.enseignant.prenom} {ab.enseignant.nom}" if ab.enseignant else "Inconnu"
                    res_list.append({
                        "id": ab.id,
                        "date": ab.date_absence.isoformat(),
                        "matiere": ab.matiere.nom if ab.matiere else f"Matière ID {ab.matiere_id}",
                        "enseignant": teacher_name,
                        "motif": ab.motif,
                        "statut": ab.statut.value
                    })
                return {"absences": res_list}

            elif name == "get_upcoming_rattrapages":
                # Call RattrapageService.get_upcoming
                items, total = RattrapageService.get_upcoming(db, 1, 30, user.id, user.role)
                res_list = []
                for r in items:
                    teacher = r.absence.enseignant if r.absence else None
                    teacher_name = f"{teacher.prenom} {teacher.nom}" if teacher else "Inconnu"
                    res_list.append({
                        "id": r.id,
                        "date": r.date_proposee.isoformat(),
                        "heure_debut": r.heure_debut.strftime("%H:%M"),
                        "heure_fin": r.heure_fin.strftime("%H:%M"),
                        "matiere": r.absence.matiere.nom if r.absence and r.absence.matiere else "Matière inconnue",
                        "enseignant": teacher_name,
                        "salle": r.salle.nom if r.salle else f"Salle ID {r.salle_id}",
                        "statut": r.statut.value
                    })
                return {"rattrapages": res_list}

            elif name == "get_timetable":
                target_type = args.get("target_type")
                search_query = args.get("search_query")
                jour_semaine = args.get("jour_semaine")

                is_admin = user.role in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]
                is_teacher = user.role == RoleUtilisateur.ENSEIGNANT
                is_student = user.role == RoleUtilisateur.ETUDIANT

                items = []
                total = 0

                # 1. target_type = self
                if target_type == "self":
                    if is_teacher:
                        items, total = EmploiDuTempsService.get_by_enseignant(db, user.id, 1, 100, jour_semaine)
                    elif is_student:
                        items, total = EmploiDuTempsService.get_by_etudiant(db, user.id, 1, 100, jour_semaine)
                    else:
                        return {"message": "Les administrateurs n'ont pas d'emploi du temps récurrent personnel."}

                # 2. target_type = groupe
                elif target_type == "groupe":
                    if not search_query:
                        return {"message": "Veuillez fournir le nom ou l'ID du groupe à rechercher."}
                    
                    # Find group
                    groupe_query = db.query(Groupe)
                    if search_query.isdigit():
                        groupe_query = groupe_query.filter(or_(Groupe.id == int(search_query), Groupe.nom.ilike(f"%{search_query}%")))
                    else:
                        groupe_query = groupe_query.filter(Groupe.nom.ilike(f"%{search_query}%"))
                    
                    groupes = groupe_query.all()
                    if not groupes:
                        return {"message": f"Aucun groupe trouvé correspondant à '{search_query}'."}
                    
                    # If multiple, but one matches exactly, use it. Otherwise use the first.
                    target_groupe = groupes[0]
                    for g in groupes:
                        if g.nom.lower() == search_query.lower():
                            target_groupe = g
                            break

                    # Check permissions
                    if is_student:
                        # Student can only view their own group
                        student_group_ids = [g[0] for g in db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == user.id).all()]
                        if target_groupe.id not in student_group_ids:
                            return {"message": f"Vous n'êtes pas autorisé à consulter l'emploi du temps d'un autre groupe que le vôtre."}
                    elif is_teacher:
                        # Teacher can only view groups they teach
                        teacher_group_ids = [g[0] for g in db.query(distinct(EmploiDuTemps.groupe_id)).join(Matiere).filter(Matiere.enseignant_id == user.id).all()]
                        if target_groupe.id not in teacher_group_ids:
                            return {"message": f"Vous n'êtes pas autorisé à consulter l'emploi du temps d'un groupe auquel vous n'enseignez pas."}
                    
                    items, total = EmploiDuTempsService.get_by_groupe(db, target_groupe.id, 1, 100, jour_semaine)

                # 3. target_type = salle
                elif target_type == "salle":
                    if not is_admin:
                        return {"message": "Seuls les administrateurs peuvent consulter directement l'emploi du temps d'une salle."}
                    if not search_query:
                        return {"message": "Veuillez fournir le nom ou l'ID de la salle à rechercher."}
                    
                    salle_query = db.query(Salle)
                    if search_query.isdigit():
                        salle_query = salle_query.filter(or_(Salle.id == int(search_query), Salle.nom.ilike(f"%{search_query}%")))
                    else:
                        salle_query = salle_query.filter(Salle.nom.ilike(f"%{search_query}%"))
                    
                    salles = salle_query.all()
                    if not salles:
                        return {"message": f"Aucune salle trouvée correspondant à '{search_query}'."}
                    
                    target_salle = salles[0]
                    for s in salles:
                        if s.nom.lower() == search_query.lower():
                            target_salle = s
                            break

                    items, total = EmploiDuTempsService.get_by_salle(db, target_salle.id, 1, 100, jour_semaine)

                # 4. target_type = matiere
                elif target_type == "matiere":
                    if not search_query:
                        return {"message": "Veuillez fournir le nom ou l'ID de la matière à rechercher."}
                    
                    matiere_query = db.query(Matiere)
                    if search_query.isdigit():
                        matiere_query = matiere_query.filter(or_(Matiere.id == int(search_query), Matiere.nom.ilike(f"%{search_query}%")))
                    else:
                        matiere_query = matiere_query.filter(Matiere.nom.ilike(f"%{search_query}%"))
                    
                    matieres = matiere_query.all()
                    if not matieres:
                        return {"message": f"Aucune matière trouvée correspondant à '{search_query}'."}
                    
                    target_matiere = matieres[0]
                    for m in matieres:
                        if m.nom.lower() == search_query.lower():
                            target_matiere = m
                            break

                    # Check permissions
                    if is_student:
                        return {"message": "Les étudiants ne sont pas autorisés à consulter directement l'emploi du temps par matière."}
                    elif is_teacher:
                        if target_matiere.enseignant_id != user.id:
                            return {"message": "Vous n'êtes pas autorisé à consulter l'emploi du temps d'une matière qui ne vous est pas attribuée."}
                    
                    items, total = EmploiDuTempsService.get_by_matiere(db, target_matiere.id, 1, 100, jour_semaine)

                # 5. target_type = enseignant
                elif target_type == "enseignant":
                    if not search_query:
                        return {"message": "Veuillez fournir le nom, prénom ou email de l'enseignant à rechercher."}
                    
                    teacher_query = db.query(Utilisateur).filter(Utilisateur.role == RoleUtilisateur.ENSEIGNANT)
                    if search_query.isdigit():
                        teacher_query = teacher_query.filter(Utilisateur.id == int(search_query))
                    else:
                        # Split by space to support nom + prenom search
                        parts = search_query.split()
                        if len(parts) >= 2:
                            p1, p2 = parts[0], parts[1]
                            teacher_query = teacher_query.filter(
                                or_(
                                    and_(Utilisateur.prenom.ilike(f"%{p1}%"), Utilisateur.nom.ilike(f"%{p2}%")),
                                    and_(Utilisateur.prenom.ilike(f"%{p2}%"), Utilisateur.nom.ilike(f"%{p1}%"))
                                )
                            )
                        else:
                            teacher_query = teacher_query.filter(
                                or_(
                                    Utilisateur.nom.ilike(f"%{search_query}%"),
                                    Utilisateur.prenom.ilike(f"%{search_query}%"),
                                    Utilisateur.email.ilike(f"%{search_query}%")
                                )
                            )
                    
                    teachers = teacher_query.all()
                    if not teachers:
                        return {"message": f"Aucun enseignant trouvé correspondant à '{search_query}'."}
                    
                    target_teacher = teachers[0]

                    # Check permissions
                    if is_teacher and target_teacher.id != user.id:
                        return {"message": "Vous n'êtes pas autorisé à consulter l'emploi du temps d'un autre enseignant."}
                    elif is_student:
                        # Student can only see teachers that teach them
                        student_group_ids = [g[0] for g in db.query(etudiants_groupes.c.groupe_id).filter(etudiants_groupes.c.etudiant_id == user.id).all()]
                        student_matiere_ids = [m[0] for m in db.query(distinct(EmploiDuTemps.matiere_id)).filter(EmploiDuTemps.groupe_id.in_(student_group_ids)).all()]
                        allowed_teacher_ids = [t[0] for t in db.query(distinct(Matiere.enseignant_id)).filter(Matiere.id.in_(student_matiere_ids)).all()]
                        if target_teacher.id not in allowed_teacher_ids:
                            return {"message": "Vous n'êtes autorisé à consulter l'emploi du temps que de vos propres enseignants."}
                    
                    items, total = EmploiDuTempsService.get_by_enseignant(db, target_teacher.id, 1, 100, jour_semaine)

                # 6. target_type = etudiant
                elif target_type == "etudiant":
                    if not search_query:
                        return {"message": "Veuillez fournir le nom, prénom ou email de l'étudiant à rechercher."}
                    
                    student_query = db.query(Utilisateur).filter(Utilisateur.role == RoleUtilisateur.ETUDIANT)
                    if search_query.isdigit():
                        student_query = student_query.filter(Utilisateur.id == int(search_query))
                    else:
                        parts = search_query.split()
                        if len(parts) >= 2:
                            p1, p2 = parts[0], parts[1]
                            student_query = student_query.filter(
                                or_(
                                    and_(Utilisateur.prenom.ilike(f"%{p1}%"), Utilisateur.nom.ilike(f"%{p2}%")),
                                    and_(Utilisateur.prenom.ilike(f"%{p2}%"), Utilisateur.nom.ilike(f"%{p1}%"))
                                )
                            )
                        else:
                            student_query = student_query.filter(
                                or_(
                                    Utilisateur.nom.ilike(f"%{search_query}%"),
                                    Utilisateur.prenom.ilike(f"%{search_query}%"),
                                    Utilisateur.email.ilike(f"%{search_query}%")
                                )
                            )
                    
                    students = student_query.all()
                    if not students:
                        return {"message": f"Aucun étudiant trouvé correspondant à '{search_query}'."}
                    
                    target_student = students[0]

                    # Check permissions
                    if is_student and target_student.id != user.id:
                        return {"message": "Vous n'êtes pas autorisé à consulter l'emploi du temps d'un autre étudiant."}
                    elif is_teacher:
                        # Teacher can only query students in their taught groups
                        teacher_group_ids = [g[0] for g in db.query(distinct(EmploiDuTemps.groupe_id)).join(Matiere).filter(Matiere.enseignant_id == user.id).all()]
                        student_in_group = db.query(etudiants_groupes).filter(
                            etudiants_groupes.c.etudiant_id == target_student.id,
                            etudiants_groupes.c.groupe_id.in_(teacher_group_ids)
                        ).first() is not None
                        if not student_in_group:
                            return {"message": "Vous n'êtes autorisé à consulter l'emploi du temps que des étudiants inscrits dans vos cours."}
                    
                    items, total = EmploiDuTempsService.get_by_etudiant(db, target_student.id, 1, 100, jour_semaine)

                else:
                    return {"message": "Cible de l'emploi du temps non reconnue."}

                res_list = []
                # Order by weekday, then start time
                sorted_items = sorted(items, key=lambda x: (x.jour_semaine, x.heure_debut))
                for item in sorted_items:
                    res_list.append({
                        "jour": DAY_NAMES[item.jour_semaine],
                        "jour_index": item.jour_semaine,
                        "heure_debut": item.heure_debut.strftime("%H:%M"),
                        "heure_fin": item.heure_fin.strftime("%H:%M"),
                        "matiere": item.matiere.nom if item.matiere else f"Matière ID {item.matiere_id}",
                        "salle": item.salle.nom if item.salle else f"Salle ID {item.salle_id}",
                        "groupe": item.groupe.nom if item.groupe else f"Groupe ID {item.groupe_id}"
                    })
                return {"emploi_du_temps": res_list}

            elif name == "get_available_rooms":
                target_date = date.fromisoformat(args["date"])
                start_time = time.fromisoformat(args["heure_debut"])
                end_time = time.fromisoformat(args["heure_fin"])
                items, total = SalleService.check_availability(db, target_date, start_time, end_time, 1, 30)
                
                res_list = []
                for s in items:
                    res_list.append({
                        "id": s.id,
                        "nom": s.nom,
                        "capacite": s.capacite
                    })
                return {
                    "date": args["date"],
                    "heure_debut": args["heure_debut"],
                    "heure_fin": args["heure_fin"],
                    "salles_disponibles": res_list,
                    "total": total
                }

        except Exception as e:
            return {"error": str(e)}

        return {"error": f"Outil '{name}' non reconnu ou non géré."}

    @staticmethod
    def validate_action_tool(db: Session, user: Utilisateur, name: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """
        Validates arguments for action tools.
        If valid, returns a confirmation payload:
            { "type": "confirmation", "action": name, "params": {...}, "message": "Confirmation text" }
        If invalid, returns a plain text payload:
            { "type": "text", "content": "Error message explaining why the action is invalid" }
        """
        try:
            # ── Profile Update (all roles) ──────────────────────────────────────
            if name == "update_my_profile":
                nom = args.get("nom")
                prenom = args.get("prenom")
                email = args.get("email")
                mot_de_passe = args.get("mot_de_passe")

                if not any([nom, prenom, email, mot_de_passe]):
                    return {
                        "type": "text",
                        "content": "Veuillez préciser au moins un champ à modifier : nom, prénom, email ou mot de passe."
                    }

                # Build summary of what will change
                changes = []
                if nom:
                    changes.append(f"Nom : **{nom}**")
                if prenom:
                    changes.append(f"Prénom : **{prenom}**")
                if email:
                    # Simple email format check
                    if "@" not in email or "." not in email:
                        return {"type": "text", "content": "L'adresse email fournie semble invalide. Veuillez vérifier."}
                    changes.append(f"Email : **{email}**")
                if mot_de_passe:
                    if len(mot_de_passe) < 6:
                        return {"type": "text", "content": "Le mot de passe doit comporter au minimum 6 caractères."}
                    changes.append("Mot de passe : **••••••** (nouveau)")

                changes_text = "\n".join([f"- {c}" for c in changes])
                params = {}
                if nom: params["nom"] = nom
                if prenom: params["prenom"] = prenom
                if email: params["email"] = email
                if mot_de_passe: params["mot_de_passe"] = mot_de_passe

                return {
                    "type": "confirmation",
                    "content": f"Confirmez-vous la mise à jour de votre profil avec les informations suivantes ?\n{changes_text}",
                    "action_data": {
                        "action": "update_my_profile",
                        "params": params
                    }
                }

            # ── Cancel Rattrapage (teacher = own, admin = any) ──────────────────
            elif name == "annuler_rattrapage":
                rattrapage_id = int(args["rattrapage_id"])
                is_admin = user.role in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]
                is_teacher = user.role == RoleUtilisateur.ENSEIGNANT

                if not is_admin and not is_teacher:
                    return {"type": "text", "content": "Seuls les enseignants et les administrateurs peuvent annuler un rattrapage."}

                rattrapage = db.query(Rattrapage).options(
                    joinedload(Rattrapage.absence).joinedload(Absence.matiere),
                    joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
                    joinedload(Rattrapage.salle)
                ).filter(Rattrapage.id == rattrapage_id).first()

                if not rattrapage:
                    return {"type": "text", "content": f"Aucun rattrapage trouvé avec l'ID {rattrapage_id}."}

                # Teacher can only cancel their own
                if is_teacher and rattrapage.absence.enseignant_id != user.id:
                    return {"type": "text", "content": "Vous ne pouvez annuler que vos propres rattrapages."}

                if rattrapage.statut == StatutRattrapage.ANNULE:
                    return {"type": "text", "content": f"Le rattrapage ID {rattrapage_id} est déjà annulé."}

                matiere_nom = rattrapage.absence.matiere.nom if rattrapage.absence and rattrapage.absence.matiere else "?"
                date_fr = rattrapage.date_proposee.strftime("%d/%m/%Y")
                salle_nom = rattrapage.salle.nom if rattrapage.salle else "?"

                return {
                    "type": "confirmation",
                    "content": f"Confirmez-vous l'annulation du rattrapage de **{matiere_nom}** prévu le **{date_fr}** en salle **{salle_nom}** (ID {rattrapage_id}) ?",
                    "action_data": {
                        "action": "annuler_rattrapage",
                        "params": {"rattrapage_id": rattrapage_id}
                    }
                }

            # ── Validate Absence (admin only) ───────────────────────────────────
            elif name == "valider_absence":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"type": "text", "content": "Seuls les administrateurs peuvent valider une absence."}

                absence_id = int(args["absence_id"])
                absence = db.query(Absence).options(
                    joinedload(Absence.enseignant),
                    joinedload(Absence.matiere)
                ).filter(Absence.id == absence_id).first()

                if not absence:
                    return {"type": "text", "content": f"Aucune absence trouvée avec l'ID {absence_id}."}

                if absence.statut == StatutAbsence.VALIDE:
                    return {"type": "text", "content": f"L'absence ID {absence_id} est déjà validée."}

                if absence.statut == StatutAbsence.REJETE:
                    return {"type": "text", "content": f"L'absence ID {absence_id} a été rejetée, elle ne peut plus être validée."}

                enseignant_nom = f"{absence.enseignant.prenom} {absence.enseignant.nom}" if absence.enseignant else "?"
                matiere_nom = absence.matiere.nom if absence.matiere else "?"
                date_fr = absence.date_absence.strftime("%d/%m/%Y")

                return {
                    "type": "confirmation",
                    "content": f"Confirmez-vous la **validation** de l'absence de **{enseignant_nom}** pour le cours de **{matiere_nom}** le **{date_fr}** (ID {absence_id}) ?",
                    "action_data": {
                        "action": "valider_absence",
                        "params": {"absence_id": absence_id}
                    }
                }

            # ── Reject Absence (admin only) ─────────────────────────────────────
            elif name == "rejeter_absence":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"type": "text", "content": "Seuls les administrateurs peuvent rejeter une absence."}

                absence_id = int(args["absence_id"])
                absence = db.query(Absence).options(
                    joinedload(Absence.enseignant),
                    joinedload(Absence.matiere)
                ).filter(Absence.id == absence_id).first()

                if not absence:
                    return {"type": "text", "content": f"Aucune absence trouvée avec l'ID {absence_id}."}

                if absence.statut == StatutAbsence.REJETE:
                    return {"type": "text", "content": f"L'absence ID {absence_id} est déjà rejetée."}

                enseignant_nom = f"{absence.enseignant.prenom} {absence.enseignant.nom}" if absence.enseignant else "?"
                matiere_nom = absence.matiere.nom if absence.matiere else "?"
                date_fr = absence.date_absence.strftime("%d/%m/%Y")

                return {
                    "type": "confirmation",
                    "content": f"Confirmez-vous le **rejet** de l'absence de **{enseignant_nom}** pour le cours de **{matiere_nom}** le **{date_fr}** (ID {absence_id}) ?",
                    "action_data": {
                        "action": "rejeter_absence",
                        "params": {"absence_id": absence_id}
                    }
                }

            # ── Validate Rattrapage (admin only) ────────────────────────────────
            elif name == "valider_rattrapage":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"type": "text", "content": "Seuls les administrateurs peuvent valider un rattrapage."}

                rattrapage_id = int(args["rattrapage_id"])
                rattrapage = db.query(Rattrapage).options(
                    joinedload(Rattrapage.absence).joinedload(Absence.enseignant),
                    joinedload(Rattrapage.absence).joinedload(Absence.matiere),
                    joinedload(Rattrapage.salle)
                ).filter(Rattrapage.id == rattrapage_id).first()

                if not rattrapage:
                    return {"type": "text", "content": f"Aucun rattrapage trouvé avec l'ID {rattrapage_id}."}

                if rattrapage.statut == StatutRattrapage.VALIDE:
                    return {"type": "text", "content": f"Le rattrapage ID {rattrapage_id} est déjà validé."}

                if rattrapage.statut == StatutRattrapage.ANNULE:
                    return {"type": "text", "content": f"Le rattrapage ID {rattrapage_id} est annulé, il ne peut pas être validé."}

                enseignant_nom = f"{rattrapage.absence.enseignant.prenom} {rattrapage.absence.enseignant.nom}" if rattrapage.absence and rattrapage.absence.enseignant else "?"
                matiere_nom = rattrapage.absence.matiere.nom if rattrapage.absence and rattrapage.absence.matiere else "?"
                date_fr = rattrapage.date_proposee.strftime("%d/%m/%Y")
                heure_debut = rattrapage.heure_debut.strftime("%H:%M")
                heure_fin = rattrapage.heure_fin.strftime("%H:%M")
                salle_nom = rattrapage.salle.nom if rattrapage.salle else "?"

                return {
                    "type": "confirmation",
                    "content": (
                        f"Confirmez-vous la **validation** du rattrapage de **{enseignant_nom}** "
                        f"pour **{matiere_nom}** prévu le **{date_fr}** de **{heure_debut}** à **{heure_fin}** "
                        f"en salle **{salle_nom}** (ID {rattrapage_id}) ?"
                    ),
                    "action_data": {
                        "action": "valider_rattrapage",
                        "params": {"rattrapage_id": rattrapage_id}
                    }
                }

            # ── Enseignant-only actions ──────────────────────────────────────────
            elif name == "declare_absence":
                matiere_nom = args["matiere_nom"]
                date_absence_str = args["date"]
                motif = args["motif"]

                # Find the teacher's matiere
                matiere = db.query(Matiere).filter(
                    Matiere.enseignant_id == user.id,
                    Matiere.nom.ilike(f"%{matiere_nom}%")
                ).first()

                if not matiere:
                    # Let's search all classes taught by teacher to give suggestions
                    teacher_matieres = db.query(Matiere).filter(Matiere.enseignant_id == user.id).all()
                    suggestions = ", ".join([m.nom for m in teacher_matieres])
                    return {
                        "type": "text",
                        "content": f"Je n'ai pas trouvé de matière correspondant à '{matiere_nom}'. Vos matières enregistrées sont : {suggestions or 'Aucune'}. Veuillez préciser."
                    }

                date_absence = date.fromisoformat(date_absence_str)
                # Validation checks similar to Service:
                # 1. Past date check
                if date_absence < date.today():
                    return {
                        "type": "text",
                        "content": f"Vous ne pouvez pas déclarer d'absence pour une date passée ({date_absence_str})."
                    }

                # 2. Weekday course check
                day_index = date_absence.weekday()
                has_course = db.query(EmploiDuTemps).filter(
                    EmploiDuTemps.matiere_id == matiere.id,
                    EmploiDuTemps.jour_semaine == day_index
                ).first() is not None

                if not has_course:
                    return {
                        "type": "text",
                        "content": f"Vous n'avez aucun cours d'enregistré le {DAY_NAMES[day_index]} pour la matière '{matiere.nom}'. Vous ne pouvez donc pas déclarer d'absence pour ce jour."
                    }

                # 3. Duplicate check
                existing = db.query(Absence).filter(
                    Absence.enseignant_id == user.id,
                    Absence.matiere_id == matiere.id,
                    Absence.date_absence == date_absence,
                    Absence.statut != StatutAbsence.REJETE
                ).first()
                if existing:
                    return {
                        "type": "text",
                        "content": f"Vous avez déjà une absence déclarée pour '{matiere.nom}' le {date_absence_str}."
                    }

                # If all checks pass, request confirmation
                date_french = date_absence.strftime("%d/%m/%Y")
                return {
                    "type": "confirmation",
                    "content": f"Confirmez-vous la déclaration d'absence pour le cours de **{matiere.nom}** le **{date_french}** pour le motif suivant : *{motif}* ?",
                    "action_data": {
                        "action": "declare_absence",
                        "params": {
                            "matiere_id": matiere.id,
                            "date_absence": date_absence_str,
                            "motif": motif
                        }
                    }
                }

            elif name == "propose_rattrapage":
                date_proposee_str = args["date_proposee"]
                heure_debut_str = args["heure_debut"]
                heure_fin_str = args["heure_fin"]
                salle_nom = args["salle_nom"]
                absence_id = args.get("absence_id")

                # Resolve Salle
                salle = db.query(Salle).filter(Salle.nom.ilike(f"%{salle_nom}%")).first()
                if not salle:
                    return {
                        "type": "text",
                        "content": f"La salle '{salle_nom}' n'existe pas. Veuillez utiliser une salle valide."
                    }

                # Resolve Absence
                absence = None
                if absence_id:
                    absence = db.query(Absence).filter(
                        Absence.id == int(absence_id),
                        Absence.enseignant_id == user.id
                    ).first()
                else:
                    # Guess by date_absence and matiere_nom
                    date_absence_str = args.get("date_absence")
                    matiere_nom = args.get("matiere_nom")
                    
                    query = db.query(Absence).options(joinedload(Absence.matiere)).filter(
                        Absence.enseignant_id == user.id,
                        Absence.statut == StatutAbsence.VALIDE
                    )
                    if date_absence_str:
                        query = query.filter(Absence.date_absence == date.fromisoformat(date_absence_str))
                    if matiere_nom:
                        query = query.join(Matiere).filter(Matiere.nom.ilike(f"%{matiere_nom}%"))
                        
                    absences = query.all()
                    if not absences:
                        return {
                            "type": "text",
                            "content": "Je n'ai trouvé aucune absence validée correspondante pour planifier un rattrapage. Les rattrapages ne peuvent être programmés que pour des absences déjà validées par l'administration."
                        }
                    elif len(absences) > 1:
                        # List options for user
                        options_text = "\n".join([f"- ID {ab.id} : {ab.matiere.nom} du {ab.date_absence.strftime('%d/%m/%Y')}" for ab in absences])
                        return {
                            "type": "text",
                            "content": f"J'ai trouvé plusieurs absences validées. Laquelle souhaitez-vous rattraper ? Veuillez spécifier l'ID ou la date exacte :\n{options_text}"
                        }
                    else:
                        absence = absences[0]

                if not absence:
                    return {
                        "type": "text",
                        "content": "Absence introuvable ou vous n'en êtes pas le propriétaire."
                    }

                if absence.statut != StatutAbsence.VALIDE:
                    return {
                        "type": "text",
                        "content": f"L'absence du {absence.date_absence.strftime('%d/%m/%Y')} (ID {absence.id}) doit d'abord être validée par l'administration avant de pouvoir proposer un rattrapage."
                    }

                # Parse times
                date_proposee = date.fromisoformat(date_proposee_str)
                heure_debut = time.fromisoformat(heure_debut_str)
                heure_fin = time.fromisoformat(heure_fin_str)

                # Validation checks
                if heure_debut >= heure_fin:
                    return {
                        "type": "text",
                        "content": "L'heure de début doit être strictement antérieure à l'heure de fin."
                    }

                if date_proposee <= absence.date_absence:
                    return {
                        "type": "text",
                        "content": f"La date du rattrapage ({date_proposee_str}) doit être postérieure à la date de l'absence ({absence.date_absence.isoformat()})."
                    }

                # Check for existing scheduled rattrapage for this absence
                existing = db.query(Rattrapage).filter(
                    Rattrapage.absence_id == absence.id,
                    Rattrapage.statut != StatutRattrapage.ANNULE
                ).first()
                if existing:
                    return {
                        "type": "text",
                        "content": f"Un rattrapage est déjà en cours ou planifié pour cette absence (ID {absence.id})."
                    }

                # Conflict checks
                conflict_msg = RattrapageService.check_conflicts(
                    db, salle.id, user.id, date_proposee, heure_debut, heure_fin
                )
                if conflict_msg:
                    return {
                        "type": "text",
                        "content": f"Conflit de planification détecté : {conflict_msg}."
                    }

                # All clean, prompt confirmation
                return {
                    "type": "confirmation",
                    "content": (
                        f"Confirmez-vous la proposition de rattrapage pour l'absence du **{absence.date_absence.strftime('%d/%m/%Y')}** "
                        f"({absence.matiere.nom}) ?\n"
                        f"Détails proposés : Le **{date_proposee.strftime('%d/%m/%Y')}** de **{heure_debut_str}** à **{heure_fin_str}** "
                        f"en salle **{salle.nom}**."
                    ),
                    "action_data": {
                        "action": "propose_rattrapage",
                        "params": {
                            "absence_id": absence.id,
                            "date_proposee": date_proposee_str,
                            "heure_debut": heure_debut_str,
                            "heure_fin": heure_fin_str,
                            "salle_id": salle.id
                        }
                    }
                }

        except Exception as e:
            return {
                "type": "text",
                "content": f"Une erreur s'est produite lors de la validation : {str(e)}"
            }

        return {
            "type": "text",
            "content": f"Action '{name}' non gérée."
        }

    @staticmethod
    def execute_confirmed_action(db: Session, user: Utilisateur, action: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Executes a write/action database transaction once the user confirms from the UI.
        """
        from app.services.utilisateur_service import UtilisateurService
        from app.schemas.utilisateur import UtilisateurUpdate

        try:
            # ── Profile update (all roles) ──────────────────────────────────────
            if action == "update_my_profile":
                update_data = UtilisateurUpdate(**{k: v for k, v in params.items() if v is not None})
                updated = UtilisateurService.update(db, user.id, update_data)
                if not updated:
                    return {"success": False, "message": "Utilisateur non trouvé."}
                return {
                    "success": True,
                    "message": "Votre profil a été mis à jour avec succès ! Les changements sont effectifs immédiatement."
                }

            # ── Declare absence (teacher only) ──────────────────────────────────
            elif action == "declare_absence":
                if user.role != RoleUtilisateur.ENSEIGNANT:
                    return {"success": False, "message": "Seuls les enseignants peuvent déclarer une absence."}
                matiere_id = params["matiere_id"]
                date_absence = date.fromisoformat(params["date_absence"])
                motif = params["motif"]
                justificatif_path = params.get("justificatif_path")

                AbsenceService.declare_absence(
                    db=db,
                    enseignant_id=user.id,
                    matiere_id=matiere_id,
                    date_absence=date_absence,
                    motif=motif,
                    justificatif_path=justificatif_path
                )
                return {
                    "success": True,
                    "message": f"✅ Votre absence pour le cours du {date_absence.strftime('%d/%m/%Y')} a été déclarée avec succès et est **en attente de validation** par l'administration."
                }

            # ── Propose rattrapage (teacher only) ───────────────────────────────
            elif action == "propose_rattrapage":
                if user.role != RoleUtilisateur.ENSEIGNANT:
                    return {"success": False, "message": "Seuls les enseignants peuvent proposer un rattrapage."}
                data_in = RattrapageCreate(
                    absence_id=params["absence_id"],
                    date_proposee=date.fromisoformat(params["date_proposee"]),
                    heure_debut=time.fromisoformat(params["heure_debut"]),
                    heure_fin=time.fromisoformat(params["heure_fin"]),
                    salle_id=params["salle_id"]
                )
                RattrapageService.create(db=db, data=data_in, current_user_id=user.id)
                return {
                    "success": True,
                    "message": f"✅ Le rattrapage a été **proposé avec succès** pour le {data_in.date_proposee.strftime('%d/%m/%Y')} et est en attente de validation."
                }

            # ── Cancel rattrapage (teacher = own, admin = any) ──────────────────
            elif action == "annuler_rattrapage":
                rattrapage_id = int(params["rattrapage_id"])
                RattrapageService.annuler(db, rattrapage_id, user.id, user.role)
                return {
                    "success": True,
                    "message": f"✅ Le rattrapage ID {rattrapage_id} a été **annulé avec succès**."
                }

            # ── Validate absence (admin only) ────────────────────────────────────
            elif action == "valider_absence":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"success": False, "message": "Seuls les administrateurs peuvent valider une absence."}
                absence_id = int(params["absence_id"])
                AbsenceService.set_statut(db, absence_id, StatutAbsence.VALIDE)
                return {
                    "success": True,
                    "message": f"✅ L'absence ID {absence_id} a été **validée avec succès**. L'enseignant a été notifié."
                }

            # ── Reject absence (admin only) ──────────────────────────────────────
            elif action == "rejeter_absence":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"success": False, "message": "Seuls les administrateurs peuvent rejeter une absence."}
                absence_id = int(params["absence_id"])
                AbsenceService.set_statut(db, absence_id, StatutAbsence.REJETE)
                return {
                    "success": True,
                    "message": f"✅ L'absence ID {absence_id} a été **rejetée**. L'enseignant a été notifié."
                }

            # ── Validate rattrapage (admin only) ─────────────────────────────────
            elif action == "valider_rattrapage":
                if user.role not in [RoleUtilisateur.ADMIN_SYSTEME, RoleUtilisateur.ADMINISTRATION]:
                    return {"success": False, "message": "Seuls les administrateurs peuvent valider un rattrapage."}
                rattrapage_id = int(params["rattrapage_id"])
                RattrapageService.validate(db, rattrapage_id, user.id)
                return {
                    "success": True,
                    "message": f"✅ Le rattrapage ID {rattrapage_id} a été **validé avec succès**. L'enseignant et les étudiants concernés ont été notifiés."
                }

        except Exception as e:
            db.rollback()
            return {"success": False, "message": f"Erreur lors de l'exécution : {str(e)}"}

        return {"success": False, "message": f"Action '{action}' inconnue."}

    @staticmethod
    def process_message(db: Session, user: Utilisateur, message: str, history: List[Dict[str, str]] = []) -> Dict[str, Any]:
        """
        Runs the conversational AI workflow:
        1. Formulates Groq query with tool declarations.
        2. If Groq decides to call a read-only tool, queries the DB, feeds the details back to Groq, and replies.
        3. If Groq decides to call an action tool, runs pre-validation and returns a confirmation state.
        4. Otherwise, returns a direct natural language response.
        """
        if not client:
            return {
                "type": "text",
                "content": "L'assistant IA n'est pas configuré. Veuillez définir la clé d'API GROQ_API_KEY dans votre fichier .env."
            }

        # Build message history
        messages = [{"role": "system", "content": ChatbotService.get_system_prompt(user)}]
        
        # Add limited chat history
        for h in history[-10:]:
            messages.append({"role": h["role"], "content": h["content"]})
            
        messages.append({"role": "user", "content": message})

        # Step 1: Call Groq with tool calling
        try:
            response = client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=messages,
                tools=TOOLS,
                tool_choice="auto",
                temperature=0.0
            )
        except Exception as e:
            return {
                "type": "text",
                "content": f"Erreur de communication avec Groq API : {str(e)}"
            }

        response_message = response.choices[0].message
        tool_calls = response_message.tool_calls

        if tool_calls:
            # We assume one tool call at a time for simpler flow
            tool_call = tool_calls[0]
            name = tool_call.function.name
            args = json.loads(tool_call.function.arguments)

            # Check if it is an action or a query
            ACTION_TOOLS = [
                "declare_absence", "propose_rattrapage",
                "update_my_profile", "annuler_rattrapage",
                "valider_absence", "rejeter_absence", "valider_rattrapage"
            ]
            if name in ACTION_TOOLS:
                # Action -> returns validation / confirmation request
                return ChatbotService.validate_action_tool(db, user, name, args)
            else:
                # Query -> executes, feeds results back to Groq, and returns final natural response
                query_result = ChatbotService.execute_query_tool(db, user, name, args)
                
                # Append tool call and result to messages
                messages.append(response_message)
                messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "name": name,
                    "content": json.dumps(query_result)
                })

                # Let Groq synthesize response
                try:
                    final_response = client.chat.completions.create(
                        model="llama-3.3-70b-versatile",
                        messages=messages
                    )
                    return {
                        "type": "text",
                        "content": final_response.choices[0].message.content
                    }
                except Exception as e:
                    return {
                        "type": "text",
                        "content": f"Erreur lors de la mise en forme de la réponse : {str(e)}"
                    }
        else:
            # Plain message response
            return {
                "type": "text",
                "content": response_message.content
            }
