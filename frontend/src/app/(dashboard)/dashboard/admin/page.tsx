"use client";

import { useState, useEffect, useCallback } from "react";
import {
  RefreshCw,
} from "lucide-react";
import { Bar, BarChart, XAxis, YAxis, CartesianGrid, Pie, PieChart, Cell, Label } from "recharts";
import { getAdminStats } from "@/lib/api/dashboard";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { ErrorMessage } from "@/components/ui/error-message";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/Card";
import { AdminStats } from "@/types/dashboard";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

const usersPieConfig = {
  enseignants: {
    label: "Enseignants",
    color: "var(--chart-1)",
  },
  etudiants: {
    label: "Étudiants",
    color: "var(--chart-2)",
  },
  administrations: {
    label: "Staff Admin",
    color: "var(--chart-3)",
  },
} satisfies ChartConfig;

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

const resourcesConfig = {
  salles: {
    label: "Salles",
    color: "var(--chart-1)",
  },
  groupes: {
    label: "Groupes",
    color: "var(--chart-2)",
  },
  matieres: {
    label: "Matières",
    color: "var(--chart-3)",
  },
  cours: {
    label: "Cours / Semaine",
    color: "var(--chart-4)",
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

export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAdminStats();
      setStats(data);
    } catch (err: any) {
      setError(err.message || "Erreur lors de la récupération des statistiques");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  if (loading) return <LoadingSpinner className="min-h-[60vh]" />;
  if (error) return <ErrorMessage message={error} onRetry={loadStats} />;
  if (!stats) return null;

  const totalUsers = stats.users?.total_users || 0;
  const usersPieData = [
    { name: "etudiants", value: stats.users?.total_etudiants || 0, fill: "var(--color-etudiants)" },
    { name: "enseignants", value: stats.users?.total_enseignants || 0, fill: "var(--color-enseignants)" },
    { name: "administrations", value: stats.users?.total_administrations || 0, fill: "var(--color-administrations)" },
  ];

  const totalAbsences = stats.absences?.total_absences || 0;
  const absencesPieData = [
    { name: "validees", value: stats.absences?.absences_validees || 0, fill: "var(--color-validees)" },
    { name: "en_attente", value: stats.absences?.absences_en_attente || 0, fill: "var(--color-en_attente)" },
    { name: "rejetees", value: stats.absences?.absences_rejetees || 0, fill: "var(--color-rejetees)" },
  ];

  const totalRattrapages = stats.rattrapages?.total_rattrapages || 0;
  const rattrapagesPieData = [
    { name: "valides", value: stats.rattrapages?.rattrapages_valides || 0, fill: "var(--color-valides)" },
    { name: "proposes", value: stats.rattrapages?.rattrapages_proposes || 0, fill: "var(--color-proposes)" },
    { name: "annules", value: stats.rattrapages?.rattrapages_annules || 0, fill: "var(--color-annules)" },
  ];

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

  const resourcesData = [
    { name: "Salles", count: stats.salles_et_cours?.total_salles || 0, fill: "var(--color-salles)" },
    { name: "Groupes", count: stats.salles_et_cours?.total_groupes || 0, fill: "var(--color-groupes)" },
    { name: "Matières", count: stats.salles_et_cours?.total_matieres || 0, fill: "var(--color-matieres)" },
    { name: "Cours / Sem.", count: stats.salles_et_cours?.total_cours_par_semaine || 0, fill: "var(--color-cours)" },
  ];

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      {/* Premium Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 font-poppins">Administrateur</h1>
          <p className="text-sm text-slate-500 font-medium mt-0.5">Tableau de bord de supervision et planification</p>
        </div>
        <Button onClick={loadStats} variant="outline" size="sm" className="gap-2 self-start md:self-auto shadow-sm">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          Actualiser les données
        </Button>
      </div>

      {/* Main visual metric rings - replaces old text cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Users Donut */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition des Utilisateurs</CardTitle>
            <CardDescription className="text-xs">Utilisateurs actifs dans l'établissement</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-center gap-6 pt-2">
            <div className="w-full sm:w-1/2 flex justify-center">
              <ChartContainer config={usersPieConfig} className="h-[170px] w-[170px] shrink-0">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                  <Pie
                    data={usersPieData}
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
                                {totalUsers}
                              </tspan>
                              <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 16} className="fill-slate-400 text-[10px] font-semibold uppercase tracking-wider">
                                Comptes
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
              {usersPieData.map((item) => {
                const config = usersPieConfig[item.name as keyof typeof usersPieConfig];
                const pct = totalUsers ? Math.round((item.value / totalUsers) * 100) : 0;
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

        {/* Absences Donut */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition des Absences</CardTitle>
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
                                {totalAbsences}
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
                const pct = totalAbsences ? Math.round((item.value / totalAbsences) * 100) : 0;
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

        {/* Rattrapages Donut */}
        <Card className="border-none shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold text-slate-800">Répartition des Rattrapages</CardTitle>
            <CardDescription className="text-xs">Statut de planification des rattrapages</CardDescription>
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
                                {totalRattrapages}
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
                const pct = totalRattrapages ? Math.round((item.value / totalRattrapages) * 100) : 0;
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

      {/* Middle section: Monthly Tendency Comparison Chart */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-4 gap-2">
          <div>
            <CardTitle className="text-lg font-bold text-slate-800">Activité Mensuelle Globale</CardTitle>
            <CardDescription className="text-xs">Comparaison chronologique entre absences signalées et séances de rattrapage programmées</CardDescription>
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

      {/* Infrastructure and Planification - replaces old text cards */}
      <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg font-bold text-slate-800">Infrastructure & Capacité Académique</CardTitle>
          <CardDescription className="text-xs">Ressources allouées et volume de planification hebdomadaire</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">

          {/* Horizontal comparison bar chart */}
          <div className="lg:col-span-6 flex flex-col justify-center">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Volume comparatif</h3>
            <ChartContainer config={resourcesConfig} className="h-[220px] w-full">
              <BarChart data={resourcesData} layout="vertical" accessibilityLayer margin={{ left: 5, right: 10 }}>
                <CartesianGrid horizontal={false} strokeDasharray="3 3" className="stroke-slate-100" />
                <XAxis type="number" tickLine={false} axisLine={false} allowDecimals={false} className="text-slate-400 font-medium" />
                <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={80} className="font-semibold text-slate-600" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]} maxBarSize={30}>
                  {resourcesData.map((entry, index) => {
                    const keys = ["salles", "groupes", "matieres", "cours"];
                    return <Cell key={`cell-${index}`} fill={`var(--color-${keys[index]})`} />;
                  })}
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>

          {/* Interactive resource indicators */}
          <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">

            {/* Salles */}
            <div className="p-4 bg-slate-50/50 rounded-2xl flex flex-col justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Salles de cours</span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-poppins">
                  {stats.salles_et_cours?.total_salles || 0}
                </span>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Salles physiques disponibles</p>
                {/* Visual indicator bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: "40%" }} />
                </div>
              </div>
            </div>

            {/* Matières */}
            <div className="p-4 bg-slate-50/50 rounded-2xl flex flex-col justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Matières Enseignées</span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-poppins">
                  {stats.salles_et_cours?.total_matieres || 0}
                </span>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Cours et matières au catalogue</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full" style={{ width: "65%" }} />
                </div>
              </div>
            </div>

            {/* Groupes */}
            <div className="p-4 bg-slate-50/50 rounded-2xl flex flex-col justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Groupes d'Études</span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-poppins">
                  {stats.salles_et_cours?.total_groupes || 0}
                </span>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Classes d'étudiants distinctes</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: "50%" }} />
                </div>
              </div>
            </div>

            {/* Cours / Semaine */}
            <div className="p-4 bg-slate-50/50 rounded-2xl flex flex-col justify-between border border-slate-100 hover:bg-slate-50 transition-colors">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Volume Horaire</span>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-extrabold text-slate-800 tracking-tight font-poppins">
                  {stats.salles_et_cours?.total_cours_par_semaine || 0}
                </span>
                <p className="text-[10px] text-slate-400 font-medium mt-1">Séances hebdomadaires programmées</p>
                <div className="w-full h-1.5 bg-slate-100 rounded-full mt-3 overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: "80%" }} />
                </div>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>
    </div>
  );
}
