"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Search,
  BookOpen
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { getMatieresByEnseignant } from "@/lib/api/matieres";
import { MatiereResponse } from "@/types/matiere";
import { formatDate } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function EnseignantMatieresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;
  const userId = user?.id;

  const [matieres, setMatieres] = useState<MatiereResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "enseignant") {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  const fetchMyMatieres = useCallback(async () => {
    if (!userId) return;
    try {
      setIsLoading(true);
      const res = await getMatieresByEnseignant(parseInt(userId), page, perPage);
      setMatieres(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement de vos matières");
    } finally {
      setIsLoading(false);
    }
  }, [userId, page, perPage]);

  useEffect(() => {
    if (status === "authenticated" && role === "enseignant") {
      fetchMyMatieres();
    }
  }, [fetchMyMatieres, status, role]);

  if (status === "loading" || !role || role !== "enseignant") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const filteredMatieres = matieres.filter((matiere) => {
    const searchLower = search.toLowerCase();
    const matchesNom = matiere.nom.toLowerCase().includes(searchLower);
    const matchesDept = matiere.departement?.nom?.toLowerCase().includes(searchLower) || false;
    return matchesNom || matchesDept;
  });

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Mes matières"
        subtitle="Consultez les matières qui vous sont assignées pour cette année académique."
        onRefresh={fetchMyMatieres}
        refreshing={isLoading}
      />

      {/* Main Container */}
      <div className="bg-white p-6 rounded-xl border-none shadow-sm hover:shadow-md transition-shadow space-y-6">
        {/* Search */}
        <div className="flex items-center justify-between">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Filtrer mes matières..."
              className="pl-9 bg-slate-50/50 border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
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
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex justify-center items-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredMatieres.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-slate-500">
                    {search ? "Aucune matière ne correspond à votre filtre." : "Vous n'avez aucune matière assignée pour le moment."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredMatieres.map((matiere) => (
                  <TableRow key={matiere.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-medium text-slate-500">#{matiere.id}</TableCell>
                    <TableCell className="font-semibold text-slate-700">{matiere.nom}</TableCell>
                    <TableCell className="text-slate-600">
                      {matiere.departement?.nom || <span className="text-slate-400 italic">Aucun</span>}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {formatDate(matiere.created_at, false)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && !search && (
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-500">
              Affichage de {((page - 1) * perPage) + 1} à {Math.min(page * perPage, total)} sur {total} matières
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
    </div>
  );
}
