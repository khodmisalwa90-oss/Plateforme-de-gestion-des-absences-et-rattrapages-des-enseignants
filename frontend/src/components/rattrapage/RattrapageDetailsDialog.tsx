"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { RattrapageResponse } from "@/types/rattrapage";
import { RattrapageStatusBadge } from "./RattrapageStatusBadge";
import { Calendar, BookOpen, User, Clock, MapPin, AlignLeft, ShieldCheck } from "lucide-react";
import { formatDate, formatTime } from "@/utils/dateUtils";

interface RattrapageDetailsDialogProps {
  rattrapage: RattrapageResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RattrapageDetailsDialog({
  rattrapage,
  isOpen,
  onClose,
}: RattrapageDetailsDialogProps) {
  if (!rattrapage) return null;

  const absence = rattrapage.absence;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between gap-4">
            <span>Détails du Rattrapage</span>
            <RattrapageStatusBadge status={rattrapage.statut} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Enseignant */}
          {absence?.enseignant && (
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
                <User size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Enseignant</p>
                <p className="text-sm font-semibold text-slate-700">
                  {absence.enseignant.nom} {absence.enseignant.prenom}
                </p>
                <p className="text-xs text-slate-500">{absence.enseignant.email}</p>
              </div>
            </div>
          )}

          {/* Matière */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <BookOpen size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Matière</p>
              <p className="text-sm font-semibold text-slate-700">
                {absence?.matiere?.nom || `Matière ID: ${absence?.matiere_id}`}
              </p>
            </div>
          </div>

          {/* Date Proposée */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date du rattrapage</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatDate(rattrapage.date_proposee)}
              </p>
            </div>
          </div>

          {/* Horaire */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <Clock size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Horaire</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatTime(rattrapage.heure_debut)} - {formatTime(rattrapage.heure_fin)}
              </p>
            </div>
          </div>

          {/* Salle */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Salle</p>
              <p className="text-sm font-semibold text-slate-700">
                {rattrapage.salle?.nom || `Salle ID: ${rattrapage.salle_id}`} {rattrapage.salle?.capacite ? `(Capacité: ${rattrapage.salle.capacite})` : ""}
              </p>
            </div>
          </div>

          {/* Validateur */}
          {rattrapage.statut === "valide" && (
            <div className="flex gap-3 items-start">
              <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                <ShieldCheck size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Validé par</p>
                {rattrapage.validateur ? (
                  <p className="text-sm font-semibold text-slate-700">
                    {rattrapage.validateur.nom} {rattrapage.validateur.prenom}
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-slate-700">Administration</p>
                )}
              </div>
            </div>
          )}

          {/* Absence original details */}
          {absence && (
            <div className="pt-4 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Absence d'origine</p>
              <div className="bg-slate-50 rounded-lg p-3 space-y-2 text-xs text-slate-600 border border-slate-100">
                <div>
                  <span className="font-semibold">Date de l'absence : </span>
                  {formatDate(absence.date_absence, false)}
                </div>
                <div>
                  <span className="font-semibold">Motif : </span>
                  <span className="italic">"{absence.motif}"</span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-slate-100 mt-6">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
