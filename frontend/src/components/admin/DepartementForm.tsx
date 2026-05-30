"use client";

import { useForm } from "react-hook-form";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DepartementResponse, CreateDepartementPayload, UpdateDepartementPayload } from "@/types/departement";

interface DepartementFormProps {
  initialData?: DepartementResponse | null;
  onSubmit: (data: CreateDepartementPayload | UpdateDepartementPayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function DepartementForm({ initialData, onSubmit, onCancel, isLoading }: DepartementFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateDepartementPayload>({
    defaultValues: {
      nom: initialData?.nom || "",
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({ nom: initialData.nom });
    } else {
      reset({ nom: "" });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="nom">Nom du département <span className="text-red-500">*</span></Label>
        <Input
          id="nom"
          placeholder="Ex: Informatique"
          {...register("nom", {
            required: "Le nom est requis",
            maxLength: { value: 100, message: "Le nom ne peut pas dépasser 100 caractères" }
          })}
          disabled={isLoading}
        />
        {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
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
