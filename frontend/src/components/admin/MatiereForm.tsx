"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
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
import { MatiereResponse, CreateMatierePayload, UpdateMatierePayload } from "@/types/matiere";
import { DepartementResponse } from "@/types/departement";
import { UtilisateurResponse } from "@/types/user";

interface MatiereFormProps {
  initialData?: MatiereResponse | null;
  departments: DepartementResponse[];
  teachers: UtilisateurResponse[];
  onSubmit: (data: CreateMatierePayload | UpdateMatierePayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function MatiereForm({ 
  initialData, 
  departments, 
  teachers, 
  onSubmit, 
  onCancel, 
  isLoading 
}: MatiereFormProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateMatierePayload>({
    defaultValues: {
      nom: initialData?.nom || "",
      departement_id: initialData?.departement_id || undefined,
      enseignant_id: initialData?.enseignant_id || null,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nom: initialData.nom,
        departement_id: initialData.departement_id,
        enseignant_id: initialData.enseignant_id,
      });
      setSelectedDeptId(initialData.departement_id.toString());
      setSelectedTeacherId(initialData.enseignant_id ? initialData.enseignant_id.toString() : "none");
    } else {
      reset({
        nom: "",
        departement_id: undefined,
        enseignant_id: null,
      });
      setSelectedDeptId("");
      setSelectedTeacherId("none");
    }
  }, [initialData, reset]);

  const handleDeptChange = (value: string | null) => {
    if (value) {
      setSelectedDeptId(value);
      setValue("departement_id", parseInt(value), { shouldValidate: true });
    }
  };

  const handleTeacherChange = (value: string | null) => {
    if (value) {
      setSelectedTeacherId(value);
      if (value === "none") {
        setValue("enseignant_id", null, { shouldValidate: true });
      } else {
        setValue("enseignant_id", parseInt(value), { shouldValidate: true });
      }
    }
  };

  const getSelectedDeptName = () => {
    if (!selectedDeptId) return "";
    const dept = departments.find(d => d.id.toString() === selectedDeptId);
    if (dept) return dept.nom;
    if (initialData?.departement && initialData.departement.id.toString() === selectedDeptId) {
      return initialData.departement.nom;
    }
    return "";
  };

  const getSelectedTeacherName = () => {
    if (!selectedTeacherId || selectedTeacherId === "none") return "Non assigné";
    const teacher = teachers.find(t => t.id.toString() === selectedTeacherId);
    if (teacher) return `${teacher.nom} ${teacher.prenom}`;
    if (initialData?.enseignant && initialData.enseignant.id.toString() === selectedTeacherId) {
      return `${initialData.enseignant.nom} ${initialData.enseignant.prenom}`;
    }
    return "Non assigné";
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Subject Name */}
      <div className="space-y-2">
        <Label htmlFor="nom">Nom de la matière <span className="text-red-500">*</span></Label>
        <Input
          id="nom"
          placeholder="Ex: Algorithmique et Structures de Données"
          {...register("nom", { 
            required: "Le nom de la matière est requis", 
            maxLength: { value: 150, message: "Le nom ne peut pas dépasser 150 caractères" } 
          })}
          disabled={isLoading}
        />
        {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
      </div>

      {/* Department Selection */}
      <div className="space-y-2">
        <Label htmlFor="departement_id">Département <span className="text-red-500">*</span></Label>
        <Select 
          value={selectedDeptId} 
          onValueChange={handleDeptChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un département">
              {getSelectedDeptName() || undefined}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {departments.map((dept) => (
              <SelectItem key={dept.id} value={dept.id.toString()}>
                {dept.nom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input 
          type="hidden" 
          {...register("departement_id", { required: "Le département est requis" })} 
        />
        {errors.departement_id && <p className="text-sm text-red-500">{errors.departement_id.message}</p>}
      </div>

      {/* Teacher Selection */}
      <div className="space-y-2">
        <Label htmlFor="enseignant_id">Enseignant</Label>
        <Select 
          value={selectedTeacherId} 
          onValueChange={handleTeacherChange}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Sélectionner un enseignant">
              {getSelectedTeacherName()}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Non assigné (Aucun)</SelectItem>
            {teachers.map((teacher) => (
              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                {teacher.nom} {teacher.prenom}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <input 
          type="hidden" 
          {...register("enseignant_id")} 
        />
      </div>

      {/* Buttons */}
      <div className="flex justify-end gap-3 pt-4">
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
          className="bg-primary hover:bg-primary/90"
        >
          {isLoading ? "Enregistrement..." : (initialData ? "Mettre à jour" : "Créer")}
        </Button>
      </div>
    </form>
  );
}
