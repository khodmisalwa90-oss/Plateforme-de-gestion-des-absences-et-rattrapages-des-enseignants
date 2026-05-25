"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AbsenceResponse } from "@/types/absence";
import { SalleResponse } from "@/types/salle";
import { RattrapageResponse, CreateRattrapagePayload } from "@/types/rattrapage";
import { getAvailableSalles } from "@/lib/api/salles";
import { Calendar, Clock, MapPin, Loader2, AlertCircle } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { toast } from "sonner";

interface RattrapageFormProps {
  absences: AbsenceResponse[];
  existingRattrapages: RattrapageResponse[];
  salles: SalleResponse[];
  onSubmit: (data: CreateRattrapagePayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormValues {
  absence_id: string;
  salle_id: string;
  date_proposee: string;
  heure_debut: string;
  heure_fin: string;
}

export function RattrapageForm({
  absences,
  existingRattrapages,
  salles,
  onSubmit,
  onCancel,
  isLoading,
}: RattrapageFormProps) {
  const [selectedAbsenceId, setSelectedAbsenceId] = useState<string>("");
  const [selectedSalleId, setSelectedSalleId] = useState<string>("");
  const [availableSalles, setAvailableSalles] = useState<SalleResponse[]>(salles);
  const [isLoadingSalles, setIsLoadingSalles] = useState(false);
  const [showAllSalles, setShowAllSalles] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      absence_id: "",
      salle_id: "",
      date_proposee: "",
      heure_debut: "",
      heure_fin: "",
    },
  });

  const watchDate = watch("date_proposee");
  const watchHeureDebut = watch("heure_debut");
  const watchHeureFin = watch("heure_fin");

  const eligibleAbsences = absences.filter((abs) => {
    const hasActive = existingRattrapages.some(
      (r) => r.absence_id === abs.id && r.statut !== "annule"
    );
    return !hasActive;
  });

  useEffect(() => {
    if (!watchDate || !watchHeureDebut || !watchHeureFin || showAllSalles) {
      if (showAllSalles) {
        setAvailableSalles(salles);
      }
      return;
    }

    const checkSalles = async () => {
      setIsLoadingSalles(true);
      try {
        const res = await getAvailableSalles(
          watchDate,
          watchHeureDebut,
          watchHeureFin,
          1,
          100
        );
        setAvailableSalles(res.items);
      } catch (err) {
        setAvailableSalles(salles);
      } finally {
        setIsLoadingSalles(false);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkSalles();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [watchDate, watchHeureDebut, watchHeureFin, showAllSalles, salles]);

  useEffect(() => {
    if (showAllSalles) {
      setAvailableSalles(salles);
    }
  }, [showAllSalles, salles]);

  const handleAbsenceChange = (value: string | null) => {
    const val = value || "";
    setSelectedAbsenceId(val);
    setValue("absence_id", val, { shouldValidate: true });

    const selectedAbs = eligibleAbsences.find((a) => a.id.toString() === val);
    if (selectedAbs) {
      const nextDay = new Date(selectedAbs.date_absence);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextDayStr = nextDay.toISOString().split("T")[0];
      setValue("date_proposee", nextDayStr);
    }
  };

  const handleSalleChange = (value: string | null) => {
    const val = value || "";
    setSelectedSalleId(val);
    setValue("salle_id", val, { shouldValidate: true });
  };

  const getSelectedAbsenceText = () => {
    if (!selectedAbsenceId) return "";
    const abs = eligibleAbsences.find((a) => a.id.toString() === selectedAbsenceId);
    return abs
      ? `${abs.matiere?.nom || "Matière"} du ${formatDate(abs.date_absence, false)}`
      : "";
  };

  const getSelectedSalleText = () => {
    if (!selectedSalleId) return "";
    const s = salles.find((salle) => salle.id.toString() === selectedSalleId);
    return s ? `${s.nom} (Capacité: ${s.capacite})` : "";
  };

  const handleFormSubmit = (data: FormValues) => {
    const abs = eligibleAbsences.find((a) => a.id.toString() === data.absence_id);
    if (abs) {
      const absDate = new Date(abs.date_absence);
      const propDate = new Date(data.date_proposee);
      absDate.setHours(0, 0, 0, 0);
      propDate.setHours(0, 0, 0, 0);
      if (propDate <= absDate) {
        toast.error("La date du rattrapage doit être après la date de l'absence.");
        return;
      }
    }

    const [sh, sm] = data.heure_debut.split(":").map(Number);
    const [eh, em] = data.heure_fin.split(":").map(Number);
    if (sh > eh || (sh === eh && sm >= em)) {
      toast.error("L'heure de début doit être strictement avant l'heure de fin.");
      return;
    }

    onSubmit({
      absence_id: parseInt(data.absence_id),
      salle_id: parseInt(data.salle_id),
      date_proposee: data.date_proposee,
      heure_debut: data.heure_debut,
      heure_fin: data.heure_fin,
    });
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm max-w-2xl">
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-1">Proposer un rattrapage</h2>
        <p className="text-sm text-slate-500">Planifier une séance de rattrapage pour une de vos absences validées.</p>
      </div>

      {/* Absence Selection */}
      <div className="space-y-2">
        <Label htmlFor="absence_id">Absence à rattraper <span className="text-red-500">*</span></Label>
        <Select
          value={selectedAbsenceId}
          onValueChange={handleAbsenceChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-primary focus:border-primary">
            <SelectValue placeholder="Sélectionnez une absence validée">
              {getSelectedAbsenceText() || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            {eligibleAbsences.length === 0 ? (
              <div className="p-2 text-center text-sm text-slate-400">
                Aucune absence validée sans rattrapage actif.
              </div>
            ) : (
              eligibleAbsences.map((abs) => (
                <SelectItem key={abs.id} value={abs.id.toString()}>
                  {abs.matiere?.nom || "Matière"} — Absente le {formatDate(abs.date_absence, false)}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          {...register("absence_id", { required: "Veuillez sélectionner une absence" })}
        />
        {errors.absence_id && (
          <p className="text-sm text-red-500 mt-1">{errors.absence_id.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Proposed Date */}
        <div className="space-y-2">
          <Label htmlFor="date_proposee">Date du rattrapage <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="date_proposee"
              type="date"
              min={todayStr}
              className="bg-white border-slate-200 pr-10 focus:ring-primary focus:border-primary"
              {...register("date_proposee", {
                required: "Date de rattrapage requise",
              })}
              disabled={isLoading || !selectedAbsenceId}
            />
            <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.date_proposee && (
            <p className="text-sm text-red-500 mt-1">{errors.date_proposee.message}</p>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-2">
          <Label htmlFor="heure_debut">Heure de début <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="heure_debut"
              type="time"
              className="bg-white border-slate-200 pr-10 focus:ring-primary focus:border-primary"
              {...register("heure_debut", {
                required: "Heure de début requise",
              })}
              disabled={isLoading || !selectedAbsenceId}
            />
            <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.heure_debut && (
            <p className="text-sm text-red-500 mt-1">{errors.heure_debut.message}</p>
          )}
        </div>

        {/* End Time */}
        <div className="space-y-2">
          <Label htmlFor="heure_fin">Heure de fin <span className="text-red-500">*</span></Label>
          <div className="relative">
            <Input
              id="heure_fin"
              type="time"
              className="bg-white border-slate-200 pr-10 focus:ring-primary focus:border-primary"
              {...register("heure_fin", {
                required: "Heure de fin requise",
              })}
              disabled={isLoading || !selectedAbsenceId}
            />
            <Clock size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {errors.heure_fin && (
            <p className="text-sm text-red-500 mt-1">{errors.heure_fin.message}</p>
          )}
        </div>
      </div>

      {/* Salle Selection */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="salle_id">Salle <span className="text-red-500">*</span></Label>
          {watchDate && watchHeureDebut && watchHeureFin && (
            <button
              type="button"
              onClick={() => setShowAllSalles(!showAllSalles)}
              className="text-xs text-primary hover:underline font-medium"
            >
              {showAllSalles ? "Afficher les salles disponibles" : "Afficher toutes les salles"}
            </button>
          )}
        </div>
        <Select
          value={selectedSalleId}
          onValueChange={handleSalleChange}
          disabled={isLoading || isLoadingSalles || !selectedAbsenceId}
        >
          <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-primary focus:border-primary">
            <SelectValue placeholder={isLoadingSalles ? "Vérification des disponibilités..." : "Sélectionnez une salle"}>
              {getSelectedSalleText() || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white border border-slate-200">
            {availableSalles.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucune salle disponible pour ce créneau
              </SelectItem>
            ) : (
              availableSalles.map((salle) => (
                <SelectItem key={salle.id} value={salle.id.toString()}>
                  {salle.nom} (Capacité: {salle.capacite})
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          {...register("salle_id", { required: "Veuillez sélectionner une salle" })}
        />
        {errors.salle_id && (
          <p className="text-sm text-red-500 mt-1">{errors.salle_id.message}</p>
        )}

        {/* Availability Indicators */}
        {watchDate && watchHeureDebut && watchHeureFin && !showAllSalles && !isLoadingSalles && (
          <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1 font-medium">
            <MapPin size={12} />
            Affichage des salles libres de {watchHeureDebut} à {watchHeureFin} le {formatDate(watchDate, false)}.
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Annuler
        </Button>
        <Button
          type="submit"
          disabled={isLoading || isLoadingSalles || !selectedAbsenceId}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm min-w-[120px]"
        >
          {isLoading ? (
            <>
              <Loader2 size={16} className="animate-spin mr-2" />
              <span>Traitement...</span>
            </>
          ) : (
            "Proposer"
          )}
        </Button>
      </div>
    </form>
  );
}
