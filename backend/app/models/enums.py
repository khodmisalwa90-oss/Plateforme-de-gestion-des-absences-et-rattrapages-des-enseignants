import enum

class RoleUtilisateur(str, enum.Enum):
    ADMIN_SYSTEME = "admin_systeme"
    ADMINISTRATION = "administration"
    ENSEIGNANT = "enseignant"
    ETUDIANT = "etudiant"

class StatutAbsence(str, enum.Enum):
    EN_ATTENTE = "en_attente"
    VALIDE = "valide"
    REJETE = "rejete"

class StatutRattrapage(str, enum.Enum):
    PROPOSE = "propose"
    VALIDE = "valide"
    ANNULE = "annule"
