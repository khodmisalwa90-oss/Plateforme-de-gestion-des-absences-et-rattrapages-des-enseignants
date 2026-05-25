export interface AdminStats {
  users: {
    total_enseignants: number;
    total_etudiants: number;
    total_administrations: number;
    total_users: number;
  };
  absences: {
    total_absences: number;
    absences_en_attente: number;
    absences_validees: number;
    absences_rejetees: number;
    absences_par_mois: Array<{ month: string, count: number }>;
  };
  rattrapages: {
    total_rattrapages: number;
    rattrapages_proposes: number;
    rattrapages_valides: number;
    rattrapages_annules: number;
    rattrapages_par_mois: Array<{ month: string, count: number }>;
  };
  salles_et_cours: {
    total_salles: number;
    total_matieres: number;
    total_groupes: number;
    total_cours_par_semaine: number;
  };
}

export interface TeacherStats {
  absences: {
    total_absences: number;
    absences_en_attente: number;
    absences_validees: number;
    absences_rejetees: number;
    absences_par_mois: Array<{ month: string, count: number }>;
  };
  rattrapages: {
    total_rattrapages: number;
    rattrapages_proposes: number;
    rattrapages_valides: number;
    rattrapages_annules: number;
    rattrapages_par_mois: Array<{ month: string, count: number }>;
  };
  cours: {
    total_cours_par_semaine: number;
    groupes_enseignes: string[];
  };
}

export interface StudentStats {
  cours: { 
    total_cours_par_semaine: number;
    matieres_suivies: string[];
    groupes_appartenance: string[];
  };
  absences_enseignants: { 
    total: number;
    en_attente: number;
    validees: number;
  };
  rattrapages: { 
    total: number;
    proposes: number;
    valides: number;
    a_venir: number;
  };
  list_rattrapages_a_venir: Array<{
    id: number;
    date: string;
    matiere: string;
    heure_debut: string;
    heure_fin: string;
    salle: string;
  }>;
}
