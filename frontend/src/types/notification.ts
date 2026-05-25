export interface NotificationResponse {
  id: number;
  titre: string;
  message: string;
  est_lu: boolean;
  created_at: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
