"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  getNotifications, 
  markAsRead as apiMarkAsRead, 
  markAllAsRead as apiMarkAllAsRead,
  deleteNotification as apiDeleteNotification 
} from "@/lib/api/notifications";
import { NotificationResponse } from "@/types/notification";
import { toast } from "sonner";

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    try {
      const data = await getNotifications(1, 5, true);
      setNotifications(data.items);
      setUnreadCount(data.total);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const handleRefresh = () => fetchNotifications();
    window.addEventListener("refresh-notifications", handleRefresh);
    const interval = setInterval(fetchNotifications, 30000);
    return () => {
      window.removeEventListener("refresh-notifications", handleRefresh);
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  const markAsRead = async (id: number) => {
    try {
      await apiMarkAsRead(id);
      await fetchNotifications();
      toast.success("Notification marquée comme lue");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const markAllAsRead = async () => {
    try {
      await apiMarkAllAsRead();
      await fetchNotifications();
      toast.success("Toutes les notifications marquées comme lues");
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await apiDeleteNotification(id);
      await fetchNotifications();
      toast.success("Notification supprimée");
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    refresh: fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  };
}
