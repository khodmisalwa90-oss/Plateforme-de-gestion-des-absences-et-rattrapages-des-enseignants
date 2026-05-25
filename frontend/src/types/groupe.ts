import { UtilisateurResponse } from './user';
import { DepartementResponse } from './departement';

export interface Groupe {
  id: number;
  nom: string;
  departement_id: number;
  created_at: string;
  updated_at: string;
}

export interface GroupeResponse extends Groupe {
  departement?: DepartementResponse;
  etudiants?: UtilisateurResponse[];
}

export interface CreateGroupePayload {
  nom: string;
  departement_id: number;
}

export interface UpdateGroupePayload {
  nom?: string;
  departement_id?: number;
}

export interface AddStudentsPayload {
  etudiants_ids: number[];
}

export interface AddStudentsResponse {
  message: string;
  errors?: { student_id: number; reason: string }[];
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
