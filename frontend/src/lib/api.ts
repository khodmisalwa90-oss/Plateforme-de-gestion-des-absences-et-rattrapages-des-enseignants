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

    let errorMessage = "Une erreur est survenue";
    if (Array.isArray(errorData.detail)) {
      errorMessage = errorData.detail
        .map((e: any) => {
          const field = Array.isArray(e.loc) ? e.loc[e.loc.length - 1] : null;
          return field ? `${field}: ${e.msg}` : e.msg;
        })
        .join(" | ");
    } else if (typeof errorData.detail === "string") {
      errorMessage = errorData.detail;
    } else if (typeof errorData.detail === "object" && errorData.detail !== null) {
      errorMessage = errorData.detail.message || JSON.stringify(errorData.detail);
    } else if (typeof errorData.message === "string") {
      errorMessage = errorData.message;
    }

    const error = new Error(errorMessage);
    (error as any).response = errorData;
    throw error;
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json();
}
