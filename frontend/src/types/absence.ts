import { MatiereResponse } from "./matiere";
import { UtilisateurResponse } from "./user";

export type StatutAbsence = "en_attente" | "valide" | "rejete";

export interface Absence {
  id: number;
  enseignant_id: number;
  matiere_id: number;
  date_absence: string;
  motif: string;
  justificatif: string | null;
  statut: StatutAbsence;
  created_at: string;
  updated_at: string;
}

export interface AbsenceResponse extends Absence {
  enseignant?: {
    id: number;
    nom: string;
    prenom: string;
    email: string;
  } & Partial<UtilisateurResponse>;
  matiere?: MatiereResponse;
}

export interface CreateAbsencePayload {
  matiere_id: number;
  date_absence: string;
  motif: string;
  justificatif?: File;
}

export interface UpdateAbsencePayload {
  matiere_id?: number;
  date_absence?: string;
  motif?: string;
  justificatif?: File;
}
