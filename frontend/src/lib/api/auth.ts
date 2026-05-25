import { fetchWithAuth } from "../api";
import { UtilisateurResponse } from "@/types/user";
import { UpdateProfileRequest } from "@/types/auth";

const BASE_URL = "/auth";

export async function updateProfile(data: UpdateProfileRequest): Promise<UtilisateurResponse> {
  return fetchWithAuth<UtilisateurResponse>(`${BASE_URL}/me`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}
