import { fetchWithAuth } from "../api";
import { PaginatedResponse } from "@/types/departement";
import { MatiereResponse, CreateMatierePayload, UpdateMatierePayload } from "@/types/matiere";

const BASE_URL = "/matieres";

export async function getMatieres(page = 1, perPage = 20, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
  });
  return fetchWithAuth<PaginatedResponse<MatiereResponse>>(`${BASE_URL}/?${params}`);
}

export async function createMatiere(data: CreateMatierePayload) {
  return fetchWithAuth<MatiereResponse>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getMatiereById(id: number) {
  return fetchWithAuth<MatiereResponse>(`${BASE_URL}/${id}`);
}

export async function updateMatiere(id: number, data: UpdateMatierePayload) {
  return fetchWithAuth<MatiereResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteMatiere(id: number) {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, { method: "DELETE" });
}

export async function getMatieresByEnseignant(enseignantId: number, page = 1, perPage = 20) {
  const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
  return fetchWithAuth<PaginatedResponse<MatiereResponse>>(`${BASE_URL}/enseignant/${enseignantId}?${params}`);
}
