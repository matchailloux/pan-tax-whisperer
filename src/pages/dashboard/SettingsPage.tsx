import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Palette,
  Globe,
  Mail,
  Phone,
  Building,
  CreditCard,
  Users,
  Key,
  AlertTriangle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const SettingsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    address: '',
    city: '',
    country: 'FR'
  });

  const [preferences, setPreferences] = useState({
    language: 'fr',
    timezone: 'Europe/Paris',
    dateFormat: 'dd/MM/yyyy',
    currency: 'EUR',
    darkMode: false,
    autoAnalysis: true,
    emailNotifications: true,
    browserNotifications: true,
    weeklyReports: true,
    securityAlerts: true
  });

  const [billing, setBilling] = useState({
    plan: 'free',
    billingCycle: 'monthly',
    autoRenew: true
  });

  const handleSaveProfile = () => {
    toast({
      title: "Profil mis à jour",
      description: "Vos informations personnelles ont été sauvegardées.",
    });
  };

  const handleSavePreferences = () => {
    toast({
      title: "Préférences sauvegardées",
      description: "Vos paramètres ont été mis à jour.",
    });
  };

  const handleChangePassword = () => {
    toast({
      title: "Changement de mot de passe",
      description: "Un email de réinitialisation vous a été envoyé.",
    });
  };

  const handleEnable2FA = () => {
    toast({
      title: "Authentification à deux facteurs",
      description: "Configuration de la 2FA en cours...",
    });
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

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Modifiez vos informations de profil et de contact
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                L'email ne peut pas être modifié
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({...profileData, phone: e.target.value})}
                placeholder="+33 1 23 45 67 89"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input
                id="firstName"
                type="text"
                value={profileData.firstName}
                onChange={(e) => setProfileData({...profileData, firstName: e.target.value})}
                placeholder="Jean"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input
                id="lastName"
                type="text"
                value={profileData.lastName}
                onChange={(e) => setProfileData({...profileData, lastName: e.target.value})}
                placeholder="Dupont"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="company">Entreprise</Label>
            <div className="flex">
              <div className="flex items-center justify-center px-3 border border-r-0 rounded-l-md bg-muted">
                <Building className="h-4 w-4 text-muted-foreground" />
              </div>
              <Input
                id="company"
                type="text"
                value={profileData.company}
                onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                placeholder="Nom de votre entreprise"
                className="rounded-l-none"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="address">Adresse</Label>
              <Input
                id="address"
                type="text"
                value={profileData.address}
                onChange={(e) => setProfileData({...profileData, address: e.target.value})}
                placeholder="123 Rue de la Paix"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">Ville</Label>
              <Input
                id="city"
                type="text"
                value={profileData.city}
                onChange={(e) => setProfileData({...profileData, city: e.target.value})}
                placeholder="Paris"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Pays</Label>
              <Select value={profileData.country} onValueChange={(value) => setProfileData({...profileData, country: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un pays" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FR">France</SelectItem>
                  <SelectItem value="BE">Belgique</SelectItem>
                  <SelectItem value="DE">Allemagne</SelectItem>
                  <SelectItem value="ES">Espagne</SelectItem>
                  <SelectItem value="IT">Italie</SelectItem>
                  <SelectItem value="NL">Pays-Bas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button onClick={handleSaveProfile}>
            Sauvegarder les modifications
          </Button>
        </CardContent>
      </Card>

      {/* Application Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Préférences d'application
          </CardTitle>
          <CardDescription>
            Personnalisez votre expérience utilisateur
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <Select value={preferences.language} onValueChange={(value) => setPreferences({...preferences, language: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une langue" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fr">Français</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="de">Deutsch</SelectItem>
                    <SelectItem value="es">Español</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Fuseau horaire</Label>
                <Select value={preferences.timezone} onValueChange={(value) => setPreferences({...preferences, timezone: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fuseau" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Europe/Paris">Europe/Paris (UTC+1)</SelectItem>
                    <SelectItem value="Europe/London">Europe/London (UTC+0)</SelectItem>
                    <SelectItem value="Europe/Berlin">Europe/Berlin (UTC+1)</SelectItem>
                    <SelectItem value="America/New_York">America/New_York (UTC-5)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Devise</Label>
                <Select value={preferences.currency} onValueChange={(value) => setPreferences({...preferences, currency: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une devise" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                    <SelectItem value="CHF">Swiss Franc (CHF)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Mode sombre</Label>
                  <p className="text-sm text-muted-foreground">
                    Activer le thème sombre
                  </p>
                </div>
                <Switch
                  checked={preferences.darkMode}
                  onCheckedChange={(checked) => setPreferences({...preferences, darkMode: checked})}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Analyses automatiques</Label>
                  <p className="text-sm text-muted-foreground">
                    Lancer automatiquement l'analyse après import
                  </p>
                </div>
                <Switch
                  checked={preferences.autoAnalysis}
                  onCheckedChange={(checked) => setPreferences({...preferences, autoAnalysis: checked})}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateFormat">Format de date</Label>
                <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({...preferences, dateFormat: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Format de date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dd/MM/yyyy">DD/MM/YYYY</SelectItem>
                    <SelectItem value="MM/dd/yyyy">MM/DD/YYYY</SelectItem>
                    <SelectItem value="yyyy-MM-dd">YYYY-MM-DD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={handleSavePreferences}>
            Sauvegarder les préférences
          </Button>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications
          </CardTitle>
          <CardDescription>
            Configurez vos préférences de notification
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Notifications email
                </Label>
                <p className="text-sm text-muted-foreground">
                  Recevoir des emails pour les analyses terminées
                </p>
              </div>
              <Switch
                checked={preferences.emailNotifications}
                onCheckedChange={(checked) => setPreferences({...preferences, emailNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Notifications navigateur</Label>
                <p className="text-sm text-muted-foreground">
                  Afficher les notifications dans le navigateur
                </p>
              </div>
              <Switch
                checked={preferences.browserNotifications}
                onCheckedChange={(checked) => setPreferences({...preferences, browserNotifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Rapports hebdomadaires</Label>
                <p className="text-sm text-muted-foreground">
                  Résumé de votre activité chaque semaine
                </p>
              </div>
              <Switch
                checked={preferences.weeklyReports}
                onCheckedChange={(checked) => setPreferences({...preferences, weeklyReports: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Alertes de sécurité
                </Label>
                <p className="text-sm text-muted-foreground">
                  Notifications en cas d'activité suspecte
                </p>
              </div>
              <Switch
                checked={preferences.securityAlerts}
                onCheckedChange={(checked) => setPreferences({...preferences, securityAlerts: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Gérez la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  <span className="font-medium">Mot de passe</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Dernière modification : Il y a 30 jours
                </p>
              </div>
              <Button variant="outline" onClick={handleChangePassword}>
                Modifier
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="font-medium">Authentification à deux facteurs</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Ajoutez une couche de sécurité supplémentaire
                </p>
              </div>
              <Button onClick={handleEnable2FA}>
                Activer
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  <span className="font-medium">Sessions actives</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Gérez vos connexions actives
                </p>
              </div>
              <Button variant="outline">
                Voir les sessions
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Billing & Subscription */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Facturation et abonnement
          </CardTitle>
          <CardDescription>
            Gérez votre abonnement et vos moyens de paiement
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <span className="font-medium">Plan actuel</span>
              <p className="text-sm text-muted-foreground">
                Gratuit - 1GB de stockage, analyses illimitées
              </p>
            </div>
            <Button>
              Mettre à niveau
            </Button>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Renouvellement automatique</Label>
                <p className="text-sm text-muted-foreground">
                  Renouveler automatiquement votre abonnement
                </p>
              </div>
              <Switch
                checked={billing.autoRenew}
                onCheckedChange={(checked) => setBilling({...billing, autoRenew: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Actions irréversibles sur votre compte
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div className="space-y-1">
                <span className="font-medium">Supprimer toutes les données</span>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement tous vos fichiers et rapports
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Supprimer les données
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-destructive/20 rounded-lg">
              <div className="space-y-1">
                <span className="font-medium">Supprimer le compte</span>
                <p className="text-sm text-muted-foreground">
                  Supprime définitivement votre compte et toutes vos données
                </p>
              </div>
              <Button variant="destructive" size="sm">
                Supprimer le compte
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPage;