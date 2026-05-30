import React from "react";
import Link from "next/link";
import {
  Calendar,
  Bell,
  BarChart3,
  Users,
  ArrowRight,
  CheckCircle2,
  Clock,
  FileText
} from "lucide-react";
import Container from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden bg-white">
        <div className="absolute top-0 left-0 w-full h-full bg-slate-50/50 -z-10" />
        <Container>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                Nouveau : Système de Rattrapage Optimisé
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6 leading-[1.1]">
                Gérez les absences et organisez les <span className="text-primary">rattrapages</span> facilement.
              </h1>
              <p className="text-lg text-slate-secondary mb-10 leading-relaxed max-w-xl">
                La plateforme intelligente pour les établissements d'enseignement qui simplifie la gestion administrative, améliore la communication et optimise les emplois du temps.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/login">
                  <Button size="lg" className="gap-2">
                    Commencer maintenant <ArrowRight size={20} />
                  </Button>
                </Link>
                <Link href="/features">
                  <Button variant="outline" size="lg" className="border-primary text-primary hover:bg-primary hover:text-white">
                    Découvrir les fonctionnalités
                  </Button>
                </Link>
              </div>
            </div>

            <div className="hidden lg:block relative">
              <div className="bg-gradient-to-tr from-primary to-secondary rounded-3xl p-4 shadow-2xl rotate-2">
                <div className="bg-white rounded-2xl p-8 -rotate-2">
                  <div className="flex justify-between items-center mb-8">
                    <h3 className="font-bold text-xl">Tableau de Bord</h3>
                    <div className="flex gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-400"></div>
                      <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                      <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                  </div>
                  <div className="space-y-6">
                    {[
                      { icon: <Calendar className="text-blue-500" />, label: "Nouvelle Absence", status: "En attente", color: "bg-amber-100 text-amber-700" },
                      { icon: <Clock className="text-green-500" />, label: "Rattrapage Validé", status: "Terminé", color: "bg-green-100 text-green-700" },
                      { icon: <Users className="text-purple-500" />, label: "Affectation Groupe", status: "Réussi", color: "bg-blue-100 text-blue-700" }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-white rounded-lg shadow-sm">{item.icon}</div>
                          <span className="font-semibold text-slate-primary">{item.label}</span>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${item.color}`}>{item.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Features Grid */}
      <section className="py-24 bg-neutral-background">
        <Container>
          <div className="text-center max-w-3xl mx-auto mb-20">
            <h2 className="text-3xl md:text-4xl mb-6">Tout ce dont vous avez besoin pour une gestion efficace</h2>
            <p className="text-slate-secondary">
              Une solution centralisée pour automatiser les flux de travail complexes entre l'administration, les enseignants et les étudiants.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: FileText, title: "Déclaration Simplifiée", desc: "Les enseignants déclarent leurs absences en quelques clics avec justificatifs." },
              { icon: CheckCircle2, title: "Validation Agile", desc: "L'administration examine et valide les demandes via une interface intuitive." },
              { icon: Calendar, title: "Planning Intelligent", desc: "Recherche automatique de créneaux et de salles disponibles pour les rattrapages." },
              { icon: Bell, title: "Notifications Auto", desc: "Tout le monde est informé en temps réel des changements d'emploi du temps." }
            ].map((feature, i) => (
              <Card key={i} className="hover:border-primary transition-all duration-300 group">
                <CardHeader className="pb-2">
                  <div className="bg-blue-50 text-primary p-3 rounded-xl w-fit mb-2 group-hover:bg-primary group-hover:text-white transition-colors">
                    <feature.icon size={28} />
                  </div>
                  <CardTitle className="text-lg font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-slate-secondary text-sm leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48" />
        <Container>
          <div className="text-center text-white relative z-10">
            <h2 className="text-3xl md:text-5xl font-bold mb-8 text-white">Prêt à moderniser votre établissement ?</h2>
            <p className="text-blue-100 text-lg mb-12 max-w-2xl mx-auto">
              Rejoignez les dizaines d'universités qui optimisent déjà leur gestion académique avec GestionAbsences
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <Button size="lg" className="bg-white text-primary hover:bg-slate-100 border-none px-10 h-14 text-lg">
                Demander une démo
              </Button>
              <Button size="lg" className="bg-white/10 text-white hover:bg-white/20 border-white/20 px-10 h-14 text-lg backdrop-blur-sm">
                Nous contacter
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}
