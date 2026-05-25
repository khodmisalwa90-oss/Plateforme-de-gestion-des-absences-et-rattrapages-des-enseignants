import { DepartementResponse } from './departement';
import { UtilisateurResponse } from './user';

export interface Matiere {
  id: number;
  nom: string;
  departement_id: number;
  enseignant_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface MatiereResponse extends Matiere {
  departement?: DepartementResponse;
  enseignant?: UtilisateurResponse;
}

export interface CreateMatierePayload {
  nom: string;
  departement_id: number;
  enseignant_id?: number | null;
}

export interface UpdateMatierePayload {
  nom?: string;
  departement_id?: number;
  enseignant_id?: number | null;
}
