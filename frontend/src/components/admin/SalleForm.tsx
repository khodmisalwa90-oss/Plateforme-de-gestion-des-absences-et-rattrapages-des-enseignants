"use client";

import { useForm } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SalleResponse, CreateSallePayload, UpdateSallePayload } from "@/types/salle";

interface SalleFormProps {
  initialData?: SalleResponse | null;
  onSubmit: (data: CreateSallePayload | UpdateSallePayload) => Promise<void>;
  onCancel: () => void;
  isLoading: boolean;
}

export function SalleForm({ 
  initialData, 
  onSubmit, 
  onCancel, 
  isLoading 
}: SalleFormProps) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateSallePayload>({
    defaultValues: {
      nom: initialData?.nom || "",
      capacite: initialData?.capacite || undefined,
    }
  });

  useEffect(() => {
    if (initialData) {
      reset({
        nom: initialData.nom,
        capacite: initialData.capacite,
      });
    } else {
      reset({
        nom: "",
        capacite: undefined,
      });
    }
  }, [initialData, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Room Name */}
      <div className="space-y-2">
        <Label htmlFor="nom">Nom de la salle <span className="text-red-500">*</span></Label>
        <Input
          id="nom"
          placeholder="Ex: Amphi A, Salle B102"
          {...register("nom", { 
            required: "Le nom de la salle est requis", 
            maxLength: { value: 100, message: "Le nom ne peut pas dépasser 100 caractères" } 
          })}
          disabled={isLoading}
        />
        {errors.nom && <p className="text-sm text-red-500">{errors.nom.message}</p>}
      </div>

      {/* Capacity */}
      <div className="space-y-2">
        <Label htmlFor="capacite">Capacité <span className="text-red-500">*</span></Label>
        <Input
          id="capacite"
          type="number"
          placeholder="Ex: 50"
          {...register("capacite", { 
            required: "La capacité est requise", 
            valueAsNumber: true,
            min: { value: 1, message: "La capacité doit être au moins 1" }
          })}
          disabled={isLoading}
        />
        {errors.capacite && <p className="text-sm text-red-500">{errors.capacite.message}</p>}
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
