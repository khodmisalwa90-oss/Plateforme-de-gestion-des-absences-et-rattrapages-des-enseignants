import React from "react";
import { 
  ClipboardCheck, 
  Search, 
  BarChart, 
  Settings, 
  Users, 
  CalendarDays, 
  BellRing, 
  FileCheck2 
} from "lucide-react";
import Container from "@/components/ui/Container";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Badge } from "@/components/ui/badge";

export default function FeaturesPage() {
  const roles = [
    {
      id: "teachers",
      title: "Enseignants",
      iconColor: "text-blue-600",
      features: [
        { icon: ClipboardCheck, title: "Déclaration d'absence", desc: "Formulaire rapide avec ajout de justificatifs numérisés directement depuis votre mobile." },
        { icon: CalendarDays, title: "Proposition de rattrapage", desc: "Suggérez des créneaux en fonction des disponibilités réelles des salles et des groupes." },
        { icon: Search, title: "Historique personnel", desc: "Suivez l'état de vos demandes, vos séances passées et vos statistiques de rattrapage." }
      ]
    },
    {
      id: "admin",
      title: "Administration",
      iconColor: "text-amber-600",
      features: [
        { icon: FileCheck2, title: "Validation en un clic", desc: "Approuvez ou rejetez les demandes avec des motifs clairs et des notifications automatiques." },
        { icon: Settings, title: "Gestion des ressources", desc: "Gérez les salles, les départements, les matières et les emplois du temps de base." },
        { icon: BarChart, title: "Statistiques globales", desc: "Analysez les taux d'absence et l'efficacité des rattrapages pour piloter l'établissement." }
      ]
    },
    {
      id: "students",
      title: "Étudiants",
      iconColor: "text-green-600",
      features: [
        { icon: BellRing, title: "Alertes instantanées", desc: "Recevez des notifications push ou email dès qu'un cours est annulé ou déplacé." },
        { icon: CalendarDays, title: "Planning à jour", desc: "Consultez votre emploi du temps personnalisé en temps réel sur n'importe quel appareil." },
        { icon: Users, title: "Gestion de groupe", desc: "Sachez exactement quels rattrapages concernent votre groupe ou votre filière." }
      ]
    }
  ];

  return (
    <div className="py-20 bg-background">
      <Container>
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-3 py-1 text-primary border-primary/20 bg-primary/5">
            Fonctionnalités
          </Badge>
          <h1 className="text-4xl md:text-5xl mb-6">Conçu pour l'excellence académique</h1>
          <p className="text-lg text-muted-foreground leading-relaxed">
            AbsenceFlow propose des outils spécifiques pour chaque acteur, garantissant une collaboration fluide et sans friction.
          </p>
        </div>

        <Tabs defaultValue="teachers" className="w-full">
          <div className="flex justify-center mb-12">
            <TabsList className="bg-slate-100 p-1 rounded-xl h-auto">
              {roles.map((role) => (
                <TabsTrigger 
                  key={role.id} 
                  value={role.id}
                  className="px-8 py-3 rounded-lg data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm font-bold transition-all"
                >
                  {role.title}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {roles.map((role) => (
            <TabsContent key={role.id} value={role.id} className="animate-in fade-in zoom-in duration-300">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {role.features.map((f, i) => (
                  <Card key={i} className="border-slate-100 shadow-sm hover:shadow-md transition-shadow p-4">
                    <CardHeader className="p-4">
                      <div className={`p-4 rounded-xl bg-slate-50 ${role.iconColor} w-fit mb-2`}>
                        <f.icon size={32} />
                      </div>
                      <CardTitle className="text-xl font-bold">{f.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4">
                      <CardDescription className="text-muted-foreground text-base leading-relaxed">
                        {f.desc}
                      </CardDescription>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </Container>
    </div>
  );
}
