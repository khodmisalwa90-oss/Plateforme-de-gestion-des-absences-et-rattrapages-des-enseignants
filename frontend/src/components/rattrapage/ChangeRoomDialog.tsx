"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RattrapageResponse } from "@/types/rattrapage";
import { SalleResponse } from "@/types/salle";
import { getAvailableSalles, getSalles } from "@/lib/api/salles";
import { changeRattrapageRoom } from "@/lib/api/rattrapages";
import { toast } from "sonner";
import { Loader2, MapPin } from "lucide-react";

interface ChangeRoomDialogProps {
  rattrapage: RattrapageResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeRoomDialog({
  rattrapage,
  isOpen,
  onClose,
  onSuccess,
}: ChangeRoomDialogProps) {
  const [salles, setSalles] = useState<SalleResponse[]>([]);
  const [selectedSalleId, setSelectedSalleId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAllSalles, setShowAllSalles] = useState(false);

  useEffect(() => {
    if (!isOpen || !rattrapage) return;

    const fetchSalles = async () => {
      setIsLoading(true);
      try {
        if (!showAllSalles) {
          const res = await getAvailableSalles(
            rattrapage.date_proposee,
            rattrapage.heure_debut.substring(0, 5),
            rattrapage.heure_fin.substring(0, 5),
            1,
            100
          );
          setSalles(res.items);
          if (res.items.length === 0) {
            const allRes = await getSalles(1, 100);
            setSalles(allRes.items);
            setShowAllSalles(true);
          }
        } else {
          const allRes = await getSalles(1, 100);
          setSalles(allRes.items);
        }
      } catch (err) {
        try {
          const allRes = await getSalles(1, 100);
          setSalles(allRes.items);
          setShowAllSalles(true);
        } catch (e) {
          toast.error("Impossible de charger les salles.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchSalles();
  }, [isOpen, rattrapage, showAllSalles]);

  useEffect(() => {
    if (!isOpen) {
      setShowAllSalles(false);
      setSelectedSalleId("");
      setSalles([]);
    } else if (rattrapage) {
      setSelectedSalleId(rattrapage.salle_id.toString());
    }
  }, [isOpen, rattrapage]);

  const handleSubmit = async () => {
    if (!rattrapage || !selectedSalleId) return;

    setIsSubmitting(true);
    try {
      await changeRattrapageRoom(rattrapage.id, parseInt(selectedSalleId));
      toast.success("Salle modifiée avec succès.");
      onSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la modification de la salle.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!rattrapage) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px] bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <MapPin className="text-primary" size={20} />
            <span>Changer la salle</span>
          </DialogTitle>
          <DialogDescription className="text-slate-500 mt-1">
            Modifier la salle pour le rattrapage du{" "}
            <span className="font-semibold text-slate-700">
              {rattrapage.date_proposee}
            </span>{" "}
            de {rattrapage.heure_debut.substring(0, 5)} à{" "}
            {rattrapage.heure_fin.substring(0, 5)}.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              {showAllSalles ? "Toutes les salles" : "Salles disponibles pour ce créneau"}
            </label>
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span>Chargement des salles...</span>
              </div>
            ) : (
              <Select value={selectedSalleId} onValueChange={(val) => setSelectedSalleId(val || "")}>
                <SelectTrigger className="w-full bg-slate-50 border-slate-200">
                  <SelectValue placeholder="Sélectionnez une salle" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-slate-200">
                  {salles.map((salle) => (
                    <SelectItem key={salle.id} value={salle.id.toString()}>
                      {salle.nom} (Capacité: {salle.capacite})
                    </SelectItem>
                  ))}
                  {salles.length === 0 && (
                    <div className="p-2 text-center text-xs text-slate-400">
                      Aucune salle trouvée
                    </div>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          <div className="flex justify-between items-center text-xs">
            <button
              type="button"
              onClick={() => setShowAllSalles(!showAllSalles)}
              className="text-primary hover:underline"
            >
              {showAllSalles
                ? "Afficher uniquement les salles disponibles"
                : "Afficher toutes les salles"}
            </button>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Annuler
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedSalleId || selectedSalleId === rattrapage.salle_id.toString()}
            className="bg-primary hover:bg-primary-dark text-white font-medium"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin mr-2" />
                <span>Enregistrement...</span>
              </>
            ) : (
              "Enregistrer"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
