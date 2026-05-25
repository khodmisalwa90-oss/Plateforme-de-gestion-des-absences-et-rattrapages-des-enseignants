import { AlertCircle, RotateCcw } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ title = "Erreur", message, onRetry }: ErrorMessageProps) {
  return (
    <div className="p-4">
      <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertTitle className="font-bold">{title}</AlertTitle>
        <AlertDescription className="mt-2 text-sm text-red-700">
          {message}
          {onRetry && (
            <div className="mt-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onRetry}
                className="bg-white border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800 gap-2"
              >
                <RotateCcw size={14} />
                Réessayer
              </Button>
            </div>
          )}
        </AlertDescription>
      </Alert>
    </div>
  );
}
