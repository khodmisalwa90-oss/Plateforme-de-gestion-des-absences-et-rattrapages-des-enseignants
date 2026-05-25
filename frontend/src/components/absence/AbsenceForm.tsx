"use client";

import { useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AbsenceResponse } from "@/types/absence";
import { MatiereResponse } from "@/types/matiere";
import { Calendar, Upload, FileText, X } from "lucide-react";

interface AbsenceFormProps {
  initialData?: AbsenceResponse | null;
  matieres: MatiereResponse[];
  onSubmit: (data: FormData) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

interface FormValues {
  matiere_id: string;
  date_absence: string;
  motif: string;
  justificatif?: FileList | null;
}

export function AbsenceForm({
  initialData,
  matieres,
  onSubmit,
  onCancel,
  isLoading,
}: AbsenceFormProps) {
  const [selectedMatiereId, setSelectedMatiereId] = useState<string>("");
  const [selectedFileName, setSelectedFileName] = useState<string>("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormValues>({
    defaultValues: {
      matiere_id: initialData?.matiere_id?.toString() || "",
      date_absence: initialData?.date_absence || "",
      motif: initialData?.motif || "",
      justificatif: null,
    },
  });

  useEffect(() => {
    if (initialData) {
      reset({
        matiere_id: initialData.matiere_id.toString(),
        date_absence: initialData.date_absence,
        motif: initialData.motif,
        justificatif: null,
      });
      setSelectedMatiereId(initialData.matiere_id.toString());
      if (initialData.justificatif) {
        setSelectedFileName(initialData.justificatif.split("/").pop() || "Fichier existant");
      } else {
        setSelectedFileName("");
      }
    } else {
      reset({
        matiere_id: "",
        date_absence: "",
        motif: "",
        justificatif: null,
      });
      setSelectedMatiereId("");
      setSelectedFileName("");
    }
  }, [initialData, reset]);

  const handleMatiereChange = (value: string | null) => {
    const val = value || "";
    setSelectedMatiereId(val);
    setValue("matiere_id", val, { shouldValidate: true });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFileName(files[0].name);
      setValue("justificatif", files);
    }
  };

  const clearFile = () => {
    setSelectedFileName("");
    setValue("justificatif", null);
    const fileInput = document.getElementById("justificatif") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const getSelectedMatiereName = () => {
    if (!selectedMatiereId) return "";
    const matiere = matieres.find((m) => m.id.toString() === selectedMatiereId);
    return matiere ? matiere.nom : "";
  };

  const handleFormSubmit = (data: FormValues) => {
    const formData = new FormData();
    formData.append("matiere_id", data.matiere_id);
    formData.append("date_absence", data.date_absence);
    formData.append("motif", data.motif);
    if (data.justificatif && data.justificatif.length > 0) {
      formData.append("justificatif", data.justificatif[0]);
    }
    onSubmit(formData);
  };

  const todayStr = new Date().toISOString().split("T")[0];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
      {/* Subject Select */}
      <div className="space-y-2">
        <Label htmlFor="matiere_id">Matière <span className="text-red-500">*</span></Label>
        <Select
          value={selectedMatiereId}
          onValueChange={handleMatiereChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full bg-white border-slate-200 focus:ring-primary focus:border-primary">
            <SelectValue placeholder="Sélectionner une matière">
              {getSelectedMatiereName() || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white">
            {matieres.length === 0 ? (
              <SelectItem value="none" disabled>
                Aucune matière assignée
              </SelectItem>
            ) : (
              matieres.map((matiere) => (
                <SelectItem key={matiere.id} value={matiere.id.toString()}>
                  {matiere.nom}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        <input
          type="hidden"
          {...register("matiere_id", { required: "La matière est requise" })}
        />
        {errors.matiere_id && (
          <p className="text-sm text-red-500 mt-1">{errors.matiere_id.message}</p>
        )}
      </div>

      {/* Date */}
      <div className="space-y-2">
        <Label htmlFor="date_absence">Date de l'absence <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input
            id="date_absence"
            type="date"
            min={todayStr}
            className="bg-white border-slate-200 pr-10 focus:ring-primary focus:border-primary"
            {...register("date_absence", {
              required: "La date de l'absence est requise",
            })}
            disabled={isLoading}
          />
          <Calendar size={18} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
        </div>
        {errors.date_absence && (
          <p className="text-sm text-red-500 mt-1">{errors.date_absence.message}</p>
        )}
      </div>

      {/* Motif */}
      <div className="space-y-2">
        <Label htmlFor="motif">Motif / Raison <span className="text-red-500">*</span></Label>
        <Textarea
          id="motif"
          placeholder="Veuillez décrire le motif de votre absence (ex: arrêt maladie, urgence familiale...)"
          className="bg-white border-slate-200 focus:ring-primary focus:border-primary min-h-[100px] resize-y"
          {...register("motif", {
            required: "Le motif est requis",
            minLength: { value: 10, message: "Le motif doit faire au moins 10 caractères" },
          })}
          disabled={isLoading}
        />
        {errors.motif && (
          <p className="text-sm text-red-500 mt-1">{errors.motif.message}</p>
        )}
      </div>

      {/* File Upload */}
      <div className="space-y-2">
        <Label htmlFor="justificatif">Justificatif (facultatif)</Label>
        <div className="flex flex-col gap-2">
          {selectedFileName ? (
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-700">
              <div className="flex items-center gap-2">
                <FileText size={18} className="text-primary" />
                <span className="font-medium truncate max-w-[280px]">
                  {selectedFileName}
                </span>
              </div>
              <button
                type="button"
                onClick={clearFile}
                className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="justificatif"
                className="flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-slate-200 hover:border-primary/50 rounded-xl cursor-pointer bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-8 h-8 mb-2 text-slate-400" />
                  <p className="mb-1 text-sm text-slate-600">
                    <span className="font-semibold">Cliquez pour téléverser</span> ou glisser-déposer
                  </p>
                  <p className="text-xs text-slate-400">PDF, JPG, JPEG ou PNG (max. 5 Mo)</p>
                </div>
                <input
                  id="justificatif"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
              </label>
            </div>
          )}
        </div>
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
          disabled={isLoading}
          className="bg-primary hover:bg-primary/90 text-white shadow-sm min-w-[120px]"
        >
          {isLoading ? "Enregistrement..." : initialData ? "Enregistrer" : "Déclarer"}
        </Button>
      </div>
    </form>
  );
}
