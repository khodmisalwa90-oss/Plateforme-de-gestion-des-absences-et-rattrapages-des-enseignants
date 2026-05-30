"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { resetPassword, verifyResetToken } from "@/lib/api/auth";

const resetPasswordSchema = z
  .object({
    mot_de_passe: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
    confirmer_mot_de_passe: z.string().min(6, { message: "Veuillez confirmer le mot de passe" }),
  })
  .refine((data) => data.mot_de_passe === data.confirmer_mot_de_passe, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmer_mot_de_passe"],
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [isValidating, setIsValidating] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const form = useForm<ResetPasswordValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      mot_de_passe: "",
      confirmer_mot_de_passe: "",
    },
  });

  useEffect(() => {
    async function checkToken() {
      if (!token) {
        setIsValidating(false);
        setIsTokenValid(false);
        return;
      }

      try {
        const res = await verifyResetToken(token);
        setIsTokenValid(res.status === "valid");
        setUserEmail(res.email || "");
      } catch (err) {
        setIsTokenValid(false);
      } finally {
        setIsValidating(false);
      }
    }

    checkToken();
  }, [token]);

  const onSubmit = async (values: ResetPasswordValues) => {
    if (!token) return;
    setIsLoading(true);

    try {
      await resetPassword(token, values.mot_de_passe);
      setIsSuccess(true);
      toast.success("Mot de passe mis à jour avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de la réinitialisation.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 text-center">
        <CardContent className="py-12 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-slate-500 font-medium">Vérification de la validité du lien...</p>
        </CardContent>
      </Card>
    );
  }

  if (!token || !isTokenValid) {
    return (
      <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2">
            <ShieldAlert size={36} />
          </div>
          <CardTitle className="text-3xl font-bold">Lien invalide ou expiré</CardTitle>
          <CardDescription className="text-base text-slate-600 max-w-sm mx-auto">
            Ce lien de réinitialisation n'est plus valide, a expiré ou est incomplet.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 text-center space-y-4">
          <p className="text-sm text-slate-500">
            Les liens de réinitialisation ne sont valides que pendant 1 heure pour des raisons de sécurité.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
            <Link href="/forgot-password">
              <Button className="h-12 w-full sm:w-auto">Demander un nouveau lien</Button>
            </Link>
            <Link href="/login">
              <Button variant="outline" className="h-12 w-full sm:w-auto">
                <ArrowLeft size={16} className="mr-2" /> Retour à la connexion
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center text-emerald-600 mb-2">
            <ShieldCheck size={36} />
          </div>
          <CardTitle className="text-3xl font-bold">Mot de passe réinitialisé !</CardTitle>
          <CardDescription className="text-base text-slate-600 max-w-sm mx-auto">
            Votre mot de passe a été mis à jour avec succès. Vous pouvez maintenant vous connecter.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 text-center">
          <Link href="/login" className="inline-block mt-4 w-full">
            <Button className="h-12 w-full text-lg font-bold">
              Se connecter
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-center">Nouveau mot de passe</CardTitle>
        <CardDescription className="text-center text-base">
          Définissez votre nouveau mot de passe pour {userEmail}
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="mot_de_passe">Nouveau mot de passe</Label>
            <div className="relative">
              <Input
                id="mot_de_passe"
                type={showPassword ? "text" : "password"}
                {...form.register("mot_de_passe")}
                className={form.formState.errors.mot_de_passe ? "h-12 border-destructive pr-10" : "h-12 pr-10"}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.mot_de_passe && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.mot_de_passe.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmer_mot_de_passe">Confirmer le mot de passe</Label>
            <div className="relative">
              <Input
                id="confirmer_mot_de_passe"
                type={showConfirmPassword ? "text" : "password"}
                {...form.register("confirmer_mot_de_passe")}
                className={form.formState.errors.confirmer_mot_de_passe ? "h-12 border-destructive pr-10" : "h-12 pr-10"}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                disabled={isLoading}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {form.formState.errors.confirmer_mot_de_passe && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.confirmer_mot_de_passe.message}</p>
            )}
          </div>

          <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Mise à jour du mot de passe...
              </>
            ) : (
              "Réinitialiser le mot de passe"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
