"use client";

import React from "react";
import { Bell, Check, Trash2, ExternalLink } from "lucide-react";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

export function NotificationBell() {
  const [isMounted, setIsMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger
        render={
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </Badge>
            )}
          </Button>
        }
      />
      <SheetContent className="w-full sm:max-w-md flex flex-col p-0">
        <SheetHeader className="p-6 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle>Notifications</SheetTitle>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => markAllAsRead()}
                className="text-xs text-primary h-8"
              >
                Tout marquer comme lu
              </Button>
            )}
          </div>
        </SheetHeader>
        <Separator />
        
        <div className="flex-1 min-h-0 overflow-y-auto px-6">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <Bell className="h-8 w-8 mb-2 opacity-20" />
              <p className="text-sm">Aucune nouvelle notification</p>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  onClick={() => {
                    setIsOpen(false);
                    router.push(`/dashboard/notifications/${notif.id}`);
                  }}
                  className={`relative group p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50 ${
                    !notif.est_lu ? "bg-primary/5 border-primary/20" : "bg-card border-transparent"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-sm pr-12">{notif.titre}</h4>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {!notif.est_lu && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notif.id);
                          }}
                          title="Marquer comme lu"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notif.id);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                    {notif.message}
                  </p>
                  <span className="text-[10px] text-muted-foreground">
                    {isMounted && formatDistanceToNow(new Date(notif.created_at), {
                      addSuffix: true,
                      locale: fr,
                    })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <Separator />
        <SheetFooter className="p-4 bg-muted/30">
          <Link href="/dashboard/notifications" className="w-full" onClick={() => setIsOpen(false)}>
            <Button variant="outline" className="w-full gap-2">
              <ExternalLink className="h-4 w-4" />
              Voir toutes les notifications
            </Button>
          </Link>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
