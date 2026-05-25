"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Calendar, 
  UserRound, 
  FileWarning, 
  Users, 
  GraduationCap,
  LogOut,
  Clock,
  BookOpen,
  Building2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession, signOut } from "next-auth/react";
import { Sheet, SheetContent } from "@/components/ui/sheet";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const user = session?.user;
  const role = (user as any)?.role;

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024 && isOpen && onClose) {
        onClose();
      }
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isOpen, onClose]);

  const getDashboardHref = () => {
    if (role === "admin_systeme" || role === "administration") return "/dashboard/admin";
    if (role === "enseignant") return "/dashboard/enseignant";
    if (role === "etudiant") return "/dashboard/etudiant";
    return "/dashboard";
  };

  const mainNavigation = [
    { name: "Vue d'ensemble", href: getDashboardHref(), icon: LayoutDashboard },
    { name: "Mon Profil", href: "/dashboard/profile", icon: UserRound },
  ];

  const teacherNavigation = [
    { name: "Emploi du temps", href: "/dashboard/enseignant/emplois-du-temps", icon: Calendar },
    { name: "Groupes", href: "/dashboard/enseignant/groupes", icon: Users },
    { name: "Matières", href: "/dashboard/enseignant/matieres", icon: BookOpen },
    { name: "Salles", href: "/dashboard/enseignant/salles", icon: Building2 },
    { name: "Mes Absences", href: "/dashboard/enseignant/absences", icon: FileWarning },
    { name: "Mes Rattrapages", href: "/dashboard/enseignant/rattrapages", icon: Calendar },
  ];

  const studentNavigation = [
    { name: "Emploi du temps", href: "/dashboard/etudiant/emplois-du-temps", icon: Calendar },
    { name: "Salles", href: "/dashboard/etudiant/salles", icon: Building2 },
    { name: "Rattrapages prévus", href: "/dashboard/etudiant/rattrapages", icon: Clock },
  ];

  const adminNavItems = [
    ...(role === "admin_systeme" ? [{ name: "Gestion Utilisateurs", href: "/dashboard/admin/users", icon: Users }] : []),
    { name: "Départements", href: "/dashboard/admin/departements", icon: GraduationCap },
    { name: "Matières", href: "/dashboard/admin/matieres", icon: BookOpen },
    { name: "Groupes", href: "/dashboard/admin/groupes", icon: Users },
    { name: "Salles", href: "/dashboard/admin/salles", icon: Building2 },
    { name: "Emplois du temps", href: "/dashboard/admin/emplois-du-temps", icon: Calendar },
    { name: "Suivi Absences", href: "/dashboard/admin/absences", icon: FileWarning },
    { name: "Suivi Rattrapages", href: "/dashboard/admin/rattrapages", icon: Clock },
  ];

  const renderContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-6 border-b border-slate-800 flex items-center justify-between">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="font-poppins font-bold text-xl tracking-tight">
            Lo<span className="text-primary-light">Go</span>
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-8 mt-4">
        {/* Main Nav */}
        <div>
          <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
            Espace Personnel
          </p>
          <nav className="space-y-1">
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                    isActive 
                      ? "bg-primary text-white shadow-lg shadow-primary/20" 
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  )}
                >
                  <item.icon size={20} className={cn(isActive ? "text-white" : "text-slate-500 group-hover:text-primary-light")} />
                  <span className="font-medium">{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Role-Specific Nav */}
        {role === "enseignant" && (
          <div>
            <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
              Enseignant
            </p>
            <nav className="space-y-1">
              {teacherNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-primary-light"} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {role === "etudiant" && (
          <div>
            <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
              Étudiant
            </p>
            <nav className="space-y-1">
              {studentNavigation.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-primary-light"} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}

        {/* Admin Nav */}
        {(role === "admin_systeme" || role === "administration") && (
          <div>
            <p className="px-4 text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">
              Administration
            </p>
            <nav className="space-y-1">
              {adminNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                      isActive ? "bg-primary text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    )}
                  >
                    <item.icon size={20} className={isActive ? "text-white" : "text-slate-500 group-hover:text-primary-light"} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Sidebar Footer */}
      <div className="p-4 border-t border-slate-800">
        <button 
          onClick={() => signOut({ callbackUrl: "/" })}
          className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-all group"
        >
          <LogOut size={20} className="group-hover:scale-110 transition-transform" />
          <span className="font-medium">Déconnexion</span>
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-72 flex-col bg-slate-900 text-white h-screen sticky top-0 border-r border-slate-800">
        {renderContent()}
      </aside>

      {/* Mobile Sidebar overlay */}
      <Sheet open={isOpen} onOpenChange={(open) => !open && onClose && onClose()}>
        <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-r border-slate-800 text-white flex flex-col">
          {renderContent()}
        </SheetContent>
      </Sheet>
    </>
  );
}
