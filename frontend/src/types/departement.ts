export interface Departement {
  id: number;
  nom: string;
  created_at: string;
  updated_at: string;
}

export interface DepartementResponse extends Departement {}

export interface CreateDepartementPayload {
  nom: string;
}

export interface UpdateDepartementPayload {
  nom?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}
