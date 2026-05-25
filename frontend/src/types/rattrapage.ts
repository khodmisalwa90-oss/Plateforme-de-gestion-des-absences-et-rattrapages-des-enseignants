import { Salle } from "./salle";

export type StatutRattrapage = "propose" | "valide" | "annule";

export interface Rattrapage {
  id: number;
  absence_id: number;
  salle_id: number;
  date_proposee: string;
  heure_debut: string;
  heure_fin: string;
  statut: StatutRattrapage;
  valide_par?: number | null;
  created_at: string;
  updated_at: string;
}

export interface RattrapageResponse extends Rattrapage {
  absence?: {
    id: number;
    enseignant_id: number;
    matiere_id: number;
    date_absence: string;
    motif: string;
    justificatif: string | null;
    statut: string;
    enseignant?: {
      id: number;
      nom: string;
      prenom: string;
      email: string;
    };
    matiere?: {
      id: number;
      nom: string;
      departement_id: number;
    };
  };
  salle?: Salle;
  validateur?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  } | null;
}

export interface CreateRattrapagePayload {
  absence_id: number;
  salle_id: number;
  date_proposee: string;
  heure_debut: string;
  heure_fin: string;
}

export interface UpdateSallePayload {
  salle_id: number;
}
