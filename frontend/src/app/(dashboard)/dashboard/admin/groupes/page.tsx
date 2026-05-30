"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  Users,
  GraduationCap
} from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  getGroupes,
  createGroupe,
  updateGroupe,
  deleteGroupe,
  getGroupesByDepartement
} from "@/lib/api/groupes";
import { getDepartements } from "@/lib/api/departements";
import { GroupeResponse } from "@/types/groupe";
import { DepartementResponse } from "@/types/departement";
import { GroupeForm } from "@/components/admin/GroupeForm";
import { GroupStudentsDrawer } from "@/components/admin/GroupStudentsDrawer";
import { formatDate } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function GroupesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const user = session?.user as any;
  const role = user?.role;

  const [groupes, setGroupes] = useState<GroupeResponse[]>([]);
  const [departments, setDepartments] = useState<DepartementResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedDeptFilter, setSelectedDeptFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedGroupe, setSelectedGroupe] = useState<GroupeResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }

    if (status === "authenticated") {
      if (pathname.startsWith("/dashboard/admin") && !["admin_systeme", "administration"].includes(role)) {
        if (role === "enseignant") {
          router.push("/dashboard/enseignant/groupes");
        } else if (role === "etudiant") {
          router.push("/dashboard/etudiant");
        } else {
          router.push("/dashboard");
        }
      } else if (pathname.startsWith("/dashboard/enseignant") && role !== "enseignant") {
        if (["admin_systeme", "administration"].includes(role)) {
          router.push("/dashboard/admin/groupes");
        } else if (role === "etudiant") {
          router.push("/dashboard/etudiant");
        } else {
          router.push("/dashboard");
        }
      }
    }
  }, [status, role, router, pathname]);

  const fetchGroupes = useCallback(async () => {
    try {
      setIsLoading(true);
      let res;
      if (selectedDeptFilter && selectedDeptFilter !== "all") {
        res = await getGroupesByDepartement(parseInt(selectedDeptFilter), page, perPage);
      } else {
        res = await getGroupes(page, perPage, search);
      }
      setGroupes(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des groupes");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedDeptFilter]);

  const fetchDepartments = useCallback(async () => {
    try {
      const res = await getDepartements(1, 100);
      setDepartments(res.items);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des départements");
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration"].includes(role)) {
      fetchDepartments();
    }
  }, [status, role, fetchDepartments]);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration", "enseignant"].includes(role)) {
      const delayDebounceFn = setTimeout(() => {
        fetchGroupes();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [fetchGroupes, search, selectedDeptFilter, status, role]);

  const isAuthorized =
    status === "authenticated" && (
      (pathname.startsWith("/dashboard/admin") && ["admin_systeme", "administration"].includes(role)) ||
      (pathname.startsWith("/dashboard/enseignant") && role === "enseignant")
    );

  if (status === "loading" || !isAuthorized) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isTeacher = role === "enseignant";
  const canManage = ["admin_systeme", "administration"].includes(role);
  const canDelete = role === "admin_systeme";

  const handleOpenCreate = () => {
    setSelectedGroupe(null);
    fetchDepartments();
    setIsFormOpen(true);
  };

  const handleOpenEdit = (groupe: GroupeResponse) => {
    setSelectedGroupe(groupe);
    fetchDepartments();
    setIsFormOpen(true);
  };

  const handleOpenDelete = (groupe: GroupeResponse) => {
    setSelectedGroupe(groupe);
    setIsDeleteDialogOpen(true);
  };

  const handleOpenDrawer = (groupe: GroupeResponse) => {
    setSelectedGroupe(groupe);
    setIsDrawerOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (selectedGroupe) {
        await updateGroupe(selectedGroupe.id, data);
        toast.success("Groupe mis à jour avec succès");
      } else {
        await createGroupe(data);
        toast.success("Groupe créé avec succès");
      }
      setIsFormOpen(false);
      fetchGroupes();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedGroupe) return;

    try {
      setIsSubmitting(true);
      await deleteGroupe(selectedGroupe.id);
      toast.success("Groupe supprimé avec succès");
      setIsDeleteDialogOpen(false);
      fetchGroupes();
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer ce groupe (il peut être utilisé dans l'emploi du temps)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title={role === 'enseignant' ? 'Mes groupes' : 'Gestion des groupes'}
        subtitle={role === 'enseignant' ? "Gérez vos groupes d'étudiants" : "Gérez les groupes d'étudiants et leur rattachement aux départements."}
      >
        {canManage && (
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm font-poppins">
            <Plus className="h-4 w-4" />
            Nouveau groupe
          </Button>
        )}
      </DashboardHeader>

      <div className="bg-white p-6 rounded-xl shadow-sm border-none space-y-6">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder={selectedDeptFilter === "all" ? "Rechercher par nom..." : "Recherche désactivée en mode filtre"}
              className="pl-9 bg-slate-50/50 border-slate-200"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              disabled={selectedDeptFilter !== "all"}
            />
          </div>

          {!isTeacher && (
            <div className="w-full sm:w-64">
              <Select
                value={selectedDeptFilter}
                onValueChange={(val) => {
                  setSelectedDeptFilter(val || "all");
                  setPage(1);
                }}
              >
                <SelectTrigger className="w-full bg-slate-50/50 border-slate-200">
                  <SelectValue placeholder="Filtrer par département" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les départements</SelectItem>
                  {departments.map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div className="rounded-md border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nom du groupe</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : groupes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-slate-500">
                    Aucun groupe trouvé.
                  </TableCell>
                </TableRow>
              ) : (
                groupes.map((groupe) => (
                  <TableRow key={groupe.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-500">#{groupe.id}</TableCell>
                    <TableCell className="font-semibold text-slate-700">{groupe.nom}</TableCell>
                    <TableCell>
                      {groupe.departement?.nom || "Non spécifié"}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(groupe.created_at, false)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDrawer(groupe)}
                          className="text-xs border-slate-200 hover:bg-slate-50 text-slate-600 font-semibold"
                        >
                          <Users className="h-3.5 w-3.5 mr-1" />
                          Étudiants
                        </Button>
                        {canManage && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(groupe)}
                            className="text-slate-400 hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        )}
                        {canDelete && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDelete(groupe)}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Affichage de {((page - 1) * perPage) + 1} à {Math.min(page * perPage, total)} sur {total} résultats
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedGroupe ? "Modifier le groupe" : "Nouveau groupe"}</DialogTitle>
          </DialogHeader>
          <GroupeForm
            initialData={selectedGroupe}
            departments={departments}
            onSubmit={handleFormSubmit}
            onCancel={() => setIsFormOpen(false)}
            isLoading={isSubmitting}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le groupe sera définitivement supprimé.
              Attention, la suppression échouera si le groupe est utilisé dans l'emploi du temps.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? "Suppression..." : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Students Management Drawer */}
      <GroupStudentsDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        group={selectedGroupe}
        userRole={role}
      />
    </div>
  );
}
