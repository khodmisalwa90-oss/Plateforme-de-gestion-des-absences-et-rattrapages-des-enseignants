"use client";

import { useSession, signOut } from "next-auth/react";
import { Search, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import Link from "next/link";
import { NotificationBell } from "./NotificationBell";

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <header className="h-20 border-b border-slate-200 bg-white sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
      {/* Search / Context */}
      <div className="flex items-center gap-4 flex-1">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenuClick}>
          <Menu size={20} />
        </Button>
        <div className="relative hidden md:block w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Rechercher une absence, un groupe..."
            className="w-full bg-slate-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2 md:gap-4">
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" className="flex items-center gap-3 pl-2 pr-1 rounded-full hover:bg-slate-50">
                <div className="hidden md:block text-right">
                  <p className="text-sm font-bold text-slate-900 leading-none">
                    {user?.nom} {user?.prenom}
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">
                    {user?.role?.replace("_", " ")}
                  </p>
                </div>
                <Avatar className="h-10 w-10 border-2 border-primary/10">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-primary/5 text-primary font-bold">
                    {user?.nom?.[0]}{user?.prenom?.[0]}
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 shadow-xl border-slate-100">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="font-bold px-3 py-2 text-slate-500">Mon Compte</DropdownMenuLabel>
              <DropdownMenuSeparator className="my-1" />
              <Link href="/dashboard/profile">
                <DropdownMenuItem className="rounded-lg cursor-pointer px-3 py-2 text-sm group">
                  <User size={16} className="mr-2 text-slate-400 group-hover:text-primary transition-colors" /> Profil
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-lg cursor-pointer px-3 py-2 text-sm text-red-500 focus:text-red-600 focus:bg-red-50 group"
              >
                <LogOut size={16} className="mr-2 group-hover:scale-110 transition-transform" /> Déconnexion
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
