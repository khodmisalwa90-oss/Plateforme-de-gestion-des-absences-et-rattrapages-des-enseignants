"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { getStudentStats } from "@/lib/api/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { StudentStats } from "@/types/dashboard";
import { formatTime } from "@/utils/dateUtils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Pie, PieChart, Cell, Bar, BarChart, XAxis, YAxis, CartesianGrid, Label } from "recharts";

const volumePieConfig = {
  cours: {
    label: "Cours / Semaine",
    color: "var(--chart-1)",
  },
  rattrapages_a_venir: {
    label: "Rattrapages à venir",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const absencesPieConfig = {
  validees: {
    label: "Validées",
    color: "var(--chart-3)",
  },
  en_attente: {
    label: "En attente",
    color: "var(--chart-4)",
  },
  rejetees: {
    label: "Rejetées",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const rattrapagesPieConfig = {
  valides: {
    label: "Confirmés",
    color: "var(--chart-3)",
  },
  proposes: {
    label: "Proposés",
    color: "var(--chart-2)",
  },
  annules: {
    label: "Annulés / Autres",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const overviewConfig = {
  cours: {
    label: "Cours / Semaine",
    color: "var(--chart-1)",
  },
  absences: {
    label: "Absences Enseignants",
    color: "var(--chart-5)",
  },
  rattrapages: {
    label: "Rattrapages",
    color: "var(--chart-3)",
  },
  avenir: {
    label: "Séances À Venir",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

function parseDateForBadge(dateStr: string) {
  try {
    if (!dateStr) return { day: "", month: "", fullDate: "" };
    const parts = dateStr.split("-");
    if (parts.length !== 3) return { day: dateStr, month: "", fullDate: dateStr };
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);

    const d = new Date(year, monthIndex, day);
    if (isNaN(d.getTime())) return { day: dateStr, month: "", fullDate: dateStr };

    const dayStr = d.getDate().toString();
    const monthStr = d.toLocaleDateString("fr-FR", { month: "short" });
    const fullDate = d.toLocaleDateString("fr-FR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    return {
      day: dayStr,
      month: monthStr.replace(".", ""),
      fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1)
    };
  } catch {
    return { day: dateStr, month: "", fullDate: dateStr };
  }
}

export default function StudentDashboard() {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getStudentStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error) return <ErrorMessage message={error} onRetry={loadData} />;
  if (!stats) return null;

  const totalCours = stats.cours?.total_cours_par_semaine || 0;
  const aVenirVal = stats.rattrapages?.a_venir || 0;
  const totalVolume = totalCours + aVenirVal;
  const volumePieData = [
    { name: "cours", value: totalCours, fill: "var(--color-cours)" },
    { name: "rattrapages_a_venir", value: aVenirVal, fill: "var(--color-rattrapages_a_venir)" },
  ];

  const absValidees = stats.absences_enseignants?.validees || 0;
  const absEnAttente = stats.absences_enseignants?.en_attente || 0;
  const absTotal = stats.absences_enseignants?.total || 0;
  const absRejetees = Math.max(0, absTotal - (absValidees + absEnAttente));
  const absencesPieData = [
    { name: "validees", value: absValidees, fill: "var(--color-validees)" },
    { name: "en_attente", value: absEnAttente, fill: "var(--color-en_attente)" },
    { name: "rejetees", value: absRejetees, fill: "var(--color-rejetees)" },
  ];

  const ratValides = stats.rattrapages?.valides || 0;
  const ratProposes = stats.rattrapages?.proposes || 0;
  const ratTotal = stats.rattrapages?.total || 0;
  const ratAnnules = Math.max(0, ratTotal - (ratValides + ratProposes));
  const rattrapagesPieData = [
    { name: "valides", value: ratValides, fill: "var(--color-valides)" },
    { name: "proposes", value: ratProposes, fill: "var(--color-proposes)" },
    { name: "annules", value: ratAnnules, fill: "var(--color-annules)" },
  ];

  const overviewData = [
    { name: "Cours / Sem.", value: totalCours, fill: "var(--color-cours)" },
    { name: "Absences Profs", value: absTotal, fill: "var(--color-absences)" },
    { name: "Rattrapages", value: ratTotal, fill: "var(--color-rattrapages)" },
    { name: "Séances À Venir", value: aVenirVal, fill: "var(--color-avenir)" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Header aligned with admin dashboard theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-poppins">Étudiant</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Tableau de bord de suivi des cours et des rattrapages</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2 self-start md:self-auto shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser les données
        </Button>
      </div>

      {/* 3-column donut chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut 1: Volume Hebdomadaire */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Planning Hebdomadaire</CardTitle>
            <CardDescription className="text-xs">
              {stats.cours?.groupes_appartenance?.length
                ? `Groupes : ${stats.cours.groupes_appartenance.join(", ")}`
                : "Séances planifiées pour cette semaine"}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ChartContainer config={volumePieConfig} className="h-[170px] w-[170px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={volumePieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    strokeWidth={3}
                    stroke="var(--card)"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-2xl font-extrabold font-poppins">
                                {totalVolume}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Séances
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-3">
              {volumePieData.map((item) => {
                const config = volumePieConfig[item.name as keyof typeof volumePieConfig];
                const pct = totalVolume ? Math.round((item.value / totalVolume) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-none last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: `var(--color-${item.name})` }} />
                      <span className="text-slate-500 font-medium">{config?.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 mr-1.5">{item.value}</span>
                      <span className="text-slate-400 text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Donut 2: Absences Enseignants */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Absences Enseignants</CardTitle>
            <CardDescription className="text-xs">Statut de validation des absences déclarées</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ChartContainer config={absencesPieConfig} className="h-[170px] w-[170px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={absencesPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    strokeWidth={3}
                    stroke="var(--card)"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-2xl font-extrabold font-poppins">
                                {absTotal}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Absences
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-3">
              {absencesPieData.map((item) => {
                const config = absencesPieConfig[item.name as keyof typeof absencesPieConfig];
                const pct = absTotal ? Math.round((item.value / absTotal) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-none last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: `var(--color-${item.name})` }} />
                      <span className="text-slate-500 font-medium">{config?.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 mr-1.5">{item.value}</span>
                      <span className="text-slate-400 text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Donut 3: Rattrapages */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition des Rattrapages</CardTitle>
            <CardDescription className="text-xs">Statut de planification de vos séances de rattrapage</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ChartContainer config={rattrapagesPieConfig} className="h-[170px] w-[170px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={rattrapagesPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={68}
                    strokeWidth={3}
                    stroke="var(--card)"
                  >
                    <Label
                      content={({ viewBox }) => {
                        if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                          return (
                            <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                              <tspan x={viewBox.cx} y={viewBox.cy} className="fill-slate-900 text-2xl font-extrabold font-poppins">
                                {ratTotal}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Séances
                              </tspan>
                            </text>
                          );
                        }
                        return null;
                      }}
                    />
                  </Pie>
                </PieChart>
              </ChartContainer>
            </div>

            <div className="w-full sm:w-1/2 space-y-3">
              {rattrapagesPieData.map((item) => {
                const config = rattrapagesPieConfig[item.name as keyof typeof rattrapagesPieConfig];
                const pct = ratTotal ? Math.round((item.value / ratTotal) * 100) : 0;
                return (
                  <div key={item.name} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-none last:pb-0">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: `var(--color-${item.name})` }} />
                      <span className="text-slate-500 font-medium">{config?.label}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-slate-800 mr-1.5">{item.value}</span>
                      <span className="text-slate-400 text-[10px]">({pct}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Column: List of Upcoming Rattrapages */}
        <Card className="border-none shadow-sm lg:col-span-2 flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-6">
            <div className="space-y-1">
              <CardTitle className="text-lg font-bold text-slate-800 font-poppins">Prochaines Séances de Rattrapage</CardTitle>
              <CardDescription className="text-xs text-slate-400 font-medium">Vos séances planifiées à venir en format calendrier.</CardDescription>
            </div>
            <Link href="/dashboard/etudiant/rattrapages">
              <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 text-xs font-bold rounded-xl px-4 py-2 transition-all">
                Voir tout
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="h-full flex flex-col justify-start">
            {stats.list_rattrapages_a_venir && stats.list_rattrapages_a_venir.length > 0 ? (
              <div className="space-y-4">
                {stats.list_rattrapages_a_venir.map((item, index) => {
                  const { day, month, fullDate } = parseDateForBadge(item.date);
                  return (
                    <div
                      key={index}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50/90 border border-slate-100/80 rounded-2xl gap-4 hover:shadow-xs transition-all duration-200"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        {/* Calendar Badge */}
                        <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center font-poppins shrink-0 shadow-xs">
                          <span className="text-lg font-extrabold text-slate-800 leading-none">{day}</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mt-1">{month}</span>
                        </div>
                        {/* Matter & Session Details */}
                        <div className="min-w-0">
                          <span className="font-bold text-slate-800 text-sm block truncate">{item.matiere}</span>
                          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500 font-medium mt-1">
                            <span className="truncate">{fullDate}</span>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            <span className="shrink-0">{formatTime(item.heure_debut)} - {formatTime(item.heure_fin)}</span>
                            <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                            <span className="truncate font-semibold text-slate-600">Salle {item.salle}</span>
                          </div>
                        </div>
                      </div>
                      <div className="self-end sm:self-auto shrink-0">
                        <Badge className="bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-50 text-xs px-3 py-1 font-semibold rounded-full shadow-none">
                          Confirmé
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 flex flex-col items-center justify-center h-full">
                <p className="text-slate-400 font-semibold text-sm">Aucune séance de rattrapage prévue prochainement.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Column: Bilan Académique & Details */}
        <Card className="border-none shadow-sm lg:col-span-1 hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-slate-800 font-poppins">Bilan Académique</CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">Comparaison des indicateurs de votre profil.</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <ChartContainer config={overviewConfig} className="h-[210px] w-full">
              <BarChart data={overviewData} layout="vertical" margin={{ left: 5, right: 10, top: 0, bottom: 0 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-slate-100" />
                <XAxis type="number" tickLine={false} axisLine={false} className="text-slate-400 text-[10px]" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} className="text-slate-500 font-bold text-[10px]" width={85} />
                <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={22}>
                  {overviewData.map((entry, idx) => {
                    const keys = ["cours", "absences", "rattrapages", "avenir"];
                    return <Cell key={`cell-${idx}`} fill={`var(--color-${keys[idx]})`} />;
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>

            <div className="space-y-4 mt-6 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Total Cours suivis</span>
                <span className="font-bold text-slate-800 bg-slate-50 border border-slate-100 px-2.5 py-1 rounded-lg">
                  {stats.cours?.matieres_suivies?.length || 0} matière{stats.cours?.matieres_suivies?.length && stats.cours.matieres_suivies.length > 1 ? "s" : ""}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Matières suivies</span>
                <span className="font-bold text-slate-800 truncate max-w-[170px]" title={stats.cours?.matieres_suivies?.join(", ") || ""}>
                  {stats.cours?.matieres_suivies?.join(", ") || "Aucune"}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 font-semibold">Absences profs en attente</span>
                <span className="font-bold text-slate-800 bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">
                  {absEnAttente}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
