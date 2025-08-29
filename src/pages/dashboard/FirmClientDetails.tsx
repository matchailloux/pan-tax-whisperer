import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, FileText, Send, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useClientAccounts } from '@/hooks/useClientAccounts';
import { useInvitations } from '@/hooks/useInvitations';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import CreateInvitationDialog from '@/components/CreateInvitationDialog';

const FirmClientDetails = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const { clientAccounts, loading: clientsLoading } = useClientAccounts();
  const { invitations, loading: invitationsLoading } = useInvitations();
  const [showInviteDialog, setShowInviteDialog] = useState(false);

  const client = clientAccounts.find(c => c.id === clientId);
  const clientInvitations = invitations.filter(inv => inv.client_account_id === clientId);

  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-muted-foreground mb-4">
          Client non trouvé
        </h2>
        <Button asChild variant="outline">
          <Link to="/dashboard/firm/clients">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux clients
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button asChild variant="outline" size="sm">
          <Link to="/dashboard/firm/clients">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{client.display_name}</h1>
          <p className="text-muted-foreground">
            Détails du client et gestion des dépôts
          </p>
        </div>
        <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
          <Send className="h-4 w-4" />
          Nouvelle invitation
        </Button>
      </div>

      {/* Client Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations du client
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Nom</label>
            <p className="text-lg">{client.display_name}</p>
          </div>
          
          {client.vat_number && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Numéro TVA</label>
              <p className="text-lg font-mono">{client.vat_number}</p>
            </div>
          )}
          
          {client.country && (
            <div>
              <label className="text-sm font-medium text-muted-foreground">Pays</label>
              <p className="text-lg">{client.country}</p>
            </div>
          )}
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Régime OSS</label>
            <div className="mt-1">
              <Badge variant={client.oss_opt_in ? "default" : "secondary"}>
                {client.oss_opt_in ? "Activé" : "Désactivé"}
              </Badge>
            </div>
          </div>
          
          <div>
            <label className="text-sm font-medium text-muted-foreground">Créé le</label>
            <p className="text-lg">{new Date(client.created_at).toLocaleDateString('fr-FR')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Invitations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Invitations de dépôt
          </CardTitle>
          <CardDescription>
            Liens d'invitation envoyés au client pour déposer ses fichiers TVA
          </CardDescription>
        </CardHeader>
        <CardContent>
          {invitationsLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner />
            </div>
          ) : clientInvitations.length > 0 ? (
            <div className="space-y-4">
              {clientInvitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <div className="font-medium">Période {invitation.period}</div>
                    <div className="text-sm text-muted-foreground">
                      Utilisé {invitation.used_count}/{invitation.max_uses} fois
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Expire le {new Date(invitation.expires_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={
                      new Date(invitation.expires_at) > new Date() 
                        ? invitation.used_count < invitation.max_uses ? "default" : "secondary"
                        : "destructive"
                    }>
                      {new Date(invitation.expires_at) > new Date() 
                        ? invitation.used_count < invitation.max_uses ? "Actif" : "Utilisé"
                        : "Expiré"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Aucune invitation</h3>
              <p className="text-muted-foreground mb-4">
                Aucune invitation de dépôt n'a encore été créée pour ce client.
              </p>
              <Button onClick={() => setShowInviteDialog(true)} className="gap-2">
                <Send className="h-4 w-4" />
                Créer une invitation
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* File Uploads */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Fichiers déposés
          </CardTitle>
          <CardDescription>
            Historique des fichiers TVA déposés par le client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Aucun fichier</h3>
            <p className="text-muted-foreground">
              Aucun fichier n'a encore été déposé par ce client.
            </p>
          </div>
        </CardContent>
      </Card>

      <CreateInvitationDialog
        open={showInviteDialog}
        onOpenChange={setShowInviteDialog}
        clientId={clientId}
        clientName={client.display_name}
      />
    </div>
  );
};

export default FirmClientDetails;