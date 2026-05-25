"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Plus, 
  Search, 
  Pencil, 
  Trash2,
  BookOpen
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
  getMatieres, 
  createMatiere, 
  updateMatiere, 
  deleteMatiere,
  getMatieresByEnseignant
} from "@/lib/api/matieres";
import { getDepartements } from "@/lib/api/departements";
import { getUsers } from "@/lib/api/users";
import { MatiereResponse } from "@/types/matiere";
import { DepartementResponse } from "@/types/departement";
import { UtilisateurResponse } from "@/types/user";
import { MatiereForm } from "@/components/admin/MatiereForm";
import { formatDate } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function MatieresAdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [matieres, setMatieres] = useState<MatiereResponse[]>([]);
  const [departments, setDepartments] = useState<DepartementResponse[]>([]);
  const [teachers, setTeachers] = useState<UtilisateurResponse[]>([]);
  
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedMatiere, setSelectedMatiere] = useState<MatiereResponse | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && !["admin_systeme", "administration"].includes(role)) {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration"].includes(role)) {
      const loadFormData = async () => {
        try {
          const [deptsRes, teachersRes] = await Promise.all([
            getDepartements(1, 100),
            getUsers(1, 100, { role: "enseignant", actif: true })
          ]);
          setDepartments(deptsRes.items);
          setTeachers(teachersRes.items);
        } catch (error: any) {
          console.error("Erreur lors du chargement des options de formulaire:", error);
          toast.error("Impossible de charger la liste des départements ou des enseignants.");
        }
      };
      loadFormData();
    }
  }, [status, role]);

  const fetchMatieres = useCallback(async () => {
    try {
      setIsLoading(true);
      if (selectedTeacherFilter === "all") {
        const res = await getMatieres(page, perPage, search);
        setMatieres(res.items);
        setTotal(res.total);
        setTotalPages(res.total_pages);
      } else {
        const res = await getMatieresByEnseignant(parseInt(selectedTeacherFilter), page, perPage);
        if (search) {
          const searchLower = search.toLowerCase();
          const filtered = res.items.filter(item => item.nom.toLowerCase().includes(searchLower));
          setMatieres(filtered);
          setTotal(filtered.length);
          setTotalPages(1);
        } else {
          setMatieres(res.items);
          setTotal(res.total);
          setTotalPages(res.total_pages);
        }
      }
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des matières");
    } finally {
      setIsLoading(false);
    }
  }, [page, perPage, search, selectedTeacherFilter]);

  useEffect(() => {
    if (status === "authenticated" && ["admin_systeme", "administration"].includes(role)) {
      const delayDebounceFn = setTimeout(() => {
        fetchMatieres();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [fetchMatieres, search, selectedTeacherFilter, status, role]);

  if (status === "loading" || !["admin_systeme", "administration"].includes(role)) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const canEditOrCreate = ["admin_systeme", "administration"].includes(role);
  const canDelete = role === "admin_systeme";

  const handleOpenCreate = () => {
    setSelectedMatiere(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (matiere: MatiereResponse) => {
    setSelectedMatiere(matiere);
    setIsFormOpen(true);
  };

  const handleOpenDelete = (matiere: MatiereResponse) => {
    setSelectedMatiere(matiere);
    setIsDeleteDialogOpen(true);
  };

  const handleFormSubmit = async (data: any) => {
    try {
      setIsSubmitting(true);
      if (selectedMatiere) {
        await updateMatiere(selectedMatiere.id, data);
        toast.success("Matière mise à jour avec succès");
      } else {
        await createMatiere(data);
        toast.success("Matière créée avec succès");
      }
      setIsFormOpen(false);
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedMatiere) return;
    
    try {
      setIsSubmitting(true);
      await deleteMatiere(selectedMatiere.id);
      toast.success("Matière supprimée avec succès");
      setIsDeleteDialogOpen(false);
      fetchMatieres();
    } catch (error: any) {
      toast.error(error.message || "Impossible de supprimer cette matière (elle peut être liée à des notes, des cours ou d'autres entités)");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Gestion des matières"
        subtitle="Gérez les matières et assignez des enseignants et des départements."
      >
        {canEditOrCreate && (
          <Button onClick={handleOpenCreate} className="gap-2 shadow-sm font-poppins">
            <Plus className="h-4 w-4" />
            Nouvelle matière
          </Button>
        )}
      </DashboardHeader>

      {/* Main Container */}
      <div className="bg-white p-6 rounded-xl shadow-sm border-none space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom..."
              className="pl-9 bg-slate-50/50 border-slate-200"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
          <div className="w-full sm:w-[250px]">
            <Select
              value={selectedTeacherFilter}
              onValueChange={(val) => {
                if (val) {
                  setSelectedTeacherFilter(val);
                }
                setPage(1);
              }}
            >
              <SelectTrigger className="bg-slate-50/50 border-slate-200">
                <SelectValue placeholder="Filtrer par enseignant">
                  {selectedTeacherFilter === "all"
                    ? "Tous les enseignants"
                    : (() => {
                        const t = teachers.find(teacher => teacher.id.toString() === selectedTeacherFilter);
                        return t ? `${t.nom} ${t.prenom}` : "Filtrer par enseignant";
                      })()
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les enseignants</SelectItem>
                {teachers.map((teacher) => (
                  <SelectItem key={teacher.id} value={teacher.id.toString()}>
                    {teacher.nom} {teacher.prenom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border border-slate-200 overflow-hidden">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[100px]">ID</TableHead>
                <TableHead>Nom de la matière</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Enseignant</TableHead>
                <TableHead>Créé le</TableHead>
                {canEditOrCreate && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={canEditOrCreate ? 6 : 5} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : matieres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={canEditOrCreate ? 6 : 5} className="h-24 text-center text-slate-500">
                    Aucune matière trouvée.
                  </TableCell>
                </TableRow>
              ) : (
                matieres.map((matiere) => (
                  <TableRow key={matiere.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-500">#{matiere.id}</TableCell>
                    <TableCell className="font-semibold text-slate-700">{matiere.nom}</TableCell>
                    <TableCell className="text-slate-600">
                      {matiere.departement?.nom || <span className="text-slate-400 italic">Aucun</span>}
                    </TableCell>
                    <TableCell className="text-slate-600">
                      {matiere.enseignant ? (
                        <span className="font-medium text-slate-700">
                          {matiere.enseignant.nom} {matiere.enseignant.prenom}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Non assigné</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(matiere.created_at, false)}
                    </TableCell>
                    {canEditOrCreate && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenEdit(matiere)}
                            className="text-slate-400 hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {canDelete && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleOpenDelete(matiere)}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
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
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>
              {selectedMatiere ? "Modifier la matière" : "Nouvelle matière"}
            </DialogTitle>
          </DialogHeader>
          <MatiereForm
            initialData={selectedMatiere}
            departments={departments}
            teachers={teachers}
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
              Cette action est irréversible. La matière sera définitivement supprimée. 
              Attention, cette suppression peut affecter les autres entités associées (ex: absences, rattrapages, groupes).
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
    </div>
  );
}
