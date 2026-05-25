"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { 
  Building2, 
  Search,
  Clock,
  CheckCircle2,
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

import { getSalles, getAvailableSalles } from "@/lib/api/salles";
import { SalleResponse } from "@/types/salle";
import { formatDate, formatTime } from "@/utils/dateUtils";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function EnseignantSallesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const user = session?.user as any;
  const role = user?.role;

  const [activeTab, setActiveTab] = useState<"list" | "search">("list");

  const [salles, setSalles] = useState<SalleResponse[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [perPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [isListLoading, setIsListLoading] = useState(true);

  const [checkDate, setCheckDate] = useState("");
  const [checkHeureDebut, setCheckHeureDebut] = useState("");
  const [checkHeureFin, setCheckHeureFin] = useState("");
  
  const [availableSalles, setAvailableSalles] = useState<SalleResponse[]>([]);
  const [availTotal, setAvailTotal] = useState(0);
  const [availPage, setAvailPage] = useState(1);
  const [availPerPage] = useState(10);
  const [availTotalPages, setAvailTotalPages] = useState(1);
  const [isAvailLoading, setIsAvailLoading] = useState(false);
  const [hasSearchedAvail, setHasSearchedAvail] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && role !== "enseignant") {
      router.push("/dashboard");
    }
  }, [status, role, router]);

  const fetchAllSalles = useCallback(async () => {
    try {
      setIsListLoading(true);
      const res = await getSalles(page, perPage, search);
      setSalles(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors du chargement des salles");
    } finally {
      setIsListLoading(false);
    }
  }, [page, perPage, search]);

  useEffect(() => {
    if (status === "authenticated" && role === "enseignant" && activeTab === "list") {
      const delayDebounceFn = setTimeout(() => {
        fetchAllSalles();
      }, 500);

      return () => clearTimeout(delayDebounceFn);
    }
  }, [fetchAllSalles, search, activeTab, status, role]);

  const handleCheckAvailability = async (e?: React.FormEvent, targetPage = 1) => {
    if (e) e.preventDefault();

    if (!checkDate || !checkHeureDebut || !checkHeureFin) {
      toast.error("Veuillez remplir tous les champs (date, heure début et fin)");
      return;
    }

    if (checkHeureDebut >= checkHeureFin) {
      toast.error("L'heure de début doit être strictement antérieure à l'heure de fin");
      return;
    }

    try {
      setIsAvailLoading(true);
      setHasSearchedAvail(true);
      setAvailPage(targetPage);

      const res = await getAvailableSalles(checkDate, checkHeureDebut, checkHeureFin, targetPage, availPerPage);
      setAvailableSalles(res.items || []);
      setAvailTotal(res.total || 0);
      setAvailTotalPages(res.total_pages || 1);
    } catch (error: any) {
      toast.error(error.message || "Erreur lors de la recherche des salles disponibles");
    } finally {
      setIsAvailLoading(false);
    }
  };

  useEffect(() => {
    if (hasSearchedAvail && activeTab === "search") {
      handleCheckAvailability(undefined, availPage);
    }
  }, [availPage]);

  if (status === "loading" || !role || role !== "enseignant") {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleRefresh = () => {
    if (activeTab === "list") {
      fetchAllSalles();
    } else {
      handleCheckAvailability(undefined, availPage);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Salles de cours"
        subtitle="Consultez la liste des salles ou recherchez les disponibilités pour planifier vos rattrapages."
        onRefresh={handleRefresh}
        refreshing={activeTab === "list" ? isListLoading : isAvailLoading}
      />

      {/* Tabs Menu */}
      <div className="flex gap-2 p-1 bg-slate-100 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab("list")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all font-poppins ${
            activeTab === "list"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Toutes les salles
        </button>
        <button
          onClick={() => setActiveTab("search")}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-all font-poppins ${
            activeTab === "search"
              ? "bg-white text-slate-800 shadow-sm"
              : "text-slate-500 hover:text-slate-800 hover:bg-white/50"
          }`}
        >
          Rechercher une salle disponible
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white p-6 rounded-xl border-none shadow-sm hover:shadow-md transition-shadow space-y-6">
        
        {/* LIST TAB */}
        {activeTab === "list" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-slate-800">Toutes les salles</h2>
              <div className="relative w-full max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Filtrer les salles..."
                  className="pl-9 bg-slate-50/50 border-slate-200"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>

            {/* Salles Table */}
            <div className="rounded-md border border-slate-200 overflow-hidden">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nom de la salle</TableHead>
                    <TableHead>Capacité</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isListLoading ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center">
                        <div className="flex justify-center items-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : salles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={2} className="h-24 text-center text-slate-500">
                        Aucune salle trouvée.
                      </TableCell>
                    </TableRow>
                  ) : (
                    salles.map((salle) => (
                      <TableRow key={salle.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-700">{salle.nom}</TableCell>
                        <TableCell className="text-slate-600 font-medium">{salle.capacite} places</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* List Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  Affichage de {((page - 1) * perPage) + 1} à {Math.min(page * perPage, total)} sur {total} salles
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1 || isListLoading}
                  >
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || isListLoading}
                  >
                    Suivant
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SEARCH AVAILABILITY TAB */}
        {activeTab === "search" && (
          <div className="space-y-8">
            {/* Input Form */}
            <form onSubmit={(e) => handleCheckAvailability(e, 1)} className="bg-slate-50 p-6 rounded-xl border border-slate-100 space-y-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                Vérifier les disponibilités
              </h3>
              <p className="text-sm text-slate-500">
                Entrez une date et une plage horaire pour trouver toutes les salles libres.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="space-y-2">
                  <Label htmlFor="checkDate">Date <span className="text-red-500">*</span></Label>
                  <div className="relative">
                    <Input
                      id="checkDate"
                      type="date"
                      className="bg-white border-slate-200"
                      value={checkDate}
                      onChange={(e) => setCheckDate(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkHeureDebut">Heure de début <span className="text-red-500">*</span></Label>
                  <Input
                    id="checkHeureDebut"
                    type="time"
                    className="bg-white border-slate-200"
                    value={checkHeureDebut}
                    onChange={(e) => setCheckHeureDebut(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="checkHeureFin">Heure de fin <span className="text-red-500">*</span></Label>
                  <Input
                    id="checkHeureFin"
                    type="time"
                    className="bg-white border-slate-200"
                    value={checkHeureFin}
                    onChange={(e) => setCheckHeureFin(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button 
                  type="submit" 
                  className="bg-primary hover:bg-primary/90 text-white min-w-[150px]"
                  disabled={isAvailLoading}
                >
                  {isAvailLoading ? "Recherche..." : "Vérifier la disponibilité"}
                </Button>
              </div>
            </form>

            {/* Results Table */}
            {hasSearchedAvail && (
              <div className="space-y-6 pt-2">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  <h3 className="text-lg font-semibold text-slate-800">
                    Salles libres le {formatDate(checkDate, false)} de {formatTime(checkHeureDebut)} à {formatTime(checkHeureFin)}
                  </h3>
                </div>

                <div className="rounded-md border border-slate-200 overflow-hidden">
                  <Table>
                    <TableHeader className="bg-slate-50">
                      <TableRow>
                        <TableHead>Nom de la salle</TableHead>
                        <TableHead>Capacité</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isAvailLoading ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center">
                            <div className="flex justify-center items-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : availableSalles.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="h-24 text-center text-slate-500">
                            <div className="flex flex-col items-center justify-center gap-2">
                              <AlertCircle className="h-6 w-6 text-amber-500" />
                              <span>Aucune salle libre n'est disponible sur cette plage horaire.</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        availableSalles.map((salle) => (
                          <TableRow key={salle.id} className="hover:bg-emerald-50/20 transition-colors">
                            <TableCell className="font-semibold text-slate-700">{salle.nom}</TableCell>
                            <TableCell className="text-slate-600 font-medium">{salle.capacite} places</TableCell>
                            <TableCell>
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Libre
                              </span>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {/* Availability Pagination */}
                {availTotalPages > 1 && (
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                      Affichage de {((availPage - 1) * availPerPage) + 1} à {Math.min(availPage * availPerPage, availTotal)} sur {availTotal} salles libres
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAvailPage(p => Math.max(1, p - 1))}
                        disabled={availPage === 1 || isAvailLoading}
                      >
                        Précédent
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAvailPage(p => Math.min(availTotalPages, p + 1))}
                        disabled={availPage === availTotalPages || isAvailLoading}
                      >
                        Suivant
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
