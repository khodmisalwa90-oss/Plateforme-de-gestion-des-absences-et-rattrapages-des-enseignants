"use client";

import React, { useState, useEffect, useCallback } from "react";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification 
} from "@/lib/api/notifications";
import { NotificationResponse, PaginatedResponse } from "@/types/notification";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatDate } from "@/utils/dateUtils";
import { Bell, Check, Trash2, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { useRouter } from "next/navigation";

export default function NotificationsPage() {
  const [data, setData] = useState<PaginatedResponse<NotificationResponse> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const perPage = 10;

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getNotifications(currentPage, perPage, activeTab === "unread");
      setData(res);
    } catch (error) {
      toast.error("Erreur lors du chargement des notifications");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
      toast.success("Notification marquée comme lue");
      fetchAll();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("Toutes les notifications marquées comme lues");
      fetchAll();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } catch (error) {
      toast.error("Erreur");
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteNotification(id);
      toast.success("Notification supprimée");
      fetchAll();
      window.dispatchEvent(new CustomEvent("refresh-notifications"));
    } catch (error) {
      toast.error("Erreur");
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos alertes et communications système.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchAll} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <Button variant="default" size="sm" onClick={handleMarkAllAsRead}>
            Tout marquer comme lu
          </Button>
        </div>
      </div>

      <Tabs defaultValue="all" className="w-full" onValueChange={(v) => {
        setActiveTab(v);
        setCurrentPage(1);
      }}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">Toutes</TabsTrigger>
          <TabsTrigger value="unread">Non lues</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <NotificationsTable 
            notifications={data?.items || []} 
            isLoading={isLoading} 
            onMarkRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </TabsContent>
        <TabsContent value="unread" className="space-y-4">
          <NotificationsTable 
            notifications={data?.items || []} 
            isLoading={isLoading} 
            onMarkRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        </TabsContent>
      </Tabs>

      {data && data.pages > 1 && (
        <div className="mt-8">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              
              {Array.from({ length: data.pages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink 
                    isActive={page === currentPage}
                    onClick={() => setCurrentPage(page)}
                    className="cursor-pointer"
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}

              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(p => Math.min(data.pages, p + 1))}
                  className={currentPage === data.pages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

function NotificationsTable({ 
  notifications, 
  isLoading, 
  onMarkRead, 
  onDelete 
}: { 
  notifications: NotificationResponse[], 
  isLoading: boolean,
  onMarkRead: (id: number) => void,
  onDelete: (id: number) => void
}) {
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/5">
        <LoadingSpinner className="h-8 w-8 mb-4" />
        <p className="text-muted-foreground">Chargement des notifications...</p>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border rounded-xl bg-muted/5">
        <Bell className="h-12 w-12 text-muted-foreground/20 mb-4" />
        <p className="text-xl font-medium">Aucune notification</p>
        <p className="text-muted-foreground text-center max-w-xs mt-2">
          Vous n'avez pas encore de notifications à afficher ici.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-xl overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[100px]">Statut</TableHead>
            <TableHead>Notification</TableHead>
            <TableHead className="hidden md:table-cell">Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {notifications.map((notif) => (
            <TableRow 
              key={notif.id} 
              className={`cursor-pointer hover:bg-muted/50 transition-colors ${!notif.est_lu ? "bg-primary/5" : ""}`}
              onClick={() => router.push(`/dashboard/notifications/${notif.id}`)}
            >
              <TableCell>
                {notif.est_lu ? (
                  <Badge variant="outline" className="font-normal">Lu</Badge>
                ) : (
                  <Badge variant="default" className="font-normal bg-primary text-primary-foreground">Nouveau</Badge>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold">{notif.titre}</span>
                  <span className="text-sm text-muted-foreground line-clamp-2">{notif.message}</span>
                  <span className="text-[10px] md:hidden text-muted-foreground mt-1">
                    {formatDate(notif.created_at, false)}
                  </span>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell text-muted-foreground text-sm whitespace-nowrap">
                {formatDate(notif.created_at, false)}
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {!notif.est_lu && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-primary"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMarkRead(notif.id);
                      }}
                      title="Marquer comme lu"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(notif.id);
                    }}
                    title="Supprimer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
