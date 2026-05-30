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

export async function forgotPassword(email: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`${BASE_URL}/forgot-password`, {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function verifyResetToken(token: string): Promise<{ status: string; email: string }> {
  return fetchWithAuth<{ status: string; email: string }>(`${BASE_URL}/verify-reset-token?token=${encodeURIComponent(token)}`, {
    method: "GET",
  });
}

export async function resetPassword(token: string, nouveauMotDePasse: string): Promise<{ message: string }> {
  return fetchWithAuth<{ message: string }>(`${BASE_URL}/reset-password`, {
    method: "POST",
    body: JSON.stringify({ token, nouveau_mot_de_passe: nouveauMotDePasse }),
  });
}
