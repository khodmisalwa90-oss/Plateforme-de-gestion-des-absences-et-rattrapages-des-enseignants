import { fetchWithAuth } from "../api";
import { NotificationResponse, PaginatedResponse } from "@/types/notification";

const BASE_URL = "/notifications";

export async function getNotifications(
  page: number = 1,
  perPage: number = 10,
  unreadOnly: boolean = false
): Promise<PaginatedResponse<NotificationResponse>> {
  const endpoint = unreadOnly ? `${BASE_URL}/non-lues` : `${BASE_URL}/`;
  const queryParams = new URLSearchParams({
    page: page.toString(),
    size: perPage.toString(),
  });

  return fetchWithAuth<PaginatedResponse<NotificationResponse>>(`${endpoint}?${queryParams}`);
}

export async function getNotificationById(id: number): Promise<NotificationResponse> {
  return fetchWithAuth<NotificationResponse>(`${BASE_URL}/${id}`);
}

export async function markAsRead(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}/lire`, {
    method: "PUT",
  });
}

export async function markAllAsRead(): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/tout-lire`, {
    method: "PUT",
  });
}

export async function deleteNotification(id: number): Promise<void> {
  return fetchWithAuth<void>(`${BASE_URL}/${id}`, {
    method: "DELETE",
  });
}
