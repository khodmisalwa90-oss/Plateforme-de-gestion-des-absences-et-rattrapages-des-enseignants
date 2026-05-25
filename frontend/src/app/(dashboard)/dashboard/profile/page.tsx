import ProfileForm from "@/components/dashboard/ProfileForm";
import DashboardHeader from "@/components/dashboard/DashboardHeader";

export const metadata = {
  title: "Mon Profil | AbsenceFlow",
  description: "Gérez vos informations personnelles et vos paramètres de sécurité.",
};

export default function ProfilePage() {
  return (
    <div className="space-y-8 max-w-7xl mx-auto px-1">
      <DashboardHeader 
        title="Mon Profil" 
        subtitle="Gérez vos informations personnelles et vos paramètres de sécurité." 
      />

      <div className="max-w-4xl">
        <ProfileForm />
      </div>
    </div>
  );
}

