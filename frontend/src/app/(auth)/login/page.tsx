import React from "react";
import LoginForm from "@/components/auth/LoginForm";
import Container from "@/components/ui/Container";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-light rounded-full blur-[120px]" />
      </div>

      <Container className="">        
        <LoginForm />
        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Vous n'avez pas de compte ?{" "}
            <Link href="/contact" className="text-primary font-bold hover:underline">
              Contactez l'administration
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
