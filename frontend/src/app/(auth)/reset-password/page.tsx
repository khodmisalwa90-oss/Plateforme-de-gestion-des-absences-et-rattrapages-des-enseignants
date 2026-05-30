import React, { Suspense } from "react";
import ResetPasswordForm from "@/components/auth/ResetPasswordForm";
import Container from "@/components/ui/Container";
import { Loader2 } from "lucide-react";

export default function ResetPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-light rounded-full blur-[120px]" />
      </div>

      <Container className="">
        <Suspense
          fallback={
            <div className="flex flex-col items-center justify-center space-y-4 bg-white/95 p-12 rounded-2xl shadow-xl w-full max-w-[550px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-slate-500 font-medium">Chargement...</p>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </Container>
    </div>
  );
}
