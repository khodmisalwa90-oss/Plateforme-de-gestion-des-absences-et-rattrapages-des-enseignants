"use client";

import React, { useState, useEffect, useCallback } from "react";
import { getMyTimetableAsStudent } from "@/lib/api/emploisDuTemps";
import { EmploiDuTempsResponse } from "@/types/emploiDuTemps";
import { WeeklyTimetable } from "@/components/timetable/WeeklyTimetable";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Calendar, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export default function StudentTimetablePage() {
  const [courses, setCourses] = useState<EmploiDuTempsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getMyTimetableAsStudent(1, 100);
      setCourses(response.items || []);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération de votre emploi du temps");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTimetable();
  }, [loadTimetable]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error) return <ErrorMessage message={error} onRetry={loadTimetable} />;

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader
        title="Mon Emploi du Temps"
        subtitle="Consultez votre planning hebdomadaire de cours et exportez-le en PDF."
        onRefresh={loadTimetable}
        refreshing={loading}
      />

      {/* Timetable Grid Card */}
      <WeeklyTimetable
        courses={courses}
        title={courses.length > 0 ? `Groupe : ${courses[0].groupe?.nom || ""}` : "Mon Groupe"}
        subtitle={courses.length > 0 ? `Département : ${courses[0].matiere?.departement?.nom || ""}` : ""}
      />
    </div>
  );
}
