import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: number;
}

export function LoadingSpinner({ className, size = 32 }: LoadingSpinnerProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center p-8 text-slate-500", className)}>
      <Loader2 size={size} className="animate-spin text-primary mb-4" />
      <p className="text-sm font-medium animate-pulse">Chargement des données...</p>
    </div>
  );
}
