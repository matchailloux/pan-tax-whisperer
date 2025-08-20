import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HelpCircle, BookOpen, MessageCircle, Mail, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HelpPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Aide</h2>
        <p className="text-muted-foreground">
          Documentation, guides et support pour utiliser TVA Analysis Pro
        </p>
      </div>

      {/* Quick Help */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Guide de démarrage
            </CardTitle>
            <CardDescription>
              Apprenez les bases en quelques minutes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">
              Commencer le guide
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="h-5 w-5" />
              FAQ
            </CardTitle>
            <CardDescription>
              Réponses aux questions fréquentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              Voir la FAQ
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Support direct
            </CardTitle>
            <CardDescription>
              Contactez notre équipe support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="outline" className="w-full">
              <Mail className="mr-2 h-4 w-4" />
              Envoyer un message
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Documentation */}
      <Card>
        <CardHeader>
          <CardTitle>Documentation</CardTitle>
          <CardDescription>
            Guides détaillés pour maîtriser toutes les fonctionnalités
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Comment obtenir votre rapport TVA Amazon</h4>
                  <p className="text-sm text-muted-foreground">
                    Guide étape par étape pour télécharger vos données depuis Seller Central
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Comprendre les résultats d'analyse</h4>
                  <p className="text-sm text-muted-foreground">
                    Explication détaillée des différents types de TVA et classifications
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Utiliser le moteur de règles personnalisées</h4>
                  <p className="text-sm text-muted-foreground">
                    Configuration avancée pour des besoins spécifiques
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">Export et intégration comptable</h4>
                  <p className="text-sm text-muted-foreground">
                    Comment utiliser les exports Excel avec votre logiciel comptable
                  </p>
                </div>
                <Button variant="ghost" size="sm">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Support Options */}
      <Card>
        <CardHeader>
          <CardTitle>Options de support</CardTitle>
          <CardDescription>
            Différentes façons d'obtenir de l'aide
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Email Support</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Réponse sous 24h en français
              </p>
              <Button variant="outline" size="sm">
                support@tvaanalysis.pro
              </Button>
            </div>

            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Chat en direct</h4>
              <p className="text-sm text-muted-foreground mb-4">
                Disponible du lundi au vendredi, 9h-18h
              </p>
              <Button variant="outline" size="sm">
                Ouvrir le chat
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HelpPage;