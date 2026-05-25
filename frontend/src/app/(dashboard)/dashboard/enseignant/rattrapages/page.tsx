"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  Calendar,
  X,
  Trash2,
  BookOpen,
  MapPin,
  Clock,
  RefreshCw,
  AlertCircle,
  PlusCircle,
  ChevronLeft,
  ChevronRight
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

import { getAbsences } from "@/lib/api/absences";
import { getSalles } from "@/lib/api/salles";
import {
  getRattrapages,
  createRattrapage,
  cancelRattrapage,
  deleteRattrapage
} from "@/lib/api/rattrapages";
import { AbsenceResponse } from "@/types/absence";
import { SalleResponse } from "@/types/salle";
import { RattrapageResponse, CreateRattrapagePayload } from "@/types/rattrapage";
import { RattrapageStatusBadge } from "@/components/rattrapage/RattrapageStatusBadge";
import { RattrapageForm } from "@/components/rattrapage/RattrapageForm";
import { formatDate, formatTime } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

function TeacherRattrapagesPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const user = session?.user as any;
  const role = user?.role;

  const initialTab = searchParams.get("tab") === "propose" ? "propose" : "list";
  const [activeTab, setActiveTab] = useState<string>(initialTab);
  const [rattrapages, setRattrapages] = useState<RattrapageResponse[]>([]);
  const [absences, setAbsences] = useState<AbsenceResponse[]>([]);
  const [salles, setSalles] = useState<SalleResponse[]>([]);

  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  const [isLoading, setIsLoading] = useState(true);
  const [isFormSubmitting, setIsFormSubmitting] = useState(false);

  const [selectedRattrapage, setSelectedRattrapage] = useState<RattrapageResponse | null>(null);
  const [actionType, setActionType] = useState<"cancel" | "delete" | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "enseignant") {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      const rRes = await getRattrapages(page, perPage);
      setRattrapages(rRes.items || []);
      setTotal(rRes.total || 0);
      setTotalPages(rRes.total_pages || 1);
      const aRes = await getAbsences(1, 100, "valide");
      setAbsences(aRes.items || []);

      const sRes = await getSalles(1, 100);
      setSalles(sRes.items || []);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des données.");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage]);

  useEffect(() => {
    if (status === "authenticated" && role === "enseignant") {
      fetchData();
    }
  }, [fetchData, status, role]);

  const handleCreateProposal = async (payload: CreateRattrapagePayload) => {
    setIsFormSubmitting(true);
    try {
      await createRattrapage(payload);
      toast.success("Votre proposition de rattrapage a été créée. En attente de validation.");
      setActiveTab("list");
      setPage(1);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la création de la proposition.");
    } finally {
      setIsFormSubmitting(false);
    }
  };

  const handleOpenActionConfirm = (rattrapage: RattrapageResponse, type: "cancel" | "delete") => {
    setSelectedRattrapage(rattrapage);
    setActionType(type);
    setIsConfirmOpen(true);
  };

  const handleExecuteAction = async () => {
    if (!selectedRattrapage || !actionType) return;

    setIsSubmittingAction(true);
    try {
      if (actionType === "cancel") {
        await cancelRattrapage(selectedRattrapage.id);
        toast.success("Rattrapage annulé avec succès.");
      } else {
        await deleteRattrapage(selectedRattrapage.id);
        toast.success("Rattrapage supprimé avec succès.");
      }
      setIsConfirmOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de l'exécution de l'action.");
    } finally {
      setIsSubmittingAction(false);
      setSelectedRattrapage(null);
      setActionType(null);
    }
  };

  if (status === "loading" || isLoading && rattrapages.length === 0) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-slate-500">Chargement de vos rattrapages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Mes Rattrapages"
        subtitle="Proposez des séances de rattrapage et suivez leur état de validation."
        onRefresh={fetchData}
        refreshing={isLoading}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <TabsList className="bg-slate-50 border border-slate-200">
            <TabsTrigger value="list" className="data-[state=active]:bg-white data-[state=active]:shadow-sm font-poppins">
              Mes Propositions
            </TabsTrigger>
            <TabsTrigger value="propose" className="data-[state=active]:bg-white data-[state=active]:shadow-sm gap-1.5 font-poppins">
              <span>Proposer un rattrapage</span>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Tab 1: List of teacher's makeups */}
        <TabsContent value="list" className="space-y-4">
          <div className="bg-white rounded-xl border-none shadow-sm hover:shadow-md transition-shadow overflow-hidden">
            {rattrapages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                <p className="text-slate-600 font-medium">Aucun rattrapage proposé</p>
                <p className="text-slate-400 text-sm text-center">Vous n'avez pas encore proposé de séances de rattrapage.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-slate-50">
                    <TableRow>
                      <TableHead className="font-semibold text-slate-700">Matière</TableHead>
                      <TableHead className="font-semibold text-slate-700">Date proposée</TableHead>
                      <TableHead className="font-semibold text-slate-700">Horaire</TableHead>
                      <TableHead className="font-semibold text-slate-700">Salle</TableHead>
                      <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                      <TableHead className="text-right font-semibold text-slate-700">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rattrapages.map((rattrapage) => (
                      <TableRow key={rattrapage.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-900">
                          <div className="flex items-center gap-1.5">
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
                          <div className="flex items-center gap-1.5 text-slate-700">
                            <span>{rattrapage.salle?.nom || `Salle: ${rattrapage.salle_id}`}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <RattrapageStatusBadge status={rattrapage.statut} />
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {(rattrapage.statut === "propose" || rattrapage.statut === "valide") && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenActionConfirm(rattrapage, "cancel")}
                                className="text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 gap-1"
                              >
                                <X size={14} />
                                <span>Annuler</span>
                              </Button>
                            )}
                            {rattrapage.statut !== "valide" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenActionConfirm(rattrapage, "delete")}
                                className="text-slate-600 border-slate-200 hover:bg-slate-50 gap-1"
                              >
                                <Trash2 size={14} />
                                <span>Supprimer</span>
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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
        </TabsContent>

        {/* Tab 2: Propose form */}
        <TabsContent value="propose">
          <RattrapageForm
            absences={absences}
            existingRattrapages={rattrapages}
            salles={salles}
            onSubmit={handleCreateProposal}
            onCancel={() => setActiveTab("list")}
            isLoading={isFormSubmitting}
          />
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-white rounded-xl shadow-lg border border-slate-100 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold text-slate-900">
              {actionType === "cancel" ? "Annuler le rattrapage" : "Supprimer la proposition"}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {actionType === "cancel"
                ? "Êtes-vous sûr de vouloir annuler ce rattrapage ? L'administration en sera informée."
                : "Êtes-vous sûr de vouloir supprimer définitivement cette proposition de rattrapage ?"}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel disabled={isSubmittingAction}>Retour</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleExecuteAction();
              }}
              disabled={isSubmittingAction}
              className="bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSubmittingAction ? "Traitement..." : actionType === "cancel" ? "Annuler le rattrapage" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default function TeacherRattrapagesPage() {
  return (
    <Suspense fallback={
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    }>
      <TeacherRattrapagesPageContent />
    </Suspense>
  );
}
