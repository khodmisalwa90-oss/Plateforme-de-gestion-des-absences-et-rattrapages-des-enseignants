"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { UtilisateurResponse } from "@/types/user";

const formSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Adresse email invalide"),
  role: z.enum(["admin_systeme", "administration", "enseignant", "etudiant"]),
  mot_de_passe: z.string().optional(),
  actif: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

interface UserFormProps {
  user?: UtilisateurResponse;
  onSubmit: (data: any) => Promise<void>;
  isLoading: boolean;
}

export function UserForm({ user, onSubmit, isLoading }: UserFormProps) {
  const isEditing = !!user;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: user?.nom || "",
      prenom: user?.prenom || "",
      email: user?.email || "",
      role: user?.role || "etudiant",
      mot_de_passe: "",
      actif: user?.actif ?? true,
    },
  });

  const handleSubmit = async (values: FormValues) => {
    if (!isEditing && !values.mot_de_passe) {
      form.setError("mot_de_passe", { message: "Le mot de passe est requis pour la création." });
      return;
    }
    
    const submitData = { ...values };
    if (isEditing && !submitData.mot_de_passe) {
      delete submitData.mot_de_passe;
    }

    await onSubmit(submitData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="prenom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prénom</FormLabel>
                <FormControl>
                  <Input placeholder="Jean" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="nom"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom</FormLabel>
                <FormControl>
                  <Input placeholder="Dupont" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="jean.dupont@exemple.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Rôle</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionnez un rôle" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="etudiant">Étudiant</SelectItem>
                  <SelectItem value="enseignant">Enseignant</SelectItem>
                  <SelectItem value="administration">Administration</SelectItem>
                  <SelectItem value="admin_systeme">Administrateur Système</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mot_de_passe"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{isEditing ? "Nouveau mot de passe (optionnel)" : "Mot de passe"}</FormLabel>
              <FormControl>
                <Input type="password" placeholder="••••••••" {...field} />
              </FormControl>
              {isEditing && <FormDescription>Laissez vide pour conserver le mot de passe actuel.</FormDescription>}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="actif"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Compte actif</FormLabel>
                <FormDescription>
                  Permet à l'utilisateur de se connecter à la plateforme.
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Enregistrer les modifications" : "Créer l'utilisateur"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
