import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Book, MessageCircle, Mail, Phone } from 'lucide-react';

const FirmHelp = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Centre d'aide Cabinet</h2>
        <p className="text-muted-foreground mt-1">
          Support et documentation pour les cabinets comptables
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Book className="h-5 w-5" />
              Documentation Cabinet
            </CardTitle>
            <CardDescription>
              Guides spécifiques aux cabinets comptables
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start">
              Guide de démarrage cabinet
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Gestion des clients
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Analyses TVA groupées
            </Button>
            <Button variant="outline" className="w-full justify-start">
              Rapports et exports
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Support Dédié
            </CardTitle>
            <CardDescription>
              Assistance prioritaire pour les cabinets
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full gap-2">
              <Mail className="h-4 w-4" />
              Contacter le support cabinet
            </Button>
            <Button variant="outline" className="w-full gap-2">
              <Phone className="h-4 w-4" />
              Support téléphonique
            </Button>
            <div className="text-sm text-muted-foreground">
              Temps de réponse : 2h en moyenne
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Questions Fréquentes Cabinet
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-medium">Comment inviter un nouveau client ?</h4>
            <p className="text-sm text-muted-foreground">
              Depuis la section Clients, cliquez sur "Nouveau Client" puis générez un lien d'invitation sécurisé.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Comment voir les analyses de mes clients ?</h4>
            <p className="text-sm text-muted-foreground">
              Chaque client a sa propre page avec l'historique des fichiers et analyses. Accédez-y depuis la liste des clients.
            </p>
          </div>
          
          <div className="space-y-2">
            <h4 className="font-medium">Comment générer un rapport global ?</h4>
            <p className="text-sm text-muted-foreground">
              Utilisez la section "Rapports globaux" pour obtenir une vue consolidée de tous vos clients.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirmHelp;