import { fetchWithAuth } from "../api";
import { PaginatedResponse, GroupeResponse, CreateGroupePayload, UpdateGroupePayload, AddStudentsResponse } from "@/types/groupe";
import { UtilisateurResponse } from "@/types/user";

const BASE_URL = "/groupes";

export async function getGroupes(page = 1, perPage = 20, search?: string): Promise<PaginatedResponse<GroupeResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
  });
  return fetchWithAuth<PaginatedResponse<GroupeResponse>>(`${BASE_URL}/?${params}`);
}

export async function createGroupe(data: CreateGroupePayload): Promise<GroupeResponse> {
  return fetchWithAuth<GroupeResponse>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getGroupeById(id: number): Promise<GroupeResponse> {
  return fetchWithAuth<GroupeResponse>(`${BASE_URL}/${id}`);
}

export async function updateGroupe(id: number, data: UpdateGroupePayload): Promise<GroupeResponse> {
  return fetchWithAuth<GroupeResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteGroupe(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
}

export async function getGroupesByDepartement(departementId: number, page = 1, perPage = 20): Promise<PaginatedResponse<GroupeResponse>> {
  const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
  return fetchWithAuth<PaginatedResponse<GroupeResponse>>(`${BASE_URL}/departement/${departementId}?${params}`);
}

export async function addStudentsToGroup(groupeId: number, studentIds: number[]): Promise<AddStudentsResponse> {
  return fetchWithAuth<AddStudentsResponse>(`${BASE_URL}/${groupeId}/etudiants`, {
    method: "POST",
    body: JSON.stringify({ etudiants_ids: studentIds }),
  });
}

export async function removeStudentFromGroup(groupeId: number, studentId: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${groupeId}/etudiants/${studentId}`, { method: "DELETE" });
}

export async function getGroupStudents(groupeId: number, page = 1, perPage = 20): Promise<PaginatedResponse<UtilisateurResponse>> {
  const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
  return fetchWithAuth<PaginatedResponse<UtilisateurResponse>>(`${BASE_URL}/${groupeId}/etudiants?${params}`);
}
