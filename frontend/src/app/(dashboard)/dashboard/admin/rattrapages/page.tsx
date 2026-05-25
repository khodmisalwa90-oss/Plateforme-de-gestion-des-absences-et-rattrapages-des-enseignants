"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  Check,
  X,
  Eye,
  RefreshCw,
  AlertCircle,
  MapPin,
  Clock,
  User,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Trash2
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { getRattrapages, validateRattrapage, cancelRattrapage, deleteRattrapage } from "@/lib/api/rattrapages";
import { RattrapageResponse } from "@/types/rattrapage";
import { RattrapageStatusBadge } from "@/components/rattrapage/RattrapageStatusBadge";
import { RattrapageDetailsDialog } from "@/components/rattrapage/RattrapageDetailsDialog";
import { ChangeRoomDialog } from "@/components/rattrapage/ChangeRoomDialog";
import { formatDate, formatTime } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function AdminRattrapagesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [rattrapages, setRattrapages] = useState<RattrapageResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFromFilter, setDateFromFilter] = useState<string>("");
  const [dateToFilter, setDateToFilter] = useState<string>("");

  const [selectedRattrapage, setSelectedRattrapage] = useState<RattrapageResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isRoomDialogOpen, setIsRoomDialogOpen] = useState(false);
  const [isConfirmActionOpen, setIsConfirmActionOpen] = useState(false);
  const [actionType, setActionType] = useState<"validate" | "cancel" | "delete" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !["admin_systeme", "administration"].includes(role)) {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  const fetchRattrapages = useCallback(async () => {
    try {
      setIsLoading(true);
      const filters = {
        statut: statusFilter === "all" ? undefined : statusFilter,
        date_from: dateFromFilter || undefined,
        date_to: dateToFilter || undefined,
      };

      const res = await getRattrapages(page, perPage, filters);
      setRattrapages(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des rattrapages");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, statusFilter, dateFromFilter, dateToFilter]);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration"].includes(role)) {
      fetchRattrapages();
    }
  }, [fetchRattrapages, status, role]);

  const handleOpenDetails = (rattrapage: RattrapageResponse) => {
    setSelectedRattrapage(rattrapage);
    setIsDetailsOpen(true);
  };

  const handleOpenRoomDialog = (rattrapage: RattrapageResponse) => {
    setSelectedRattrapage(rattrapage);
    setIsRoomDialogOpen(true);
  };

  const handleOpenActionConfirm = (rattrapage: RattrapageResponse, type: "validate" | "cancel" | "delete") => {
    setSelectedRattrapage(rattrapage);
    setActionType(type);
    setIsConfirmActionOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedRattrapage || !actionType) return;

    try {
      setIsSubmitting(true);
      if (actionType === "validate") {
        await validateRattrapage(selectedRattrapage.id);
        toast.success("Rattrapage validé avec succès. L'enseignant et les étudiants concernés ont été notifiés.");
      } else if (actionType === "cancel") {
        await cancelRattrapage(selectedRattrapage.id);
        toast.success("Rattrapage annulé avec succès.");
      } else if (actionType === "delete") {
        await deleteRattrapage(selectedRattrapage.id);
        toast.success("Rattrapage supprimé avec succès.");
      }
      setIsConfirmActionOpen(false);
      fetchRattrapages();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de l'opération.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDateFromFilter("");
    setDateToFilter("");
    setPage(1);
  };

  if (status === "loading" || isLoading && rattrapages.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Chargement des rattrapages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Suivi des Rattrapages"
        subtitle="Gérez, validez et affectez des salles aux séances de rattrapage proposées."
        onRefresh={fetchRattrapages}
        refreshing={isLoading}
      />

      {/* Filters Card */}
      <div className="bg-white p-6 rounded-xl border-none shadow-sm hover:shadow-md transition-shadow space-y-4">
        <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider font-poppins">Filtres de recherche</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="statusFilter">Statut</Label>
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setPage(1); }}>
              <SelectTrigger id="statusFilter" className="bg-slate-50 border-slate-200">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent className="bg-white border-slate-200">
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="propose">Proposé</SelectItem>
                <SelectItem value="valide">Validé</SelectItem>
                <SelectItem value="annule">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateFromFilter">Depuis le</Label>
            <Input
              id="dateFromFilter"
              type="date"
              value={dateFromFilter}
              onChange={(e) => { setDateFromFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateToFilter">Jusqu'au</Label>
            <Input
              id="dateToFilter"
              type="date"
              value={dateToFilter}
              onChange={(e) => { setDateToFilter(e.target.value); setPage(1); }}
              className="bg-slate-50 border-slate-200"
            />
          </div>

          <div className="flex items-end">
            <Button
              onClick={resetFilters}
              variant="ghost"
              className="text-slate-500 hover:text-slate-800 hover:bg-slate-50 w-full md:w-auto"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
        {rattrapages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
            <p className="text-slate-600 font-medium">Aucun rattrapage trouvé</p>
            <p className="text-slate-400 text-sm text-center">Modifiez vos filtres de recherche pour afficher d'autres séances.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50">
                <TableRow>
                  <TableHead className="font-semibold text-slate-700">Enseignant</TableHead>
                  <TableHead className="font-semibold text-slate-700">Matière</TableHead>
                  <TableHead className="font-semibold text-slate-700">Date proposée</TableHead>
                  <TableHead className="font-semibold text-slate-700">Horaire</TableHead>
                  <TableHead className="font-semibold text-slate-700">Salle</TableHead>
                  <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                  <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rattrapages.map((rattrapage) => {
                  const teacher = rattrapage.absence?.enseignant;
                  return (
                    <TableRow key={rattrapage.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                            {teacher ? `${teacher.nom[0]}${teacher.prenom[0]}` : "?"}
                          </div>
                          <div>
                            <p className="font-semibold">{teacher ? `${teacher.nom} ${teacher.prenom}` : `ID Enseignant: ${rattrapage.absence?.enseignant_id}`}</p>
                            <p className="text-xs text-slate-400">{teacher?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span>{rattrapage.absence?.matiere?.nom || `ID: ${rattrapage.absence?.matiere_id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span>{formatDate(rattrapage.date_proposee, false)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <span>{formatTime(rattrapage.heure_debut)} - {formatTime(rattrapage.heure_fin)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <span>{rattrapage.salle?.nom || `Salle: ${rattrapage.salle_id}`}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <RattrapageStatusBadge status={rattrapage.statut} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenDetails(rattrapage)}
                            title="Détails"
                            className="hover:bg-slate-100 text-slate-500 hover:text-slate-800"
                          >
                            <Eye size={16} />
                          </Button>

                          {rattrapage.statut === "propose" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenActionConfirm(rattrapage, "validate")}
                              title="Valider"
                              className="hover:bg-emerald-50 text-emerald-600 hover:text-emerald-700"
                            >
                              <Check size={16} />
                            </Button>
                          )}

                          {rattrapage.statut !== "annule" && (
                            <>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenRoomDialog(rattrapage)}
                                title="Changer la salle"
                                className="hover:bg-blue-50 text-blue-600 hover:text-blue-700"
                              >
                                <MapPin size={16} />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleOpenActionConfirm(rattrapage, "cancel")}
                                title="Annuler"
                                className="hover:bg-rose-50 text-rose-600 hover:text-rose-700"
                              >
                                <X size={16} />
                              </Button>
                            </>
                          )}
                          {rattrapage.statut !== "valide" && (
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleOpenActionConfirm(rattrapage, "delete")}
                              title="Supprimer"
                              className="hover:bg-rose-50 text-rose-600 hover:text-rose-700"
                            >
                              <Trash2 size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4 bg-white">
            <div className="text-xs text-slate-500">
              Affichage de <span className="font-semibold text-slate-700">{rattrapages.length}</span> sur{" "}
              <span className="font-semibold text-slate-700">{total}</span> propositions.
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="gap-1"
              >
                <ChevronLeft size={16} />
                <span>Précédent</span>
              </Button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Button
                  key={p}
                  variant={p === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(p)}
                  className="w-9"
                >
                  {p}
                </Button>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="gap-1"
              >
                <span>Suivant</span>
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Details Dialog */}
      <RattrapageDetailsDialog
        rattrapage={selectedRattrapage}
        isOpen={isDetailsOpen}
        onClose={() => {
          setIsDetailsOpen(false);
          setSelectedRattrapage(null);
        }}
      />

      {/* Change Room Dialog */}
      <ChangeRoomDialog
        rattrapage={selectedRattrapage}
        isOpen={isRoomDialogOpen}
        onClose={() => {
          setIsRoomDialogOpen(false);
          setSelectedRattrapage(null);
        }}
        onSuccess={fetchRattrapages}
      />

      {/* Confirmation Dialog for actions */}
      <AlertDialog open={isConfirmActionOpen} onOpenChange={setIsConfirmActionOpen}>
        <AlertDialogContent className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              {actionType === "validate" ? "Valider la proposition" : actionType === "cancel" ? "Annuler le rattrapage" : "Supprimer le rattrapage"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {actionType === "validate"
                ? "Êtes-vous sûr de vouloir valider cette proposition de rattrapage ? Les étudiants de la classe seront notifiés par email et in-app."
                : actionType === "cancel"
                  ? "Êtes-vous sûr de vouloir annuler ce rattrapage ? Cette action est irréversible et notifiera l'enseignant."
                  : "Êtes-vous sûr de vouloir supprimer définitivement ce rattrapage ? Cette action est irréversible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExecuteAction();
              }}
              disabled={isSubmitting}
              className={actionType === "validate" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-rose-600 hover:bg-rose-700 text-white"}
            >
              {isSubmitting ? "Traitement..." : actionType === "validate" ? "Valider" : actionType === "cancel" ? "Annuler le rattrapage" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
