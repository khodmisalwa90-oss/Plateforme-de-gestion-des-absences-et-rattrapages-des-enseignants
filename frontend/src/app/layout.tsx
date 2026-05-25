import type { Metadata } from "next";
import { Inter, Poppins, Geist } from "next/font/google";
import "../styles/globals.css";
import Header from "@/components/ui/Header";
import Footer from "@/components/ui/Footer";
import { cn } from "@/lib/utils";
import SessionProvider from "@/components/providers/SessionProvider";
import ConditionalLayout from "@/components/layout/ConditionalLayout";
import { Toaster } from "sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Gestion des Absences & Rattrapages",
  description: "Plateforme moderne de gestion des absences des enseignants et organisation des séances de rattrapage.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={cn(inter.variable, poppins.variable, "font-sans", geist.variable)}>
      <body className="min-h-screen flex flex-col bg-neutral-background text-slate-primary">
        <SessionProvider>
          <ConditionalLayout>
            {children}
            <Toaster position="top-right" richColors />
          </ConditionalLayout>
        </SessionProvider>
      </body>
    </html>
  );
}
