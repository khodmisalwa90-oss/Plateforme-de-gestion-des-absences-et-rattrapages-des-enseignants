import { fetchWithAuth } from "../api";
import { PaginatedResponse, SalleResponse, CreateSallePayload, UpdateSallePayload } from "@/types/salle";

const BASE_URL = "/salles";

export async function getSalles(page = 1, perPage = 20, search?: string): Promise<PaginatedResponse<SalleResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
  });
  return fetchWithAuth<PaginatedResponse<SalleResponse>>(`${BASE_URL}/?${params}`);
}

export async function getAvailableSalles(
  date: string, 
  heure_debut: string, 
  heure_fin: string, 
  page = 1, 
  perPage = 20
): Promise<PaginatedResponse<SalleResponse>> {
  const params = new URLSearchParams({
    date,
    heure_debut,
    heure_fin,
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return fetchWithAuth<PaginatedResponse<SalleResponse>>(`${BASE_URL}/disponibles?${params}`);
}

export async function getSalleById(id: number): Promise<SalleResponse> {
  return fetchWithAuth<SalleResponse>(`${BASE_URL}/${id}`);
}

export async function createSalle(data: CreateSallePayload): Promise<SalleResponse> {
  return fetchWithAuth<SalleResponse>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateSalle(id: number, data: UpdateSallePayload): Promise<SalleResponse> {
  return fetchWithAuth<SalleResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteSalle(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, { 
    method: "DELETE" 
  });
}
