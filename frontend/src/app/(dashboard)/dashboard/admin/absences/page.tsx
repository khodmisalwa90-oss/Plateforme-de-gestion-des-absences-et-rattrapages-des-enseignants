"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FileWarning,
  Search,
  Check,
  X,
  Eye,
  Calendar,
  RefreshCw,
  AlertCircle
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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  getAbsences,
  getPendingAbsences,
  validateAbsence,
  rejectAbsence
} from "@/lib/api/absences";
import { AbsenceResponse } from "@/types/absence";
import { AbsenceStatusBadge } from "@/components/absence/AbsenceStatusBadge";
import { AbsenceDetailsDialog } from "@/components/absence/AbsenceDetailsDialog";
import { formatDate } from "@/utils/dateUtils";

export default function AdminAbsencesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [activeTab, setActiveTab] = useState<string>("all");
  const [absences, setAbsences] = useState<AbsenceResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("");

  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isConfirmActionOpen, setIsConfirmActionOpen] = useState(false);
  const [actionType, setActionType] = useState<"validate" | "reject" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !["admin_systeme", "administration"].includes(role)) {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  const fetchAbsences = useCallback(async () => {
    try {
      setIsLoading(true);
      let res;
      if (activeTab === "pending") {
        res = await getPendingAbsences(page, perPage);
      } else {
        const statut = statusFilter === "all" ? undefined : statusFilter;
        const date_absence = dateFilter || undefined;
        res = await getAbsences(page, perPage, statut, date_absence);
      }
      setAbsences(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des absences");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, activeTab, statusFilter, dateFilter]);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration"].includes(role)) {
      fetchAbsences();
    }
  }, [fetchAbsences, status, role]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setPage(1);
  };

  const handleOpenDetails = (absence: AbsenceResponse) => {
    setSelectedAbsence(absence);
    setIsDetailsOpen(true);
  };

  const handleOpenActionConfirm = (absence: AbsenceResponse, type: "validate" | "reject") => {
    setSelectedAbsence(absence);
    setActionType(type);
    setIsConfirmActionOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedAbsence || !actionType) return;

    try {
      setIsSubmitting(true);
      if (actionType === "validate") {
        await validateAbsence(selectedAbsence.id);
        toast.success("Absence validée avec succès. L'enseignant a été notifié.");
      } else {
        await rejectAbsence(selectedAbsence.id);
        toast.success("Absence rejetée. L'enseignant a été notifié.");
      }
      setIsConfirmActionOpen(false);
      fetchAbsences();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue lors de l'opération.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetFilters = () => {
    setStatusFilter("all");
    setDateFilter("");
    setPage(1);
  };

  if (status === "loading" || !["admin_systeme", "administration"].includes(role)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Suivi des Absences"
        subtitle="Visualisez et validez les déclarations d'absence faites par les enseignants."
        onRefresh={fetchAbsences}
        refreshing={isLoading}
      />

      <div className="bg-white p-6 rounded-xl border-none shadow-sm hover:shadow-md transition-shadow space-y-6">
        {/* Tabs Control */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-4 mb-4">
            <TabsList className="bg-slate-100 p-1 rounded-lg">
              <TabsTrigger value="all" className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Toutes les absences
              </TabsTrigger>
              <TabsTrigger value="pending" className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-1.5">
                En attente
                {activeTab !== "pending" && absences.filter(a => a.statut === "en_attente").length > 0 && (
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                )}
              </TabsTrigger>
            </TabsList>

            {/* Filters (only visible for All tab) */}
            {activeTab === "all" && (
              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Status Filter */}
                <div className="w-[160px]">
                  <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val || "all"); setPage(1); }}>
                    <SelectTrigger className="bg-white border-slate-200">
                      <SelectValue placeholder="Statut" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="en_attente">En attente</SelectItem>
                      <SelectItem value="valide">Validées</SelectItem>
                      <SelectItem value="rejete">Rejetées</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Date Filter */}
                <div className="relative w-[180px]">
                  <Input
                    type="date"
                    className="bg-white border-slate-200 pr-9"
                    value={dateFilter}
                    onChange={(e) => { setDateFilter(e.target.value); setPage(1); }}
                  />
                  <Calendar size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                {/* Reset Filters */}
                {(statusFilter !== "all" || dateFilter) && (
                  <Button variant="ghost" onClick={resetFilters} className="text-slate-500 hover:text-slate-700">
                    Réinitialiser
                  </Button>
                )}
              </div>
            )}
          </div>

          <TabsContent value="all" className="mt-0">
            <AbsenceTable
              absences={absences}
              isLoading={isLoading}
              onViewDetails={handleOpenDetails}
              onValidate={(abs) => handleOpenActionConfirm(abs, "validate")}
              onReject={(abs) => handleOpenActionConfirm(abs, "reject")}
            />
          </TabsContent>

          <TabsContent value="pending" className="mt-0">
            <AbsenceTable
              absences={absences}
              isLoading={isLoading}
              onViewDetails={handleOpenDetails}
              onValidate={(abs) => handleOpenActionConfirm(abs, "validate")}
              onReject={(abs) => handleOpenActionConfirm(abs, "reject")}
            />
          </TabsContent>
        </Tabs>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-500">
              Affichage de {((page - 1) * perPage) + 1} à {Math.min(page * perPage, total)} sur {total} déclarations
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1 || isLoading}
              >
                Précédent
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages || isLoading}
              >
                Suivant
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* View Details Dialog */}
      <AbsenceDetailsDialog
        absence={selectedAbsence}
        isOpen={isDetailsOpen}
        onClose={() => { setSelectedAbsence(null); setIsDetailsOpen(false); }}
      />

      {/* Action Confirmation Dialog */}
      <AlertDialog open={isConfirmActionOpen} onOpenChange={setIsConfirmActionOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "validate" ? "Valider la déclaration d'absence ?" : "Rejeter la déclaration d'absence ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "validate"
                ? "Une fois validée, l'enseignant pourra proposer une séance de rattrapage pour cette absence. Une notification lui sera envoyée."
                : "L'absence sera rejetée et marquée comme telle. L'enseignant ne pourra pas proposer de rattrapage pour cette date. Une notification de refus lui sera transmise."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExecuteAction();
              }}
              disabled={isSubmitting}
              className={actionType === "validate" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}
            >
              {isSubmitting ? "Traitement..." : actionType === "validate" ? "Valider" : "Rejeter"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Subcomponent table for cleaner layout
interface TableProps {
  absences: AbsenceResponse[];
  isLoading: boolean;
  onViewDetails: (absence: AbsenceResponse) => void;
  onValidate: (absence: AbsenceResponse) => void;
  onReject: (absence: AbsenceResponse) => void;
}

function AbsenceTable({ absences, isLoading, onViewDetails, onValidate, onReject }: TableProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-slate-200 overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>Enseignant</TableHead>
              <TableHead>Matière</TableHead>
              <TableHead>Date d'absence</TableHead>
              <TableHead>Motif</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={6} className="h-40 text-center">
                <div className="flex justify-center items-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  if (absences.length === 0) {
    return (
      <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
        <AlertCircle className="mx-auto h-12 w-12 text-slate-400 opacity-60 mb-3" />
        <h3 className="font-semibold text-slate-700">Aucune déclaration d'absence</h3>
        <p className="text-sm text-slate-500 mt-1">Il n'y a pas d'absences correspondantes aux critères actuels.</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>Enseignant</TableHead>
            <TableHead>Matière</TableHead>
            <TableHead>Date d'absence</TableHead>
            <TableHead>Motif</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {absences.map((absence) => (
            <TableRow key={absence.id} className="hover:bg-slate-50/50 transition-colors">
              <TableCell className="font-semibold text-slate-700">
                {absence.enseignant
                  ? `${absence.enseignant.nom} ${absence.enseignant.prenom}`
                  : `ID: ${absence.enseignant_id}`
                }
              </TableCell>
              <TableCell className="text-slate-600 font-medium">
                {absence.matiere?.nom || `Matière #${absence.matiere_id}`}
              </TableCell>
              <TableCell className="text-slate-500 font-medium">
                {formatDate(absence.date_absence, false)}
              </TableCell>
              <TableCell className="text-slate-500 max-w-[200px] truncate">
                {absence.motif}
              </TableCell>
              <TableCell>
                <AbsenceStatusBadge status={absence.statut} />
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end gap-2">
                  {/* View Details */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onViewDetails(absence)}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                    title="Voir les détails"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>

                  {/* Validate / Reject actions (only if pending) */}
                  {absence.statut === "en_attente" && (
                    <>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onValidate(absence)}
                        className="text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 border border-transparent hover:border-emerald-200"
                        title="Valider"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onReject(absence)}
                        className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200"
                        title="Rejeter"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
