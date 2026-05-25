import { Badge } from "@/components/ui/badge";
import { StatutRattrapage } from "@/types/rattrapage";

interface RattrapageStatusBadgeProps {
  status: StatutRattrapage;
}

export function RattrapageStatusBadge({ status }: RattrapageStatusBadgeProps) {
  const config = {
    propose: {
      text: "Proposé",
      className: "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100/50",
    },
    valide: {
      text: "Validé",
      className: "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100/50",
    },
    annule: {
      text: "Annulé",
      className: "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100/50",
    },
  };

  const current = config[status] || { text: status, className: "" };

  return (
    <Badge className={current.className}>
      {current.text}
    </Badge>
  );
}
