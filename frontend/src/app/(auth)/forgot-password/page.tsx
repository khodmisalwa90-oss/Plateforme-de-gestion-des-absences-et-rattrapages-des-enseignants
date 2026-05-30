import React from "react";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import Container from "@/components/ui/Container";

export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-primary rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-light rounded-full blur-[120px]" />
      </div>

      <Container className="">        
        <ForgotPasswordForm />
      </Container>
    </div>
  );
}
