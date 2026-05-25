import React from "react";
import Link from "next/link";
import { GraduationCap, Mail, Phone, MapPin } from "lucide-react";
import Container from "./Container";
import { Separator } from "@/components/ui/separator";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-300 py-16">
      <Container>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="space-y-6">
            <Link href="/" className="flex items-center gap-2 group w-fit">
              <span className="font-poppins font-bold text-xl text-white tracking-tight">
                Lo<span className="text-primary-light">Go</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed">
              La solution intelligente pour la gestion des absences et l'organisation des rattrapages dans l'enseignement supérieur.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Navigation</h4>
            <ul className="space-y-4">
              {[
                { name: "Accueil", href: "/" },
                { name: "Fonctionnalités", href: "/features" },
                { name: "À propos", href: "/about" },
                { name: "Contact", href: "/contact" }
              ].map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-slate-400 text-sm hover:text-primary-light transition-colors">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Solutions */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Solution</h4>
            <ul className="space-y-4">
              {["Gestion des Absences", "Planning des Rattrapages", "Notifications Temps Réel", "Tableaux de Bord"].map((item) => (
                <li key={item} className="text-slate-400 text-sm">{item}</li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-6 uppercase text-xs tracking-widest">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Mail size={16} className="text-primary-light" />
                contact@absenceflow.univ.fr
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <Phone size={16} className="text-primary-light" />
                +33 1 23 45 67 89
              </li>
              <li className="flex items-center gap-3 text-slate-400 text-sm">
                <MapPin size={16} className="text-primary-light" />
                Université de Paris, France
              </li>
            </ul>
          </div>
        </div>

        <Separator className="bg-white/10" />

        <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-[10px] uppercase tracking-widest">
          <p>© {currentYear} AbsenceFlow. Tous droits réservés.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-white transition-colors">Mentions Légales</Link>
            <Link href="#" className="hover:text-white transition-colors">Confidentialité</Link>
          </div>
        </div>
      </Container>
    </footer>
  );
};

export default Footer;
