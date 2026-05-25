"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";

const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
  mot_de_passe: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères" }),
});

type LoginValues = z.infer<typeof loginSchema>;

export default function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      mot_de_passe: "",
    },
  });

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: values.email,
        mot_de_passe: values.mot_de_passe,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Identifiants invalides ou problème de connexion.");
      } else {
        toast.success("Connexion réussie ! Redirection...");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      toast.error("Une erreur inattendue est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-center">Connexion</CardTitle>
        <CardDescription className="text-center text-base">
          Entrez vos identifiants pour accéder à votre espace
        </CardDescription>
      </CardHeader>
      <CardContent className="px-8 pb-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="votre@email.com"
              {...form.register("email")}
              className={form.formState.errors.email ? "h-12 border-destructive" : "h-12"}
              disabled={isLoading}
            />
            {form.formState.errors.email && (
              <p className="text-xs text-destructive font-medium">{form.formState.errors.email.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="mot_de_passe">Mot de passe</Label>
              <Button variant="link" className="px-0 font-normal text-xs text-primary" type="button">
                Mot de passe oublié ?
              </Button>
            </div>
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
          <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t pt-8 bg-slate-50/50 rounded-b-xl">
        <p className="text-sm text-center text-slate-500">
          En vous connectant, vous acceptez nos conditions d'utilisation.
        </p>
      </CardFooter>
    </Card>
  );
}
