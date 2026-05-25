"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { updateProfile } from "@/lib/api/auth";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "../ui/form";

const profileSchema = z.object({
  nom: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  prenom: z.string().min(2, "Le prénom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  mot_de_passe: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères").optional().or(z.literal("")),
  confirm_mot_de_passe: z.string().optional().or(z.literal("")),
}).refine((data) => {
  if (data.mot_de_passe && data.mot_de_passe !== data.confirm_mot_de_passe) {
    return false;
  }
  return true;
}, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirm_mot_de_passe"],
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileForm() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      nom: "",
      prenom: "",
      email: "",
      mot_de_passe: "",
      confirm_mot_de_passe: "",
    },
  });

  useEffect(() => {
    if (session?.user) {
      form.reset({
        nom: (session.user as any).nom || "",
        prenom: (session.user as any).prenom || "",
        email: session.user.email || "",
        mot_de_passe: "",
        confirm_mot_de_passe: "",
      });
    }
  }, [session, form]);

  async function onSubmit(values: ProfileFormValues) {
    setLoading(true);

    try {
      const updateData: any = {
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
      };

      if (values.mot_de_passe) {
        updateData.mot_de_passe = values.mot_de_passe;
      }

      const updatedUser = await updateProfile(updateData);

      await update({
        ...session,
        user: {
          ...session?.user,
          nom: updatedUser.nom,
          prenom: updatedUser.prenom,
          email: updatedUser.email,
        },
      });

      toast.success("Votre profil a été mis à jour avec succès.");
      form.setValue("mot_de_passe", "");
      form.setValue("confirm_mot_de_passe", "");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de la mise à jour");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-none shadow-sm">
      <CardHeader>
        <CardTitle>Informations Personnelles</CardTitle>
        <CardDescription>
          Mettez à jour vos informations de profil et vos identifiants de connexion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <FormLabel>Adresse Email</FormLabel>
                  <FormControl>
                    <Input placeholder="jean.dupont@univ.fr" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="pt-4 border-t border-slate-100">
              <div className="mb-4">
                <h3 className="text-sm font-bold text-slate-900">Changer le mot de passe</h3>
                <p className="text-xs text-slate-500 mt-1">Laissez vide si vous ne souhaitez pas modifier votre mot de passe.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                <FormField
                  control={form.control}
                  name="mot_de_passe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirm_mot_de_passe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer le mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={loading} className="px-8">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  "Sauvegarder les modifications"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
