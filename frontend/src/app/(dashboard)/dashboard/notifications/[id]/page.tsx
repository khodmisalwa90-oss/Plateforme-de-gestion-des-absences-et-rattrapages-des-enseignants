"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getNotificationById, markAsRead } from "@/lib/api/notifications";
import { NotificationResponse } from "@/types/notification";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ArrowLeft, Calendar, Bell } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDate } from "@/utils/dateUtils";
import { toast } from "sonner";
import Link from "next/link";

export default function NotificationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [notification, setNotification] = useState<NotificationResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isNaN(id)) {
      router.push("/dashboard/notifications");
      return;
    }

    const fetchAndMarkAsRead = async () => {
      setIsLoading(true);
      try {
        const data = await getNotificationById(id);
        setNotification(data);
        if (!data.est_lu) {
          await markAsRead(id);
          window.dispatchEvent(new CustomEvent("refresh-notifications"));
        }
      } catch (error) {
        toast.error("Erreur lors du chargement de la notification");
        router.push("/dashboard/notifications");
      } finally {
        setIsLoading(false);
      }
    };

    fetchAndMarkAsRead();
  }, [id, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-3xl flex justify-center items-center min-h-[400px]">
        <LoadingSpinner className="h-8 w-8 text-primary" />
      </div>
    );
  }

  if (!notification) {
    return null;
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link href="/dashboard/notifications">
          <Button variant="ghost" className="pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour aux notifications
          </Button>
        </Link>
      </div>

      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
            <div className="flex items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                  {notification.titre}
                </h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>
                    {formatDate(notification.created_at, false)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="h-px bg-border w-full my-6" />

          <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
              {notification.message}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
