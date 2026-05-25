export interface Utilisateur {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: 'admin_systeme' | 'administration' | 'enseignant' | 'etudiant';
  actif: boolean;
  created_at: string;
  updated_at: string;
}

export interface UtilisateurResponse extends Utilisateur {}

export interface PaginatedUserResponse {
  items: UtilisateurResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface CreateUserPayload {
  nom: string;
  prenom: string;
  email: string;
  role: Utilisateur['role'];
  mot_de_passe: string;
  actif?: boolean;
}

export interface UpdateUserPayload {
  nom?: string;
  prenom?: string;
  email?: string;
  mot_de_passe?: string;
  role?: Utilisateur['role'];
  actif?: boolean;
}
