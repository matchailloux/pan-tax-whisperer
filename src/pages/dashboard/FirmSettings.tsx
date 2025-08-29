import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useOrganization } from '@/hooks/useOrganization';
import { Building2, Mail, Phone, MapPin } from 'lucide-react';

const FirmSettings = () => {
  const { organization } = useOrganization();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold">Paramètres du Cabinet</h2>
        <p className="text-muted-foreground mt-1">
          Gérez les informations de votre cabinet comptable
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Informations générales
            </CardTitle>
            <CardDescription>
              Détails de votre cabinet comptable
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firm-name">Nom du cabinet</Label>
              <Input 
                id="firm-name" 
                defaultValue={organization?.name || ''} 
                placeholder="Nom de votre cabinet"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firm-description">Description</Label>
              <Textarea 
                id="firm-description" 
                defaultValue={organization?.description || ''} 
                placeholder="Description de votre cabinet"
                rows={3}
              />
            </div>
            
            <Button>Sauvegarder</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Coordonnées
            </CardTitle>
            <CardDescription>
              Informations de contact du cabinet
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firm-email">Email professionnel</Label>
              <Input 
                id="firm-email" 
                type="email"
                placeholder="contact@votrecabinet.fr"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firm-phone">Téléphone</Label>
              <Input 
                id="firm-phone" 
                type="tel"
                placeholder="+33 1 23 45 67 89"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="firm-address">Adresse</Label>
              <Textarea 
                id="firm-address" 
                placeholder="Adresse complète du cabinet"
                rows={3}
              />
            </div>
            
            <Button>Sauvegarder</Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Préférences TVA</CardTitle>
          <CardDescription>
            Configuration des paramètres de traitement TVA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Configuration en cours de développement
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FirmSettings;