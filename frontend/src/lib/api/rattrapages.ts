import { fetchWithAuth } from "../api";
import { PaginatedResponse } from "@/types/salle";
import { RattrapageResponse, CreateRattrapagePayload } from "@/types/rattrapage";

const BASE_URL = "/rattrapages";

export async function getRattrapages(
  page = 1,
  perPage = 20,
  filters?: { statut?: string; absence_id?: number; date_from?: string; date_to?: string }
): Promise<PaginatedResponse<RattrapageResponse>> {
  const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
  if (filters?.statut) params.append("statut", filters.statut);
  if (filters?.absence_id) params.append("absence_id", filters.absence_id.toString());
  if (filters?.date_from) params.append("date_from", filters.date_from);
  if (filters?.date_to) params.append("date_to", filters.date_to);

  return fetchWithAuth<PaginatedResponse<RattrapageResponse>>(`${BASE_URL}/?${params}`);
}

export async function getUpcomingRattrapages(
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<RattrapageResponse>> {
  const params = new URLSearchParams({ page: page.toString(), per_page: perPage.toString() });
  return fetchWithAuth<PaginatedResponse<RattrapageResponse>>(`${BASE_URL}/a-venir?${params}`);
}

export async function getRattrapageById(id: number): Promise<RattrapageResponse> {
  return fetchWithAuth<RattrapageResponse>(`${BASE_URL}/${id}`);
}

export async function createRattrapage(data: CreateRattrapagePayload): Promise<RattrapageResponse> {
  return fetchWithAuth<RattrapageResponse>(`${BASE_URL}/`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function validateRattrapage(id: number): Promise<RattrapageResponse> {
  return fetchWithAuth<RattrapageResponse>(`${BASE_URL}/${id}/valider`, {
    method: "PUT",
  });
}

export async function cancelRattrapage(id: number): Promise<RattrapageResponse> {
  return fetchWithAuth<RattrapageResponse>(`${BASE_URL}/${id}/annuler`, {
    method: "PUT",
  });
}

export async function changeRattrapageRoom(id: number, salle_id: number): Promise<RattrapageResponse> {
  return fetchWithAuth<RattrapageResponse>(`${BASE_URL}/${id}/affecter-salle`, {
    method: "PUT",
    body: JSON.stringify({ salle_id }),
  });
}

export async function deleteRattrapage(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}
