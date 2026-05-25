"use client";

import React, { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { Pie, PieChart, Bar, BarChart, XAxis, YAxis, CartesianGrid, Cell, Label } from "recharts";
import { getTeacherStats } from "@/lib/api/dashboard";
import { getUpcomingRattrapages } from "@/lib/api/rattrapages";
import { RattrapageResponse } from "@/types/rattrapage";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { TeacherStats } from "@/types/dashboard";
import { formatDate, formatTime } from "@/utils/dateUtils";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

// --- Chart Configs (CSS theme variables, matching admin/student pages) ---

const absencesPieConfig = {
  en_attente: {
    label: "En attente",
    color: "var(--chart-4)",
  },
  validees: {
    label: "Validées",
    color: "var(--chart-3)",
  },
  rejetees: {
    label: "Rejetées",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const rattrapagesPieConfig = {
  proposes: {
    label: "Proposés",
    color: "var(--chart-2)",
  },
  valides: {
    label: "Confirmés",
    color: "var(--chart-3)",
  },
  annules: {
    label: "Annulés",
    color: "var(--chart-5)",
  },
} satisfies ChartConfig;

const coursConfig = {
  cours: {
    label: "Cours / Semaine",
    color: "var(--chart-1)",
  },
  groupes: {
    label: "Groupes enseignés",
    color: "var(--chart-2)",
  },
} satisfies ChartConfig;

const activityChartConfig = {
  absences: {
    label: "Absences",
    color: "var(--chart-1)",
  },
  rattrapages: {
    label: "Rattrapages",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

function formatMonth(monthStr: string) {
  const months: Record<string, string> = {
    "01": "Jan", "02": "Fév", "03": "Mar", "04": "Avr",
    "05": "Mai", "06": "Juin", "07": "Juil", "08": "Août",
    "09": "Sep", "10": "Oct", "11": "Nov", "12": "Déc",
  };
  const parts = monthStr.split("-");
  return months[parts[1]] || monthStr;
}

// Safe local date parsing to prevent UTC-based timezone shifts
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
      fullDate: fullDate.charAt(0).toUpperCase() + fullDate.slice(1),
    };
  } catch {
    return { day: dateStr, month: "", fullDate: dateStr };
  }
}

export default function TeacherDashboard() {
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [upcoming, setUpcoming] = useState<RattrapageResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [statsData, upcomingData] = await Promise.all([
        getTeacherStats(),
        getUpcomingRattrapages(1, 5)
      ]);
      setStats(statsData);
      setUpcoming(upcomingData.items || []);
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

  // Donut 1: Absences
  const absTotal = stats.absences?.total_absences || 0;
  const absValidees = stats.absences?.absences_validees || 0;
  const absEnAttente = stats.absences?.absences_en_attente || 0;
  const absRejetees = stats.absences?.absences_rejetees || 0;
  const absencesPieData = [
    { name: "validees", value: absValidees, fill: "var(--color-validees)" },
    { name: "en_attente", value: absEnAttente, fill: "var(--color-en_attente)" },
    { name: "rejetees", value: absRejetees, fill: "var(--color-rejetees)" },
  ];

  // Donut 2: Rattrapages
  const ratTotal = stats.rattrapages?.total_rattrapages || 0;
  const ratValides = stats.rattrapages?.rattrapages_valides || 0;
  const ratProposes = stats.rattrapages?.rattrapages_proposes || 0;
  const ratAnnules = stats.rattrapages?.rattrapages_annules || 0;
  const rattrapagesPieData = [
    { name: "valides", value: ratValides, fill: "var(--color-valides)" },
    { name: "proposes", value: ratProposes, fill: "var(--color-proposes)" },
    { name: "annules", value: ratAnnules, fill: "var(--color-annules)" },
  ];

  // Donut 3: Charge de cours
  const totalCours = stats.cours?.total_cours_par_semaine || 0;
  const totalGroupes = stats.cours?.groupes_enseignes?.length || 0;
  const totalCharge = totalCours + totalGroupes;
  const coursPieData = [
    { name: "cours", value: totalCours, fill: "var(--color-cours)" },
    { name: "groupes", value: totalGroupes, fill: "var(--color-groupes)" },
  ];

  // Monthly activity chart data
  const monthlyDataMap: Record<string, { monthLabel: string; absences: number; rattrapages: number }> = {};

  (stats.absences?.absences_par_mois || []).forEach((item) => {
    monthlyDataMap[item.month] = {
      monthLabel: formatMonth(item.month),
      absences: item.count,
      rattrapages: 0,
    };
  });

  (stats.rattrapages?.rattrapages_par_mois || []).forEach((item) => {
    if (monthlyDataMap[item.month]) {
      monthlyDataMap[item.month].rattrapages = item.count;
    } else {
      monthlyDataMap[item.month] = {
        monthLabel: formatMonth(item.month),
        absences: 0,
        rattrapages: item.count,
      };
    }
  });

  const activityChartData = Object.keys(monthlyDataMap)
    .sort()
    .map((key) => ({
      month: monthlyDataMap[key].monthLabel,
      absences: monthlyDataMap[key].absences,
      rattrapages: monthlyDataMap[key].rattrapages,
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Header — matching admin/student common theme */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-poppins">Enseignant</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Gérez vos absences et planifiez vos rattrapages</p>
        </div>
        <Button onClick={loadData} variant="outline" size="sm" className="gap-2 self-start md:self-auto shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser les données
        </Button>
      </div>

      {/* 3-column donut chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Donut 1: Mes Absences */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition des Absences</CardTitle>
            <CardDescription className="text-xs">Statut de validation de vos absences déclarées</CardDescription>
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

        {/* Donut 2: Mes Rattrapages */}
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

        {/* Donut 3: Charge de Cours */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Charge de Cours</CardTitle>
            <CardDescription className="text-xs">Volume hebdomadaire et groupes enseignés</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ChartContainer config={coursConfig} className="h-[170px] w-[170px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={coursPieData}
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
                                {totalCharge}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Total
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
              {coursPieData.map((item) => {
                const config = coursConfig[item.name as keyof typeof coursConfig];
                const pct = totalCharge ? Math.round((item.value / totalCharge) * 100) : 0;
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
              {/* Groupes list */}
              <div className="pt-2 border-t border-slate-100 mt-1">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Groupes</span>
                <p className="text-xs font-bold text-slate-700 mt-1 truncate" title={stats.cours?.groupes_enseignes?.join(", ") || ""}>
                  {stats.cours?.groupes_enseignes?.join(", ") || "Aucun groupe"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Monthly Activity Bar Chart — matches admin dashboard structure */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Activité Mensuelle</CardTitle>
            <CardDescription className="text-xs">Comparaison chronologique entre vos absences et vos séances de rattrapage</CardDescription>
          </div>

          <div className="flex gap-4 text-xs font-semibold text-slate-500 self-start sm:self-auto pt-1 sm:pt-0">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-primary shrink-0" />
              <span>Absences</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 shrink-0" />
              <span>Rattrapages</span>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {activityChartData.length > 0 ? (
            <ChartContainer config={activityChartConfig} className="h-[280px] w-full">
              <BarChart data={activityChartData} accessibilityLayer>
                <CartesianGrid vertical={false} strokeDasharray="3 3" className="stroke-slate-100" />
                <XAxis dataKey="month" tickLine={false} tickMargin={10} axisLine={false} className="text-slate-400 font-medium" />
                <YAxis tickLine={false} axisLine={false} allowDecimals={false} className="text-slate-400 font-medium" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="absences" fill="var(--color-absences)" radius={[4, 4, 0, 0]} maxBarSize={45} />
                <Bar dataKey="rattrapages" fill="var(--color-rattrapages)" radius={[4, 4, 0, 0]} maxBarSize={45} />
              </BarChart>
            </ChartContainer>
          ) : (
            <div className="flex flex-col items-center justify-center h-[280px] text-slate-400 text-sm gap-2">
              <span>Aucune tendance historique disponible</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upcoming Rattrapages — calendar-badge timeline layout matching student page */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-row items-center justify-between pb-6">
          <div className="space-y-1">
            <CardTitle className="text-lg font-bold text-slate-800 font-poppins">Rattrapages à Venir</CardTitle>
            <CardDescription className="text-xs text-slate-400 font-medium">Vos prochaines séances de rattrapage planifiées.</CardDescription>
          </div>
          <Link href="/dashboard/enseignant/rattrapages">
            <Button variant="ghost" size="sm" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50 text-xs font-bold rounded-xl px-4 py-2 transition-all">
              Voir tout
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((item) => {
                const { day, month, fullDate } = parseDateForBadge(item.date_proposee);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-slate-50/40 hover:bg-slate-50/90 border border-slate-100/80 rounded-2xl gap-4 hover:shadow-xs transition-all duration-200"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* Calendar Badge */}
                      <div className="w-12 h-12 bg-white border border-slate-200 rounded-xl flex flex-col items-center justify-center font-poppins shrink-0 shadow-xs">
                        <span className="text-lg font-extrabold text-slate-800 leading-none">{day}</span>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide leading-none mt-1">{month}</span>
                      </div>
                      {/* Details */}
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 text-sm block truncate">
                          {item.absence?.matiere?.nom || "Non spécifiée"}
                        </span>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-xs text-slate-500 font-medium mt-1">
                          <span className="truncate">{fullDate}</span>
                          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                          <span className="shrink-0">{formatTime(item.heure_debut)} - {formatTime(item.heure_fin)}</span>
                          <span className="hidden sm:inline w-1 h-1 rounded-full bg-slate-300 shrink-0" />
                          <span className="truncate font-semibold text-slate-600">Salle {item.salle?.nom || "A définir"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="self-end sm:self-auto shrink-0">
                      <Badge
                        className={
                          item.statut === "valide"
                            ? "bg-emerald-50 text-emerald-700 border-none hover:bg-emerald-50 text-xs px-3 py-1 font-semibold rounded-full shadow-none"
                            : "bg-amber-50 text-amber-700 border-none hover:bg-amber-50 text-xs px-3 py-1 font-semibold rounded-full shadow-none"
                        }
                      >
                        {item.statut === "valide" ? "Confirmé" : "En attente"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 flex flex-col items-center justify-center">
              <p className="text-slate-400 font-semibold text-sm">Aucun rattrapage programmé pour le moment.</p>
              <Link href="/dashboard/enseignant/rattrapages?tab=propose">
                <Button variant="link" className="text-primary mt-2 text-xs font-bold">
                  Proposer un rattrapage
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
