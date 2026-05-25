import React from "react";
import { Button } from "@/components/ui/Button";
import { RefreshCw } from "lucide-react";

interface DashboardHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
  children?: React.ReactNode;
}

export default function DashboardHeader({
  title,
  subtitle,
  onRefresh,
  refreshing,
  children,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-poppins">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500 font-medium mt-0.5">{subtitle}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 self-start md:self-auto">
        {onRefresh && (
          <Button onClick={onRefresh} variant="outline" size="sm" className="gap-2 shadow-sm font-poppins bg-white border-slate-200">
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Actualiser
          </Button>
        )}
        {children}
      </div>
    </div>
  );
}
