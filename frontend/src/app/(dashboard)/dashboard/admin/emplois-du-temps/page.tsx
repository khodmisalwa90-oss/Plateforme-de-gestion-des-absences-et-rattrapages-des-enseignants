"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getGroupes } from "@/lib/api/groupes";
import { getMatieres } from "@/lib/api/matieres";
import { getSalles } from "@/lib/api/salles";
import {
  getTimetableByGroupe,
  getTimetableByMatiere,
  getTimetableBySalle,
  createEmploiDuTemps,
  updateEmploiDuTemps,
  deleteEmploiDuTemps,
} from "@/lib/api/emploisDuTemps";

import { GroupeResponse } from "@/types/groupe";
import { MatiereResponse } from "@/types/matiere";
import { SalleResponse } from "@/types/salle";
import {
  EmploiDuTempsResponse,
  CreateEmploiDuTempsPayload,
  UpdateEmploiDuTempsPayload,
} from "@/types/emploiDuTemps";

import { WeeklyTimetable } from "@/components/timetable/WeeklyTimetable";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/Card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RefreshCw, Info, Plus, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

const DAYS = [
  "Lundi",
  "Mardi",
  "Mercredi",
  "Jeudi",
  "Vendredi",
  "Samedi",
  "Dimanche",
];

export default function AdminTimetablePage() {
  const [groups, setGroups] = useState<GroupeResponse[]>([]);
  const [matieres, setMatieres] = useState<MatiereResponse[]>([]);
  const [salles, setSalles] = useState<SalleResponse[]>([]);

  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedMatiereId, setSelectedMatiereId] = useState("");
  const [selectedSalleId, setSelectedSalleId] = useState("");

  const [activeTab, setActiveTab] = useState("groupe");
  const [courses, setCourses] = useState<EmploiDuTempsResponse[]>([]);

  const [loadingData, setLoadingData] = useState(true);
  const [loadingTimetable, setLoadingTimetable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] =
    useState<Partial<CreateEmploiDuTempsPayload>>({});
  const [saving, setSaving] = useState(false);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] =
    useState<EmploiDuTempsResponse | null>(null);
  const [editFormData, setEditFormData] =
    useState<Partial<UpdateEmploiDuTempsPayload>>({});
  const [editSaving, setEditSaving] = useState(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingCourse, setDeletingCourse] =
    useState<EmploiDuTempsResponse | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadInitialData = useCallback(async () => {
    setLoadingData(true);
    setError(null);

    try {
      const [groupsRes, matieresRes, sallesRes] = await Promise.all([
        getGroupes(1, 100),
        getMatieres(1, 100),
        getSalles(1, 100),
      ]);

      setGroups(groupsRes.items || []);
      setMatieres(matieresRes.items || []);
      setSalles(sallesRes.items || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des données");
    } finally {
      setLoadingData(false);
    }
  }, []);

  const loadTimetable = useCallback(
    async (id: number, type: "groupe" | "matiere" | "salle") => {
      setLoadingTimetable(true);
      setError(null);

      try {
        let response;

        if (type === "groupe") {
          response = await getTimetableByGroupe(id, 1, 100);
        } else if (type === "matiere") {
          response = await getTimetableByMatiere(id, 1, 100);
        } else {
          response = await getTimetableBySalle(id, 1, 100);
        }

        setCourses(response?.items || []);
      } catch (err: any) {
        setError(
          err.message || "Erreur lors de la récupération de l'emploi du temps"
        );
      } finally {
        setLoadingTimetable(false);
      }
    },
    []
  );

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const refreshCurrentView = () => {
    if (activeTab === "groupe" && selectedGroupId) {
      loadTimetable(Number(selectedGroupId), "groupe");
    } else if (activeTab === "matiere" && selectedMatiereId) {
      loadTimetable(Number(selectedMatiereId), "matiere");
    } else if (activeTab === "salle" && selectedSalleId) {
      loadTimetable(Number(selectedSalleId), "salle");
    }
  };

  const handleRefresh = () => {
    if (selectedGroupId || selectedMatiereId || selectedSalleId) {
      refreshCurrentView();
    } else {
      loadInitialData();
    }
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCourses([]);

    if (value === "groupe" && selectedGroupId) {
      loadTimetable(Number(selectedGroupId), "groupe");
    } else if (value === "matiere" && selectedMatiereId) {
      loadTimetable(Number(selectedMatiereId), "matiere");
    } else if (value === "salle" && selectedSalleId) {
      loadTimetable(Number(selectedSalleId), "salle");
    }
  };

  const handleGroupSelect = (value: string | null) => {
    if (!value) {
      setSelectedGroupId("");
      setCourses([]);
      return;
    }

    setSelectedGroupId(value);
    loadTimetable(Number(value), "groupe");
  };

  const handleMatiereSelect = (value: string | null) => {
    if (!value) {
      setSelectedMatiereId("");
      setCourses([]);
      return;
    }

    setSelectedMatiereId(value);
    loadTimetable(Number(value), "matiere");
  };

  const handleSalleSelect = (value: string | null) => {
    if (!value) {
      setSelectedSalleId("");
      setCourses([]);
      return;
    }

    setSelectedSalleId(value);
    loadTimetable(Number(value), "salle");
  };

  const handleFormChange = (
    field: keyof CreateEmploiDuTempsPayload,
    value: string | number
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toTimeInput = (t?: string) => t?.substring(0, 5) || "";

  const handleOpenDialog = () => {
    setFormData({});
    setDialogOpen(true);
  };

  const handleEditOpen = (course: EmploiDuTempsResponse) => {
    setEditingCourse(course);
    setEditFormData({
      groupe_id: course.groupe_id,
      matiere_id: course.matiere_id,
      salle_id: course.salle_id,
      jour_semaine: course.jour_semaine,
      heure_debut: toTimeInput(course.heure_debut),
      heure_fin: toTimeInput(course.heure_fin),
    });
    setEditDialogOpen(true);
  };

  const handleDeleteOpen = (course: EmploiDuTempsResponse) => {
    setDeletingCourse(course);
    setDeleteDialogOpen(true);
  };

  const showConflictToast = (err: any) => {
    const conflicts:
      | Array<{ type: string; id: number | null; details: string } | string>
      | undefined = err?.conflicts;

    if (Array.isArray(conflicts) && conflicts.length > 0) {
      const labels: Record<string, string> = {
        group: "Conflit Groupe",
        room: "Conflit Salle",
        teacher: "Conflit Enseignant",
      };

      toast.error(
        <div className="flex flex-col gap-1">
          <span className="font-semibold text-sm">
            Conflits de planning détectés :
          </span>
          <ul className="list-disc pl-4 space-y-1 text-xs">
            {conflicts.map((c, idx) => {
              if (typeof c === "string") {
                return <li key={idx}>{c}</li>;
              }

              return (
                <li key={idx}>
                  <strong className="text-red-900">
                    {labels[c.type] ?? "Conflit"}:
                  </strong>{" "}
                  {c.details}
                </li>
              );
            })}
          </ul>
        </div>,
        { duration: 10000 }
      );
    } else {
      toast.error(err?.message || "Erreur lors de l'opération.");
    }
  };

  const handleCreate = async () => {
    const {
      groupe_id,
      matiere_id,
      salle_id,
      jour_semaine,
      heure_debut,
      heure_fin,
    } = formData as CreateEmploiDuTempsPayload;

    if (
      !groupe_id ||
      !matiere_id ||
      !salle_id ||
      jour_semaine === undefined ||
      !heure_debut ||
      !heure_fin
    ) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (heure_debut >= heure_fin) {
      toast.error("L'heure de début doit être avant l'heure de fin.");
      return;
    }

    setSaving(true);

    try {
      await createEmploiDuTemps({
        groupe_id,
        matiere_id,
        salle_id,
        jour_semaine,
        heure_debut,
        heure_fin,
      });

      toast.success("Créneau créé avec succès !");
      setDialogOpen(false);
      refreshCurrentView();
    } catch (err: any) {
      showConflictToast(err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingCourse) return;

    const {
      groupe_id,
      matiere_id,
      salle_id,
      jour_semaine,
      heure_debut,
      heure_fin,
    } = editFormData;

    if (
      !groupe_id ||
      !matiere_id ||
      !salle_id ||
      jour_semaine === undefined ||
      !heure_debut ||
      !heure_fin
    ) {
      toast.error("Veuillez remplir tous les champs.");
      return;
    }

    if (heure_debut >= heure_fin) {
      toast.error("L'heure de début doit être avant l'heure de fin.");
      return;
    }

    setEditSaving(true);

    try {
      await updateEmploiDuTemps(editingCourse.id, {
        groupe_id,
        matiere_id,
        salle_id,
        jour_semaine,
        heure_debut,
        heure_fin,
      });

      toast.success("Créneau modifié avec succès !");
      setEditDialogOpen(false);
      refreshCurrentView();
    } catch (err: any) {
      showConflictToast(err);
    } finally {
      setEditSaving(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCourse) return;

    setDeleteLoading(true);

    try {
      await deleteEmploiDuTemps(deletingCourse.id);
      toast.success("Créneau supprimé avec succès !");
      setDeleteDialogOpen(false);
      setDeletingCourse(null);
      refreshCurrentView();
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de la suppression.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const selectedGroup = groups.find((g) => String(g.id) === selectedGroupId);
  const selectedMatiere = matieres.find(
    (m) => String(m.id) === selectedMatiereId
  );
  const selectedSalle = salles.find((s) => String(s.id) === selectedSalleId);

  if (loadingData) {
    return <LoadingSpinner className="min-h-[60vh]" />;
  }

  if (error && !selectedGroupId && !selectedMatiereId && !selectedSalleId) {
    return <ErrorMessage message={error} onRetry={loadInitialData} />;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Gestion des Emplois du Temps"
        subtitle="Consultez, exportez et créez des plannings par groupe, matière ou salle."
        onRefresh={handleRefresh}
        refreshing={loadingTimetable}
      >
        <Button
          size="sm"
          className="gap-2 font-poppins shadow-sm"
          onClick={handleOpenDialog}
        >
          <Plus size={14} />
          Nouveau Créneau
        </Button>
      </DashboardHeader>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Créer un nouveau créneau</DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Groupe *</Label>
              <Select
                value={formData.groupe_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  handleFormChange("groupe_id", Number(v));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {groups.find((g) => g.id === formData.groupe_id)?.nom ||
                      "Sélectionner un groupe..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Matière *</Label>
              <Select
                value={formData.matiere_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  handleFormChange("matiere_id", Number(v));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {matieres.find((m) => m.id === formData.matiere_id)?.nom ||
                      "Sélectionner une matière..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {matieres.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Salle *</Label>
              <Select
                value={formData.salle_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  handleFormChange("salle_id", Number(v));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {salles.find((s) => s.id === formData.salle_id)?.nom ||
                      "Sélectionner une salle..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {salles.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nom} (Cap: {s.capacite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Jour *</Label>
              <Select
                value={formData.jour_semaine?.toString() ?? ""}
                onValueChange={(v) => {
                  if (!v) return;
                  handleFormChange("jour_semaine", Number(v));
                }}
              >
                <SelectTrigger>
                  <span>
                    {formData.jour_semaine !== undefined
                      ? DAYS[formData.jour_semaine]
                      : "Sélectionner un jour..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Heure début *</Label>
              <Input
                type="time"
                value={formData.heure_debut || ""}
                onChange={(e) =>
                  handleFormChange("heure_debut", e.target.value)
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Heure fin *</Label>
              <Input
                type="time"
                value={formData.heure_fin || ""}
                onChange={(e) => handleFormChange("heure_fin", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={saving}
            >
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                "Créer le créneau"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil size={18} className="text-blue-600" />
              Modifier le créneau
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4 py-2">
            <div className="col-span-2 space-y-1">
              <Label>Groupe *</Label>
              <Select
                value={editFormData.groupe_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  setEditFormData((p) => ({
                    ...p,
                    groupe_id: Number(v),
                  }));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {groups.find((g) => g.id === editFormData.groupe_id)
                      ?.nom || "Sélectionner..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={String(g.id)}>
                      {g.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Matière *</Label>
              <Select
                value={editFormData.matiere_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  setEditFormData((p) => ({
                    ...p,
                    matiere_id: Number(v),
                  }));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {matieres.find((m) => m.id === editFormData.matiere_id)
                      ?.nom || "Sélectionner..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {matieres.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Salle *</Label>
              <Select
                value={editFormData.salle_id?.toString() || ""}
                onValueChange={(v) => {
                  if (!v) return;
                  setEditFormData((p) => ({
                    ...p,
                    salle_id: Number(v),
                  }));
                }}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {salles.find((s) => s.id === editFormData.salle_id)?.nom ||
                      "Sélectionner..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {salles.map((s) => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.nom} (Cap: {s.capacite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2 space-y-1">
              <Label>Jour *</Label>
              <Select
                value={editFormData.jour_semaine?.toString() ?? ""}
                onValueChange={(v) => {
                  if (!v) return;
                  setEditFormData((p) => ({
                    ...p,
                    jour_semaine: Number(v),
                  }));
                }}
              >
                <SelectTrigger>
                  <span>
                    {editFormData.jour_semaine !== undefined
                      ? DAYS[editFormData.jour_semaine]
                      : "Sélectionner..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {DAYS.map((d, i) => (
                    <SelectItem key={i} value={String(i)}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Heure début *</Label>
              <Input
                type="time"
                value={editFormData.heure_debut || ""}
                onChange={(e) =>
                  setEditFormData((p) => ({
                    ...p,
                    heure_debut: e.target.value,
                  }))
                }
              />
            </div>

            <div className="space-y-1">
              <Label>Heure fin *</Label>
              <Input
                type="time"
                value={editFormData.heure_fin || ""}
                onChange={(e) =>
                  setEditFormData((p) => ({
                    ...p,
                    heure_fin: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleUpdate} disabled={editSaving}>
              {editSaving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  <Pencil size={14} />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 size={18} />
              Supprimer le créneau
            </DialogTitle>
          </DialogHeader>

          <div className="py-2 space-y-1 text-sm text-slate-700">
            <p>
              Vous êtes sur le point de supprimer définitivement le créneau
              suivant :
            </p>

            {deletingCourse && (
              <div className="mt-3 p-3 rounded-lg border border-red-100 bg-red-50 space-y-1 text-xs">
                <p>
                  <strong>Matière :</strong>{" "}
                  {deletingCourse.matiere?.nom || "N/A"}
                </p>
                <p>
                  <strong>Groupe :</strong>{" "}
                  {deletingCourse.groupe?.nom || "N/A"}
                </p>
                <p>
                  <strong>Salle :</strong>{" "}
                  {deletingCourse.salle?.nom || "N/A"}
                </p>
                <p>
                  <strong>Jour :</strong>{" "}
                  {DAYS[deletingCourse.jour_semaine]}
                </p>
                <p>
                  <strong>Horaire :</strong>{" "}
                  {deletingCourse.heure_debut?.substring(0, 5)} –{" "}
                  {deletingCourse.heure_fin?.substring(0, 5)}
                </p>
              </div>
            )}

            <p className="mt-3 text-xs text-slate-500">
              Cette action est irréversible.
            </p>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              disabled={deleteLoading}
            >
              Annuler
            </Button>
            <Button
              onClick={handleDeleteConfirm}
              disabled={deleteLoading}
              className="bg-red-600 hover:bg-red-700 text-white gap-2"
            >
              {deleteLoading ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  Suppression...
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  Supprimer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-none shadow-sm bg-white">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">
            Sélection de l'Emploi du Temps
          </CardTitle>
          <CardDescription>
            Basculez entre la vue par groupe d'étudiants, par matière ou par
            salle pour charger la grille horaire.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="w-full"
          >
            <TabsList className="mb-6 grid grid-cols-3 max-w-lg">
              <TabsTrigger value="groupe">Par Groupe</TabsTrigger>
              <TabsTrigger value="matiere">Par Matière</TabsTrigger>
              <TabsTrigger value="salle">Par Salle</TabsTrigger>
            </TabsList>

            <TabsContent value="groupe" className="max-w-md m-0">
              <Select value={selectedGroupId} onValueChange={handleGroupSelect}>
                <SelectTrigger>
                  <span className="truncate">
                    {selectedGroup
                      ? `${selectedGroup.nom} ${
                          selectedGroup.departement?.nom
                            ? `(${selectedGroup.departement.nom})`
                            : ""
                        }`
                      : "Sélectionner un groupe..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group.id} value={String(group.id)}>
                      {group.nom}{" "}
                      {group.departement?.nom
                        ? `(${group.departement.nom})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="matiere" className="max-w-md m-0">
              <Select
                value={selectedMatiereId}
                onValueChange={handleMatiereSelect}
              >
                <SelectTrigger>
                  <span className="truncate">
                    {selectedMatiere
                      ? `${selectedMatiere.nom} ${
                          selectedMatiere.enseignant
                            ? `(Pr. ${selectedMatiere.enseignant.nom})`
                            : ""
                        }`
                      : "Sélectionner une matière..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {matieres.map((matiere) => (
                    <SelectItem key={matiere.id} value={String(matiere.id)}>
                      {matiere.nom}{" "}
                      {matiere.enseignant
                        ? `(Pr. ${matiere.enseignant.nom})`
                        : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>

            <TabsContent value="salle" className="max-w-md m-0">
              <Select value={selectedSalleId} onValueChange={handleSalleSelect}>
                <SelectTrigger>
                  <span className="truncate">
                    {selectedSalle
                      ? `${selectedSalle.nom} (Capacité: ${selectedSalle.capacite})`
                      : "Sélectionner une salle..."}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {salles.map((salle) => (
                    <SelectItem key={salle.id} value={String(salle.id)}>
                      {salle.nom} (Cap: {salle.capacite})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {(activeTab === "groupe"
        ? selectedGroupId
        : activeTab === "matiere"
        ? selectedMatiereId
        : selectedSalleId) ? (
        loadingTimetable ? (
          <LoadingSpinner className="min-h-[40vh]" />
        ) : error ? (
          <ErrorMessage message={error} onRetry={handleRefresh} />
        ) : (
          <WeeklyTimetable
            courses={courses}
            viewType={activeTab as "groupe" | "matiere" | "salle"}
            title={
              activeTab === "groupe"
                ? `Emploi du temps - Groupe : ${
                    selectedGroup?.nom || "Groupe"
                  }`
                : activeTab === "matiere"
                ? `Emploi du temps - Matière : ${
                    selectedMatiere?.nom || "Matière"
                  }`
                : `Emploi du temps - Salle : ${selectedSalle?.nom || "Salle"}`
            }
            subtitle={
              activeTab === "groupe"
                ? selectedGroup?.departement?.nom
                  ? `Département : ${selectedGroup.departement.nom}`
                  : ""
                : activeTab === "matiere"
                ? selectedMatiere?.departement?.nom
                  ? `Département : ${selectedMatiere.departement.nom}`
                  : ""
                : ""
            }
            onEdit={handleEditOpen}
            onDelete={handleDeleteOpen}
          />
        )
      ) : (
        <Card className="border-dashed border-2 border-slate-200 bg-slate-50/50">
          <CardContent className="flex flex-col items-center justify-center p-12 text-center text-slate-400">
            <Info size={40} className="stroke-[1.5] text-slate-300 mb-3" />
            <h3 className="font-bold text-slate-700 text-sm">
              Aucune sélection
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              Veuillez sélectionner une option dans la liste déroulante ci-dessus
              pour afficher la grille horaire hebdomadaire.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}