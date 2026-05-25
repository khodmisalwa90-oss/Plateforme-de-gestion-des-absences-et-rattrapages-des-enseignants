export interface Salle {
  id: number;
  nom: string;
  capacite: number;
  created_at: string;
  updated_at: string;
}

export interface SalleResponse extends Salle {}

export interface CreateSallePayload {
  nom: string;
  capacite: number;
}

export interface UpdateSallePayload {
  nom?: string;
  capacite?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
