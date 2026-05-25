import { fetchWithAuth } from "../api";
import { PaginatedResponse, DepartementResponse, CreateDepartementPayload, UpdateDepartementPayload } from "@/types/departement";

const BASE_URL = "/departements";

export async function getDepartements(page = 1, perPage = 20, search?: string) {
  const params = new URLSearchParams({
    page: page.toString(),
    per_page: perPage.toString(),
    ...(search && { search }),
  });
  return fetchWithAuth<PaginatedResponse<DepartementResponse>>(`${BASE_URL}/?${params}`);
}

export async function createDepartement(data: CreateDepartementPayload) {
  return fetchWithAuth<DepartementResponse>(BASE_URL, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateDepartement(id: number, data: UpdateDepartementPayload) {
  return fetchWithAuth<DepartementResponse>(`${BASE_URL}/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteDepartement(id: number) {
  return fetchWithAuth(`${BASE_URL}/${id}`, { method: "DELETE" });
}
