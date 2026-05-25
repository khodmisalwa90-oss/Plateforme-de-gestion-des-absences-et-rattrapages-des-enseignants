import { fetchWithAuth } from "../api";
import { 
  PaginatedUserResponse, 
  UtilisateurResponse, 
  CreateUserPayload, 
  UpdateUserPayload 
} from "@/types/user";

const BASE_URL = "/users";

export async function getUsers(
  page = 1, 
  perPage = 20, 
  filters?: { role?: string; actif?: boolean; search?: string }
): Promise<PaginatedUserResponse> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });

  if (filters?.role && filters.role !== "all") {
    params.append("role", filters.role);
  }
  
  if (filters?.actif !== undefined) {
    params.append("actif", filters.actif.toString());
  }
  
  if (filters?.search) {
    params.append("search", filters.search);
  }

  return fetchWithAuth<PaginatedUserResponse>(`${BASE_URL}/?${params.toString()}`);
}

export async function createUser(data: CreateUserPayload): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getUserById(id: number): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/${id}`);
}

export async function updateUser(id: number, data: UpdateUserPayload): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteUser(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}

export async function activateUser(id: number): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/${id}/activer`, {
    method: "PUT",
  });
}

export async function deactivateUser(id: number): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/${id}/desactiver`, {
    method: "PUT",
  });
}
