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
import { GroupeResponse, CreateGroupePayload, UpdateGroupePayload } from "@/types/groupe";
import { DepartementResponse } from "@/types/departement";

interface GroupeFormProps {
  initialData?: GroupeResponse | null;
  departments: DepartementResponse[];
  onSubmit: (data: CreateGroupePayload | UpdateGroupePayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function GroupeForm({ initialData, departments, onSubmit, onCancel, isLoading }: GroupeFormProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string>("");

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<CreateGroupePayload>({
    defaultValues: {
      nom: initialData?.nom || "",
      departement_id: initialData?.departement_id || undefined,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nom: initialData.nom,
        departement_id: initialData.departement_id,
      });
      setSelectedDeptId(initialData.departement_id.toString());
    } else {
      reset({
        nom: "",
        departement_id: undefined,
      });
      setSelectedDeptId("");
    }
  }, [initialData, reset]);

  const handleSelectChange = (value: string | null) => {
    if (value) {
      setSelectedDeptId(value);
      setValue("departement_id", parseInt(value), { shouldValidate: true });
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

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nom">Nom du groupe <span className="text-red-500">*</span></Label>
        <Input
          id="nom"
          placeholder="Ex: LSI-S1"
          {...register("nom", { 
            required: "Le nom du groupe est requis", 
            maxLength: { value: 100, message: "Le nom ne peut pas dépasser 100 caractères" } 
          })}
          disabled={isLoading}
        />
        {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="departement_id">Département <span className="text-red-500">*</span></Label>
        <Select 
          value={selectedDeptId} 
          onValueChange={handleSelectChange}
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
