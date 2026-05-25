import React from "react";
import { Target, Zap, ShieldCheck } from "lucide-react";
import Container from "@/components/ui/Container";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";

export default function AboutPage() {
  return (
    <div className="py-20 bg-background">
      <Container>
        {/* Header */}
        <div className="max-w-3xl mb-20">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            Notre Vision
          </Badge>
          <h1 className="text-4xl md:text-5xl mb-6">À propos de notre engagement</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AbsenceFlow est née d'un constat simple : la gestion manuelle des absences et des rattrapages dans l'enseignement supérieur est source d'erreurs, de stress et de perte de temps pour tous les acteurs impliqués.
          </p>
        </div>

        {/* Vision/Mission */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center mb-32">
          <div className="space-y-8">
            {[
              { icon: Target, title: "Notre Mission", desc: "Digitaliser et fluidifier les processus académiques pour permettre aux enseignants de se concentrer sur la pédagogie.", color: "bg-blue-50 text-blue-600" },
              { icon: Zap, title: "L'Innovation IA", desc: "Nous utilisons des algorithmes intelligents pour détecter instantanément les conflits d'emploi du temps et suggérer les meilleures alternatives.", color: "bg-amber-50 text-amber-600" },
              { icon: ShieldCheck, title: "Fiabilité & Transparence", desc: "Une traçabilité complète de chaque action garantit une équité et une clarté totale pour les enseignants et les étudiants.", color: "bg-green-50 text-green-600" }
            ].map((item, i) => (
              <Card key={i} className="border-none shadow-none bg-transparent">
                <CardHeader className="flex flex-row items-center gap-8 p-0 space-y-0">
                  <div className={`flex-shrink-0 p-4 rounded-2xl ${item.color}`}>
                    <item.icon size={32} />
                  </div>
                  <div className="space-y-2">
                    <CardTitle className="text-2xl font-bold">{item.title}</CardTitle>
                    <p className="text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
          
          <Card className="aspect-square relative overflow-hidden flex items-center justify-center p-12 bg-slate-900 border-none text-white shadow-2xl rounded-[2.5rem]">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="text-center relative z-10">
              <div className="text-8xl font-bold text-primary-light mb-4">100%</div>
              <div className="text-xl font-poppins font-bold text-white tracking-wide">DIGITAL & INTÉGRÉ</div>
              <p className="mt-4 text-slate-400">Fini les emails perdus et les feuilles de papier.</p>
            </div>
          </Card>
        </div>

        {/* Who it's for */}
        <section className="bg-slate-950 rounded-[3rem] p-12 md:p-20 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="text-center mb-16 relative z-10">
            <h2 className="text-3xl font-bold text-white mb-4">Pour qui avons-nous conçu AbsenceFlow ?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">Une solution modulaire adaptée à chaque profil de l'écosystème universitaire.</p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {[
              { role: "Administration", desc: "Contrôle total sur les validations et vision globale de l'établissement." },
              { role: "Enseignants", desc: "Interface simple pour déclarer les absences et replanifier les cours." },
              { role: "Étudiants", desc: "Notifications instantanées et emploi du temps toujours à jour." },
              { role: "Responsables IT", desc: "Système robuste, API complète et facile à maintenir." }
            ].map((item, i) => (
              <Card key={i} className="bg-white/5 border-white/10 text-white hover:bg-white/10 transition-all duration-300">
                <CardHeader>
                  <CardTitle className="text-primary-light font-bold text-lg">{item.role}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-300 text-sm leading-relaxed">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
