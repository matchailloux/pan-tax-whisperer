import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  CreditCard,
  Settings
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

const settingsMenuItems = [
  {
    title: "Profil",
    description: "Informations personnelles et contact",
    url: "/dashboard/settings",
    icon: User,
  },
  {
    title: "Préférences",
    description: "Langue, fuseau horaire et devise",
    url: "/dashboard/settings/preferences",
    icon: Palette,
  },
  {
    title: "Notifications",
    description: "Emails et alertes",
    url: "/dashboard/settings/notifications",
    icon: Bell,
  },
  {
    title: "Sécurité",
    description: "Mot de passe et 2FA",
    url: "/dashboard/settings/security",
    icon: Shield,
  },
  {
    title: "Juridictions",
    description: "Numéros de TVA par pays",
    url: "/dashboard/settings/jurisdictions",
    icon: Globe,
  },
  {
    title: "Facturation",
    description: "Abonnement et paiements",
    url: "/dashboard/settings/billing",
    icon: CreditCard,
  },
];

const SettingsLayout = () => {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard/settings") {
      return location.pathname === "/dashboard/settings";
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Paramètres</h2>
        <p className="text-muted-foreground">
          Gérez votre profil et vos préférences
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Settings Navigation */}
        <Card className="lg:col-span-1">
          <CardContent className="p-6">
            <nav className="space-y-2">
              {settingsMenuItems.map((item) => (
                <Link key={item.url} to={item.url}>
                  <Button
                    variant={isActive(item.url) ? "secondary" : "ghost"}
                    className={cn(
                      "w-full justify-start gap-3 h-auto p-3",
                      isActive(item.url) && "bg-accent text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{item.title}</div>
                      <div className="text-xs text-muted-foreground hidden sm:block">
                        {item.description}
                      </div>
                    </div>
                  </Button>
                </Link>
              ))}
            </nav>
          </CardContent>
        </Card>

        {/* Settings Content */}
        <div className="lg:col-span-3">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayout;