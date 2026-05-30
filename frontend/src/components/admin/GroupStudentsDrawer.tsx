"use client";

import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import {
  Search,
  UserMinus,
  UserPlus,
  Users,
  Loader2,
  X
} from "lucide-react";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";

import { GroupeResponse } from "@/types/groupe";
import { UtilisateurResponse } from "@/types/user";
import { getGroupStudents, addStudentsToGroup, removeStudentFromGroup } from "@/lib/api/groupes";
import { getUsers } from "@/lib/api/users";

interface GroupStudentsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  group: GroupeResponse | null;
  userRole: string;
}

export function GroupStudentsDrawer({ isOpen, onClose, group, userRole }: GroupStudentsDrawerProps) {
  const [students, setStudents] = useState<UtilisateurResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<UtilisateurResponse[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([]);
  const [selectorSearch, setSelectorSearch] = useState("");
  const [isSelectorLoading, setIsSelectorLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canManage = ["admin_systeme", "administration"].includes(userRole);

  const fetchCurrentStudents = useCallback(async () => {
    if (!group) return;
    try {
      setIsLoading(true);
      const res = await getGroupStudents(group.id, page, 8);
      setStudents(res.items);
      setTotal(res.total);
      setTotalPages(res.total_pages);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des étudiants");
    } finally {
      setIsLoading(false);
    }
  }, [group, page]);

  useEffect(() => {
    if (isOpen && group) {
      fetchCurrentStudents();
    }
  }, [isOpen, group, fetchCurrentStudents]);

  const handleRemoveStudent = async (studentId: number) => {
    if (!group) return;
    try {
      setIsSubmitting(true);
      await removeStudentFromGroup(group.id, studentId);
      toast.success("Étudiant retiré du groupe avec succès");
      fetchCurrentStudents();
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du retrait de l'étudiant");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenSelector = async () => {
    setIsSelectorOpen(true);
    setSelectedStudentIds([]);
    setSelectorSearch("");
    try {
      setIsSelectorLoading(true);
      const res = await getUsers(1, 100, { role: "etudiant" });

      const currentIds = students.map(s => s.id);
      const available = res.items.filter(s => !currentIds.includes(s.id));
      setAllStudents(available);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de la liste globale des étudiants");
    } finally {
      setIsSelectorLoading(false);
    }
  };

  const toggleSelectStudent = (id: number) => {
    setSelectedStudentIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleAddSelectedStudents = async () => {
    if (!group || selectedStudentIds.length === 0) return;
    try {
      setIsSubmitting(true);
      const res = await addStudentsToGroup(group.id, selectedStudentIds);
      if (res.errors && res.errors.length > 0) {
        res.errors.forEach(err => {
          toast.error(`Échec: ${err.reason}`);
        });
      } else {
        toast.success("Étudiants ajoutés au groupe avec succès");
      }
      setIsSelectorOpen(false);
      fetchCurrentStudents();
    } catch (error: any) {
      const detail = error.response?.detail;
      if (typeof detail === "object" && detail !== null && detail.message) {
        const conflictStudentIds = detail.students || [];
        const conflictNames = conflictStudentIds
          .map((id: number) => {
            const student = allStudents.find(s => s.id === id);
            return student ? `${student.prenom} ${student.nom}` : `ID: ${id}`;
          })
          .filter(Boolean)
          .join(", ");

        const message = conflictNames
          ? `${detail.message} (Étudiant(s) concerné(s) : ${conflictNames})`
          : detail.message;

        toast.error(message, { duration: 6000 });
      } else {
        toast.error(error.message || "Erreur lors de l'ajout des étudiants");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredAllStudents = allStudents.filter(s =>
    `${s.nom} ${s.prenom} ${s.email}`.toLowerCase().includes(selectorSearch.toLowerCase())
  );

  return (
    <>
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <SheetContent className="sm:max-w-xl overflow-y-auto">
          <SheetHeader className="pb-6 border-b border-slate-100">
            <SheetTitle className="text-2xl font-bold flex items-center gap-2 text-slate-800">
              Membres du groupe
            </SheetTitle>
            {group && (
              <SheetDescription className="text-slate-500 text-sm mt-2">
                Groupe: <span className="font-semibold text-slate-700">{group.nom}</span>
                {group.departement && (
                  <span> | Département: <span className="font-semibold text-slate-700">{group.departement.nom}</span></span>
                )}
              </SheetDescription>
            )}
          </SheetHeader>

          <div className="py-6 px-5 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-700">Liste des étudiants ({total})</h3>
              {canManage && (
                <Button
                  onClick={handleOpenSelector}
                  size="sm"
                  className="bg-primary hover:bg-primary/90 text-xs font-semibold"
                >
                  <UserPlus className="h-4 w-4 mr-1.5" />
                  Ajouter des étudiants
                </Button>
              )}
            </div>

            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Email</TableHead>
                    {canManage && <TableHead className="text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <Loader2 className="animate-spin h-6 w-6 text-primary" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : students.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={canManage ? 3 : 2} className="h-24 text-center text-slate-500 text-sm">
                        Aucun étudiant dans ce groupe.
                      </TableCell>
                    </TableRow>
                  ) : (
                    students.map((student) => (
                      <TableRow key={student.id} className="hover:bg-slate-50/50">
                        <TableCell className="font-semibold text-slate-700">
                          {student.prenom} {student.nom}
                        </TableCell>
                        <TableCell className="text-slate-500 text-xs">{student.email}</TableCell>
                        {canManage && (
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveStudent(student.id)}
                              disabled={isSubmitting}
                              className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                              title="Retirer du groupe"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination inside Drawer */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2">
                <p className="text-xs text-slate-500">
                  Page {page} sur {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isLoading}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isLoading}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Student Multi-Selector Dialog */}
      <Dialog open={isSelectorOpen} onOpenChange={setIsSelectorOpen}>
        <DialogContent className="sm:max-w-lg p-6 max-h-[90vh] flex flex-col">
          <DialogHeader className="pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Sélectionner des étudiants
            </DialogTitle>
          </DialogHeader>

          <div className="py-4 space-y-4 flex-1 overflow-hidden flex flex-col">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par nom, prénom ou email..."
                className="pl-9 bg-slate-50 border-slate-200"
                value={selectorSearch}
                onChange={(e) => setSelectorSearch(e.target.value)}
              />
            </div>

            <div className="border border-slate-200 rounded-md overflow-y-auto max-h-[300px] flex-1">
              {isSelectorLoading ? (
                <div className="flex justify-center items-center h-40">
                  <Loader2 className="animate-spin h-6 w-6 text-primary" />
                </div>
              ) : filteredAllStudents.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-sm">
                  Aucun étudiant disponible.
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {filteredAllStudents.map((student) => {
                    const isSelected = selectedStudentIds.includes(student.id);
                    return (
                      <div
                        key={student.id}
                        onClick={() => toggleSelectStudent(student.id)}
                        className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-slate-50 transition-colors ${isSelected ? "bg-primary/5" : ""
                          }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => { }} // Handled by div onClick
                          className="h-4 w-4 rounded border-slate-300 text-primary focus:ring-primary cursor-pointer"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-sm text-slate-700">
                            {student.prenom} {student.nom}
                          </p>
                          <p className="text-xs text-slate-500">{student.email}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="pt-4 border-t border-slate-100 flex justify-between items-center">
            <p className="text-xs text-slate-500 font-medium hidden sm:block">
              {selectedStudentIds.length} sélectionné(s)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setIsSelectorOpen(false)}
                disabled={isSubmitting}
              >
                Annuler
              </Button>
              <Button
                onClick={handleAddSelectedStudents}
                disabled={selectedStudentIds.length === 0 || isSubmitting}
                className="bg-primary hover:bg-primary/90"
              >
                {isSubmitting ? "Ajout..." : "Ajouter au groupe"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
