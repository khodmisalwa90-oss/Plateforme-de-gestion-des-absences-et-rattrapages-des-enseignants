"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  activateUser,
  deactivateUser
} from "@/lib/api/users";
import {
  PaginatedUserResponse,
  UtilisateurResponse,
  CreateUserPayload,
  UpdateUserPayload
} from "@/types/user";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell
} from "@/components/ui/table";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UserForm } from "@/components/admin/UserForm";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  UserCheck,
  UserX
} from "lucide-react";

export default function UsersManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [data, setData] = useState<PaginatedUserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const perPage = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UtilisateurResponse | undefined>(undefined);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleRoleChange = (val: string | null) => {
    setRoleFilter(val || "all");
    setCurrentPage(1);
  };

  const handleStatusChange = (val: string | null) => {
    setStatusFilter(val || "all");
    setCurrentPage(1);
  };

  const fetchAllUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      let actifFilter: boolean | undefined = undefined;
      if (statusFilter === "actif") actifFilter = true;
      if (statusFilter === "inactif") actifFilter = false;

      const response = await getUsers(currentPage, perPage, {
        role: roleFilter,
        actif: actifFilter,
        search: debouncedSearch,
      });
      setData(response);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (status === "authenticated") {
      if ((session?.user as any)?.role !== "admin_systeme") {
        router.push("/dashboard");
      } else {
        fetchAllUsers();
      }
    }
  }, [status, session, router, fetchAllUsers]);

  const handleFormSubmit = async (values: any) => {
    setIsSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, values as UpdateUserPayload);
        toast.success("Utilisateur mis à jour avec succès");
      } else {
        await createUser(values as CreateUserPayload);
        toast.success("Utilisateur créé avec succès");
      }
      setIsFormOpen(false);
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Une erreur est survenue");
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditDialog = (user: UtilisateurResponse) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  const openCreateDialog = () => {
    setEditingUser(undefined);
    setIsFormOpen(true);
  };

  const handleDelete = async () => {
    if (!userToDelete) return;
    try {
      await deleteUser(userToDelete);
      toast.success("Utilisateur supprimé");
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la suppression");
    } finally {
      setIsDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  };

  const toggleStatus = async (user: UtilisateurResponse) => {
    try {
      if (user.actif) {
        await deactivateUser(user.id);
        toast.success("Utilisateur désactivé");
      } else {
        await activateUser(user.id);
        toast.success("Utilisateur activé");
      }
      fetchAllUsers();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du changement de statut");
    }
  };

  if (status === "loading" || (status === "authenticated" && (session?.user as any)?.role !== "admin_systeme")) {
    return <LoadingSpinner className="min-h-screen" />;
  }

  const formatRole = (role: string) => {
    const roles: Record<string, string> = {
      admin_systeme: "Admin Système",
      administration: "Administration",
      enseignant: "Enseignant",
      etudiant: "Étudiant",
    };
    return roles[role] || role;
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Gestion des Utilisateurs"
        subtitle="Gérez les comptes, les rôles et les accès à la plateforme."
      >
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger render={<Button onClick={openCreateDialog} className="gap-2 shadow-sm font-poppins" />}>
            <Plus className="h-4 w-4" />
            Nouvel Utilisateur
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {editingUser ? "Modifier l'utilisateur" : "Créer un utilisateur"}
              </DialogTitle>
            </DialogHeader>
            <UserForm
              user={editingUser}
              onSubmit={handleFormSubmit}
              isLoading={isSubmitting}
            />
          </DialogContent>
        </Dialog>
      </DashboardHeader>

      <div className="bg-white p-6 rounded-xl border-none shadow-sm space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher par nom, prénom ou email..."
              className="pl-9 bg-slate-50/50 border-slate-200"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={roleFilter} onValueChange={handleRoleChange}>
              <SelectTrigger className="w-full sm:w-[200px] bg-slate-50/50 border-slate-200">
                <SelectValue placeholder="Rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="etudiant">Étudiant</SelectItem>
                <SelectItem value="enseignant">Enseignant</SelectItem>
                <SelectItem value="administration">Administration</SelectItem>
                <SelectItem value="admin_systeme">Admin Système</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={handleStatusChange}>
              <SelectTrigger className="w-full sm:w-[150px] bg-slate-50/50 border-slate-200">
                <SelectValue placeholder="Statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="actif">Actif</SelectItem>
                <SelectItem value="inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {isLoading ? (
          <div className="p-8 flex justify-center">
            <LoadingSpinner />
          </div>
        ) : !data || data.items.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <p>Aucun utilisateur trouvé.</p>
          </div>
        ) : (
          <>
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.items.map((user) => (
                    <TableRow key={user.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-semibold text-slate-700">{user.prenom} {user.nom}</span>
                          <span className="text-sm text-slate-500">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600">
                        <Badge variant="outline" className="bg-slate-50 text-slate-600 border-slate-200">
                          {formatRole(user.role)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.actif ? (
                          <Badge variant="default" className="bg-green-500 hover:bg-green-600">Actif</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">Inactif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleStatus(user)}
                            title={user.actif ? "Désactiver" : "Activer"}
                            className={user.actif ? "text-slate-400 hover:text-amber-600 hover:bg-amber-50" : "text-slate-400 hover:text-green-600 hover:bg-green-50"}
                          >
                            {user.actif ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            className="text-slate-400 hover:text-primary hover:bg-primary/10"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setUserToDelete(user.id);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-slate-400 hover:text-red-600 hover:bg-red-50"
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

            {data.total_pages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Affichage de {((currentPage - 1) * perPage) + 1} à {Math.min(currentPage * perPage, data.total)} sur {data.total} résultats
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1 || isLoading}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(data.total_pages, p + 1))}
                    disabled={currentPage === data.total_pages || isLoading}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous absolument sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Elle supprimera définitivement le compte utilisateur
              ainsi que toutes ses données associées (absences, rattrapages, etc.).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
