"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  FileWarning,
  PlusCircle,
  History,
  Pencil,
  Trash2,
  Eye,
  FileText,
  RefreshCw,
  AlertCircle
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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

import {
  getMyAbsenceHistory,
  createAbsence,
  updateAbsence,
  deleteAbsence
} from "@/lib/api/absences";
import { getMatieresByEnseignant } from "@/lib/api/matieres";
import { AbsenceResponse } from "@/types/absence";
import { MatiereResponse } from "@/types/matiere";
import { AbsenceStatusBadge } from "@/components/absence/AbsenceStatusBadge";
import { AbsenceDetailsDialog } from "@/components/absence/AbsenceDetailsDialog";
import { AbsenceForm } from "@/components/absence/AbsenceForm";
import { formatDate } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

function TeacherAbsencesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = session?.user as any;
  const role = user?.role;
  const teacherId = user?.id ? parseInt(user.id) : null;

  const [activeTab, setActiveTab] = useState<string>("list");

  const [absences, setAbsences] = useState<AbsenceResponse[]>([]);
  const [matieres, setMatieres] = useState<MatiereResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [isMatieresLoading, setIsMatieresLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [selectedAbsence, setSelectedAbsence] = useState<AbsenceResponse | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "enseignant") {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "declare") {
      setActiveTab("declare");
    }
  }, [searchParams]);

  const fetchMatieres = useCallback(async () => {
    if (!teacherId) return;
    try {
      setIsMatieresLoading(true);
      const res = await getMatieresByEnseignant(teacherId, 1, 100);
      setMatieres(res.items || []);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de vos matières");
    } finally {
      setIsMatieresLoading(false);
    }
  }, [teacherId]);

  const fetchAbsenceHistory = useCallback(async () => {
    try {
      setIsHistoryLoading(true);
      const res = await getMyAbsenceHistory(page, perPage);
      setAbsences(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de votre historique d'absences");
    } finally {
      setIsHistoryLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    if (status === "authenticated" && role === "enseignant") {
      fetchMatieres();
      fetchAbsenceHistory();
    }
  }, [fetchMatieres, fetchAbsenceHistory, status, role]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  const handleCreateAbsence = async (formData: FormData) => {
    try {
      setIsSubmitting(true);
      await createAbsence(formData);
      toast.success("Votre absence a été déclarée avec succès. L'administration a été notifiée.");
      setActiveTab("list");
      setPage(1);
      fetchAbsenceHistory();
    } catch (error: any) {
      toast.error(error.message || "Impossible de déclarer l'absence. Vérifiez les règles de validation.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditAbsence = async (formData: FormData) => {
    if (!selectedAbsence) return;
    try {
      setIsSubmitting(true);
      await updateAbsence(selectedAbsence.id, formData);
      toast.success("Déclaration d'absence mise à jour avec succès.");
      setIsEditOpen(false);
      setSelectedAbsence(null);
      fetchAbsenceHistory();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la mise à jour.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAbsence = async () => {
    if (!selectedAbsence) return;
    try {
      setIsSubmitting(true);
      await deleteAbsence(selectedAbsence.id);
      toast.success("Déclaration d'absence annulée avec succès.");
      setIsDeleteOpen(false);
      setSelectedAbsence(null);
      fetchAbsenceHistory();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'annulation de l'absence.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDetails = (absence: AbsenceResponse) => {
    setSelectedAbsence(absence);
    setIsDetailsOpen(true);
  };

  const handleOpenEdit = (absence: AbsenceResponse) => {
    setSelectedAbsence(absence);
    setIsEditOpen(true);
  };

  const handleOpenDelete = (absence: AbsenceResponse) => {
    setSelectedAbsence(absence);
    setIsDeleteOpen(true);
  };

  const getJustificatifUrl = (justificatif: string) => {
    if (justificatif.startsWith("http://") || justificatif.startsWith("https://")) {
      return justificatif;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    return `${baseUrl}/uploads/${justificatif}`;
  };

  if (status === "loading" || role !== "enseignant") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Gestion de mes Absences"
        subtitle="Déclarez vos absences et suivez les demandes d'autorisation de rattrapage."
        onRefresh={fetchAbsenceHistory}
        refreshing={isHistoryLoading}
      />

      <div className="bg-white p-6 rounded-xl border-none shadow-sm hover:shadow-md transition-shadow space-y-6">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="bg-slate-100 p-1 rounded-lg border-b border-slate-100 pb-4 mb-4 flex justify-start">
            <TabsTrigger value="list" className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              Mes Absences
            </TabsTrigger>
            <TabsTrigger value="declare" className="px-4 py-1.5 text-sm rounded-md data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2">
              Déclarer une absence
            </TabsTrigger>
          </TabsList>

          {/* List Tab Content */}
          <TabsContent value="list" className="mt-0 space-y-6">
            {isHistoryLoading ? (
              <div className="rounded-md border border-slate-200 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead>Matière</TableHead>
                      <TableHead>Date d'absence</TableHead>
                      <TableHead>Motif</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Justificatif</TableHead>
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
            ) : absences.length === 0 ? (
              <div className="text-center py-16 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
                <AlertCircle className="mx-auto h-12 w-12 text-slate-400 opacity-60 mb-3" />
                <h3 className="font-semibold text-slate-700">Aucune absence déclarée</h3>
                <p className="text-sm text-slate-500 mt-1">Vous n'avez pas encore déclaré d'absences.</p>
                <Button onClick={() => setActiveTab("declare")} className="mt-4 bg-primary hover:bg-primary/90 text-white">
                  Déclarer une absence
                </Button>
              </div>
            ) : (
              <>
                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Matière</TableHead>
                        <TableHead>Date d'absence</TableHead>
                        <TableHead>Motif</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Justificatif</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {absences.map((absence) => (
                        <TableRow key={absence.id} className="hover:bg-slate-50/50 transition-colors">
                          <TableCell className="font-semibold text-slate-700">
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
                          <TableCell>
                            {absence.justificatif ? (
                              <a
                                href={getJustificatifUrl(absence.justificatif)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-sm"
                              >
                                <FileText size={14} />
                                Voir
                              </a>
                            ) : (
                              <span className="text-slate-400 italic text-sm">Aucun</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              {/* Details */}
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleOpenDetails(absence)}
                                className="text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>

                              {/* Edit & Delete (only for pending) */}
                              {absence.statut === "en_attente" ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenEdit(absence)}
                                    className="text-slate-400 hover:text-primary hover:bg-primary/10"
                                    title="Modifier la déclaration"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleOpenDelete(absence)}
                                    className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                                    title="Supprimer la déclaration"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="icon" disabled className="opacity-20 cursor-not-allowed">
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button variant="ghost" size="icon" disabled className="opacity-20 cursor-not-allowed">
                                    <Trash2 className="h-4 w-4" />
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

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                    <p className="text-sm text-slate-500">
                      Affichage de {((page - 1) * perPage) + 1} à {Math.min(page * perPage, total)} sur {total} absences
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1 || isHistoryLoading}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages || isHistoryLoading}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Declare Tab Content */}
          <TabsContent value="declare" className="mt-0">
            <div className="max-w-xl mx-auto py-4">
              <h2 className="text-lg font-bold text-slate-800 mb-5 flex items-center gap-2">
                <PlusCircle size={20} className="text-primary" />
                Déclaration d'une nouvelle absence
              </h2>
              {isMatieresLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : (
                <AbsenceForm
                  matieres={matieres}
                  onSubmit={handleCreateAbsence}
                  onCancel={() => setActiveTab("list")}
                  isLoading={isSubmitting}
                />
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* View Details Dialog */}
      <AbsenceDetailsDialog
        absence={selectedAbsence}
        isOpen={isDetailsOpen}
        onClose={() => { setSelectedAbsence(null); setIsDetailsOpen(false); }}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[480px] bg-white rounded-xl">
          <DialogHeader>
            <DialogTitle>Modifier ma déclaration d'absence</DialogTitle>
          </DialogHeader>
          <AbsenceForm
            initialData={selectedAbsence}
            matieres={matieres}
            onSubmit={handleEditAbsence}
            onCancel={() => { setIsEditOpen(false); setSelectedAbsence(null); }}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Alert */}
      <AlertDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Annuler cette déclaration d'absence ?</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir retirer cette absence ? L'administration en sera notifiée.
              Cette opération est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDeleteAbsence();
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isSubmitting ? "Annulation..." : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeacherAbsencesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <TeacherAbsencesPageContent />
    </Suspense>
  );
}
