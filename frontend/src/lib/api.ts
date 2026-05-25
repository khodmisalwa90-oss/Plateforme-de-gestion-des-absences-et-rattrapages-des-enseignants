import { getSession, signOut } from "next-auth/react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export async function fetchWithAuth<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const session = await getSession();
  const token = (session as any)?.accessToken;

  const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;

  const headers = {
    ...(isFormData ? {} : { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      signOut({ callbackUrl: "/login" });
    }
    throw new Error("Session expirée, veuillez vous reconnecter.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = typeof errorData.detail === "object" && errorData.detail !== null
      ? errorData.detail.message
      : (errorData.detail || errorData.message || "Une erreur est survenue");
    
    const error = new Error(errorMessage);
    (error as any).response = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
