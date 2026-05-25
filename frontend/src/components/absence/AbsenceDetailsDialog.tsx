"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/Button";
import { AbsenceResponse } from "@/types/absence";
import { AbsenceStatusBadge } from "./AbsenceStatusBadge";
import { Calendar, BookOpen, User, FileText, Clock, AlignLeft } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

interface AbsenceDetailsDialogProps {
  absence: AbsenceResponse | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AbsenceDetailsDialog({
  absence,
  isOpen,
  onClose,
}: AbsenceDetailsDialogProps) {
  if (!absence) return null;

  const getJustificatifUrl = (justificatif: string) => {
    if (justificatif.startsWith("http://") || justificatif.startsWith("https://")) {
      return justificatif;
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";
    const baseUrl = apiUrl.replace("/api/v1", "");
    return `${baseUrl}/uploads/${justificatif}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px] bg-white rounded-xl shadow-lg border border-slate-100 p-6">
        <DialogHeader className="border-b border-slate-100 pb-4 mb-4">
          <DialogTitle className="text-xl font-bold text-slate-900 flex items-center justify-between gap-4">
            <span>Détails de l'absence</span>
            <AbsenceStatusBadge status={absence.statut} />
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Enseignant */}
          {absence.enseignant && (
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
                {absence.matiere?.nom || `ID Matière: ${absence.matiere_id}`}
              </p>
            </div>
          </div>

          {/* Date */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Date de l'absence</p>
              <p className="text-sm font-semibold text-slate-700">
                {formatDate(absence.date_absence, false)}
              </p>
            </div>
          </div>

          {/* Motif */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <AlignLeft size={16} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Motif / Raison</p>
              <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-wrap mt-1">
                {absence.motif}
              </p>
            </div>
          </div>

          {/* Justificatif */}
          <div className="flex gap-3 items-start">
            <div className="p-2 bg-slate-50 text-slate-500 rounded-lg">
              <FileText size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pièce justificative</p>
              {absence.justificatif ? (
                <div className="mt-1">
                  <a
                    href={getJustificatifUrl(absence.justificatif)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline hover:text-primary-dark"
                  >
                    <span>Consulter le justificatif</span>
                    <span className="text-xs text-slate-400 font-normal">({absence.justificatif.split(".").pop()?.toUpperCase()})</span>
                  </a>
                </div>
              ) : (
                <p className="text-sm text-slate-500 italic mt-0.5">Aucun document justificatif fourni.</p>
              )}
            </div>
          </div>

          {/* Date de création / modification */}
          <div className="flex gap-3 items-start pt-2 border-t border-slate-100">
            <div className="p-2 text-slate-400">
              <Clock size={14} />
            </div>
            <div className="grid grid-cols-2 gap-4 text-xs text-slate-400">
              <div>
                <p>Déclarée le :</p>
                <p className="font-medium text-slate-500">
                  {new Date(absence.created_at).toLocaleString("fr-FR")}
                </p>
              </div>
              {absence.updated_at && absence.updated_at !== absence.created_at && (
                <div>
                  <p>Modifiée le :</p>
                  <p className="font-medium text-slate-500">
                    {new Date(absence.updated_at).toLocaleString("fr-FR")}
                  </p>
                </div>
              )}
            </div>
          </div>
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
