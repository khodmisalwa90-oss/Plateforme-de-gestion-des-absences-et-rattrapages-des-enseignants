import { fetchWithAuth } from "../api";
import { PaginatedResponse } from "@/types/departement";
import { AbsenceResponse } from "@/types/absence";

const BASE_URL = "/absences";

export async function getAbsences(
  page = 1,
  perPage = 20,
  statut?: string,
  date_absence?: string
): Promise<PaginatedResponse<AbsenceResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(statut && { statut }),
    ...(date_absence && { date_absence }),
  });
  return fetchWithAuth<PaginatedResponse<AbsenceResponse>>(`${BASE_URL}/?${params}`);
}

export async function getPendingAbsences(
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<AbsenceResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return fetchWithAuth<PaginatedResponse<AbsenceResponse>>(`${BASE_URL}/en-attente?${params}`);
}

export async function getMyAbsenceHistory(
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<AbsenceResponse>> {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
  });
  return fetchWithAuth<PaginatedResponse<AbsenceResponse>>(`${BASE_URL}/historique?${params}`);
}

export async function getAbsenceById(id: number): Promise<AbsenceResponse> {
  return fetchWithAuth<AbsenceResponse>(`${BASE_URL}/${id}`);
}

export async function createAbsence(formData: FormData): Promise<AbsenceResponse> {
  return fetchWithAuth<AbsenceResponse>(`${BASE_URL}/`, {
    method: "POST",
    body: formData,
  });
}

export async function updateAbsence(id: number, formData: FormData): Promise<AbsenceResponse> {
  return fetchWithAuth<AbsenceResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: formData,
  });
}

export async function validateAbsence(id: number): Promise<AbsenceResponse> {
  return fetchWithAuth<AbsenceResponse>(`${BASE_URL}/${id}/valider`, {
    method: "PUT",
  });
}

export async function rejectAbsence(id: number): Promise<AbsenceResponse> {
  return fetchWithAuth<AbsenceResponse>(`${BASE_URL}/${id}/rejeter`, {
    method: "PUT",
  });
}

export async function deleteAbsence(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}
