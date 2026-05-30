"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { forgotPassword } from "@/lib/api/auth";

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse email valide" }),
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<ForgotPasswordValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: ForgotPasswordValues) => {
    setIsLoading(true);

    try {
      await forgotPassword(values.email);
      setIsSuccess(true);
      toast.success("Demande envoyée avec succès !");
    } catch (err: any) {
      toast.error(err.message || "Une erreur est survenue lors de l'envoi de la demande.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="space-y-4 pb-6 text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary mb-2">
            <MailCheck size={36} />
          </div>
          <CardTitle className="text-3xl font-bold">Email envoyé !</CardTitle>
          <CardDescription className="text-base text-slate-600 max-w-sm mx-auto">
            Si l'adresse email existe dans notre système, vous recevrez un lien pour réinitialiser votre mot de passe sous peu.
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8 text-center space-y-4">
          <p className="text-sm text-slate-500">
            Veuillez vérifier votre boîte de réception ainsi que le dossier des courriers indésirables (spams).
          </p>
          <Link href="/login" className="inline-block mt-4">
            <Button variant="outline" className="h-12 px-6">
              <ArrowLeft size={16} className="mr-2" /> Retour à la connexion
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[550px] border-none shadow-2xl bg-white/95 backdrop-blur-md p-4 animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="space-y-2 pb-6">
        <CardTitle className="text-3xl font-bold text-center">Mot de passe oublié ?</CardTitle>
        <CardDescription className="text-center text-base">
          Saisissez votre adresse email pour recevoir un lien de réinitialisation
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
          <Button type="submit" className="w-full h-12 text-lg font-bold mt-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Envoi du lien...
              </>
            ) : (
              "Envoyer le lien de réinitialisation"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex flex-col space-y-4 border-t pt-8 bg-slate-50/50 rounded-b-xl">
        <Link href="/login" className="flex items-center gap-2 text-sm text-primary font-medium hover:underline justify-center">
          <ArrowLeft size={16} />
          Retour à la connexion
        </Link>
      </CardFooter>
    </Card>
  );
}
