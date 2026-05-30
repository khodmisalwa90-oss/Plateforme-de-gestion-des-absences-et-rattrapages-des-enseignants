import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  color?: string;
  bg?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  description,
  color = "text-primary",
  bg = "bg-primary/5",
  className
}: StatCardProps) {
  return (
    <Card className={cn("border-none shadow-sm hover:shadow-md transition-all duration-200", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="text-3xl font-bold mt-2 text-slate-900">{value}</p>
          </div>
        </div>
        {description && (
          <p className="mt-4 text-xs font-medium text-slate-400">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
