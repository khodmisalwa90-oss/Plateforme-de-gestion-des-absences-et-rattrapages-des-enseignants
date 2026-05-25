"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user) {
      const role = (session.user as any).role;
      
      if (role === "admin_systeme" || role === "administration") {
        router.replace("/dashboard/admin");
      } else if (role === "enseignant") {
        router.replace("/dashboard/enseignant");
      } else if (role === "etudiant") {
        router.replace("/dashboard/etudiant");
      } else {
        router.replace("/");
      }
    } else if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [session, status, router]);

  return (
    <div className="h-[60vh] flex flex-col items-center justify-center text-slate-500">
      <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
      <p className="animate-pulse">Chargement de votre espace personnel...</p>
    </div>
  );
}
