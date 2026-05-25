import { GroupeResponse } from './groupe';
import { MatiereResponse } from './matiere';
import { SalleResponse } from './salle';

export interface EmploiDuTemps {
  id: number;
  groupe_id: number;
  matiere_id: number;
  salle_id: number;
  jour_semaine: number; // 0 = Lundi, 1 = Mardi, ..., 6 = Dimanche
  heure_debut: string; // "HH:MM:SS" or "HH:MM"
  heure_fin: string; // "HH:MM:SS" or "HH:MM"
  rattrapage_id?: number | null;
  created_at: string;
  updated_at: string;
}

export interface EmploiDuTempsResponse extends EmploiDuTemps {
  groupe?: GroupeResponse;
  matiere?: MatiereResponse;
  salle?: SalleResponse;
}

export interface CreateEmploiDuTempsPayload {
  groupe_id: number;
  matiere_id: number;
  salle_id: number;
  jour_semaine: number;
  heure_debut: string;
  heure_fin: string;
}

export interface UpdateEmploiDuTempsPayload {
  groupe_id?: number;
  matiere_id?: number;
  salle_id?: number;
  jour_semaine?: number;
  heure_debut?: string;
  heure_fin?: string;
}
